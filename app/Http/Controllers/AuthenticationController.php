<?php
//Template
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthenticationController extends Controller
{
    private function resolveToken(Request $request): ?string
    {
        return session('emp_data.token')
            ?? $request->cookie(env('SSO_COOKIE_NAME', 'sso_token'));
    }

    public function logout(Request $request)
    {
        $token = $this->resolveToken($request);

        session()->forget('emp_data');
        session()->flush();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $cookieName    = env('SSO_COOKIE_NAME', 'sso_token');
        $expiredCookie = cookie()->forget($cookieName);

        $redirectUrl = urlencode(route('dashboard'));
        $portalId    = config('services.authify.portal_id');

        // cascade=1: Authify ends ALL of this user's portal sessions
        return redirect(
            config('services.authify.base_url') . "/logout?token={$token}&redirect={$redirectUrl}&cascade=1&portal_id={$portalId}"
        )->withCookie($expiredCookie);
    }

    public function siblings(Request $request)
    {
        $token = $this->resolveToken($request);
        if (!$token) {
            return response()->json(['siblings' => []]);
        }

        $row = DB::connection('authify')->table('authify_sessions')->where('token', $token)->first();
        if (!$row) {
            return response()->json(['siblings' => []]);
        }

        $siblings = DB::connection('authify')->table('authify_sessions')
            ->where('emp_id', $row->emp_id)
            ->where('portal_id', '!=', $row->portal_id)
            ->pluck('portal_id');

        return response()->json(['siblings' => $siblings]);
    }

        public function sessions(Request $request)
    {
        $token = $this->resolveToken($request);
        if (!$token) {
            return response()->json(['sessions' => []]);
        }

        $row = DB::connection('authify')->table('authify_sessions')
            ->where('token', $token)
            ->first();

        if (!$row) {
            return response()->json(['sessions' => []]);
        }

        $sessions = DB::connection('authify')->table('authify_sessions')
            ->where('emp_id', $row->emp_id)
            ->orderBy('generated_at')
            ->get(['portal_id', 'generated_at', 'activity_at', 'locked_at'])
            ->map(fn ($s) => [
                'portal_id'    => $s->portal_id,
                'generated_at' => $s->generated_at,
                'activity_at'  => $s->activity_at,
                'locked'       => (bool) $s->locked_at,
                'is_current'   => $s->portal_id === $row->portal_id,
            ]);

        return response()->json(['sessions' => $sessions]);
    }
}