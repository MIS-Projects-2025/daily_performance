<?php
//Template
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function closeBeacon(Request $request)
    {
        $token = $this->resolveToken($request);

        if ($token) {
            DB::connection('authify')->table('authify_sessions')
                ->where('token', $token)
                ->update(['pending_logout_at' => now()]);
        }

        return response()->noContent();
    }

    public function check(Request $request)
    {
        $token = $this->resolveToken($request);

        if (!$token) {
            return response()->json(['valid' => false]);
        }

        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();

        $portalId = config('services.authify.portal_id');
        $valid = $currentUser && $currentUser->portal_id === $portalId;

        // Most recent activity across ALL portals this user is signed into.
        $lastActivity = $currentUser
            ? DB::connection('authify')->table('authify_sessions')
                ->where('emp_id', $currentUser->emp_id)
                ->max('activity_at')
            : null;

        return response()->json([
            'valid'         => $valid,
            'locked'        => $currentUser ? (bool) $currentUser->locked_at : false,
            'last_activity' => $lastActivity,
        ]);
    }

    public function touch(Request $request)
    {
        $token = $this->resolveToken($request);
        if (!$token) {
            return response()->json(['ok' => false]);
        }

        DB::connection('authify')->table('authify_sessions')
            ->where('token', $token)
            ->update(['activity_at' => now()]);

        return response()->json(['ok' => true]);
    }

    private function resolveToken(Request $request): ?string
    {
        return session('emp_data.token')
            ?? $request->cookie(env('SSO_COOKIE_NAME', 'sso_token'));
    }

    public function lock(Request $request)
    {
        $token = $this->resolveToken($request);
        if (!$token) {
            return response()->json(['ok' => false]);
        }

        // Scoped to THIS portal's own row only — see AuthController::lock()
        // in Authify for the full rationale.
        $updated = DB::connection('authify')->table('authify_sessions')
            ->where('token', $token)
            ->update(['locked_at' => now()]);

        return response()->json(['ok' => (bool) $updated]);
    }
}