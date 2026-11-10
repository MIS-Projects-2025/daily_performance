<?php
//Template
namespace App\Http\Middleware;

use App\Services\SystemStatusService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AuthMiddleware
{
    public function __construct(
        protected SystemStatusService $systemStatusService
    ) {}

    private function resolveToken(Request $request): ?string
    {
        $cookieName = env('SSO_COOKIE_NAME', 'sso_token');
        return $request->query('key')
            ?? session('emp_data.token')
            ?? $request->cookie($cookieName);
    }

    public function handle(Request $request, Closure $next)
    {
        $internalKey = config('services.internal.key');
        if ($internalKey && $request->header('X-Internal-Key') === $internalKey) {
            return $next($request);
        }

        $cookieName = env('SSO_COOKIE_NAME', 'sso_token');
        $tokenFromQuery = $request->query('key');
        $token = $this->resolveToken($request);

        if (!$token) {
            return $this->unauthorizedResponse($request);
        }

        $portalId = config('services.authify.portal_id');

        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();

        if (!$currentUser || $currentUser->portal_id !== $portalId) {
            session()->forget('emp_data');
            $expiredCookie = cookie()->forget($cookieName);
            return $this->redirectToLogin($request)->withCookie($expiredCookie);
        }

        $isFromAllowed = $currentUser->emp_from === null;
        if (!$isFromAllowed) {
            session()->forget('emp_data');
            session()->flush();
            $redirectUrl = urlencode(route('dashboard'));
            $authifyUrl  = config('services.authify.base_url')
                . "/logout?token={$token}&redirect={$redirectUrl}&portal_id={$portalId}";

            return Inertia::render('Unauthorized', [
                'logoutUrl' => $authifyUrl,
                'message'   => 'Access Restricted: You do not have permission to access this app.',
            ])->toResponse($request)->setStatusCode(403);
        }

        // Fast path — session already matches this valid token
        if (session()->has('emp_data') && session('emp_data.token') === $token) {
            $cookie = cookie($cookieName, $token, 60 * 24 * 7, '/', null, false, true);

            if ($tokenFromQuery) {
                $url = $this->stripKey($request);
                return redirect($url)->withCookie($cookie);
            }

            if (!$this->isBypassRoute($request)) {
                $maintenanceResponse = $this->checkMaintenance($request);
                if ($maintenanceResponse) {
                    return $maintenanceResponse;
                }
            }

            Cookie::queue($cookie);
            return $next($request);
        }

        // Rebuild session
        session(['emp_data' => [
            'token'               => $currentUser->token,
            'emp_id'              => $currentUser->emp_id,
            'emp_name'            => $currentUser->emp_name,
            'emp_firstname'       => $currentUser->emp_firstname,
            'emp_jobtitle'        => $currentUser->emp_jobtitle,
            'emp_dept'            => $currentUser->emp_dept,
            'emp_prodline'        => $currentUser->emp_prodline,
            'emp_station'         => $currentUser->emp_station,
            'emp_position'        => $currentUser->emp_position,
            'emp_job_level'       => $currentUser->emp_job_level,
            'emp_position_level'  => $currentUser->emp_position_level,
            'generated_at'        => $currentUser->generated_at,
        ]]);
        session()->save();

        $request->setUserResolver(fn() => (object) session('emp_data'));

        $cookie = cookie($cookieName, $currentUser->token, 60 * 24 * 7, '/', null, false, true);

        if ($tokenFromQuery) {
            $url = $this->stripKey($request);
            return redirect($url)->withCookie($cookie);
        }

        if (!$this->isBypassRoute($request)) {
            $maintenanceResponse = $this->checkMaintenance($request);
            if ($maintenanceResponse) {
                return $maintenanceResponse;
            }
        }

        Cookie::queue($cookie);
        return $next($request);
    }

    private function stripKey(Request $request): string
    {
        $url = $request->url();
        $query = $request->query();
        unset($query['key']);
        if (!empty($query)) {
            $url .= '?' . http_build_query($query);
        }
        return $url;
    }

    private function isBypassRoute(Request $request): bool
    {
        return $request->routeIs('logout')
            || $request->routeIs('system-status.online')
            || $request->routeIs('system-status.maintenance');
    }

    private function checkMaintenance(Request $request): mixed
    {
        if (!$this->systemStatusService->isInMaintenance()) {
            return null;
        }

        $logoutUrl = route('logout');
        $status    = $this->systemStatusService->getCurrent();

        return Inertia::render('Maintenance', [
            'emp_data'  => session('emp_data'),
            'message'   => $status->message,
            'logoutUrl' => $logoutUrl,
        ])->toResponse($request)->setStatusCode(503);
    }

    private function redirectToLogin(Request $request)
    {
        $query = $request->query();
        unset($query['key']);

        $cleanUrl = $request->url();
        if (!empty($query)) {
            $cleanUrl .= '?' . http_build_query($query);
        }

        $redirectUrl = urlencode($cleanUrl);
        $portalId    = config('services.authify.portal_id');
        $loginUrl    = config('services.authify.base_url') . "/login?redirect={$redirectUrl}&portal_id={$portalId}";

        return redirect($loginUrl);
    }

    private function unauthorizedResponse(Request $request)
    {
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json(['message' => 'Session expired. Please log in again.'], 401);
        }
        return $this->redirectToLogin($request);
    }
}