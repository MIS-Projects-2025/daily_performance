<?php
//Template
namespace App\Http\Controllers\General;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        $emp_id = session('emp_data.emp_id');

        $employee = $emp_id
            ? Employee::with(['details', 'departments'])
                ->where('EMPLOYID', $emp_id)
                ->first()
            : null;

        $profile = null;

        if ($employee) {
            $fullName = 'NA';
            if ($employee->details) {
                $nameParts = array_filter([
                    $employee->details->firstname,
                    $employee->details->middlename,
                    $employee->details->lastname,
                ]);
                $fullName = !empty($nameParts) ? implode(' ', $nameParts) : 'NA';
            }

            $profile = [
                'EMPLOYID'   => $employee->EMPLOYID,
                'EMPNAME'    => $fullName,
                'JOB_TITLE'  => '',
                'DEPARTMENT' => $employee->departments->pluck('dep_name')->implode(', ') ?: 'NA',
                'EMAIL'      => $employee->details->email ?? 'NA',
                'PASSWRD'    => str_repeat('•', 8),
            ];
        }

        return Inertia::render('Profile', [
            'profile' => $profile,
        ]);
    }

    public function changePassword(Request $request)
    {
        $credentials = $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|confirmed',
        ], [
            'current_password.required' => 'The current password field is required.',
            'new_password.required'     => 'The new password field is required.',
            'new_password.confirmed'    => 'The new password and confirmation do not match.',
        ]);

        $emp_id = session('emp_data.emp_id');

        $employee = Employee::where('EMPLOYID', $emp_id)->first();

        if (!$employee) {
            return back()->withErrors(['current_password' => 'Employee not found.']);
        }

        $hashedCurrent = hash('sha256', $credentials['current_password']);

        if ($hashedCurrent !== $employee->getRawOriginal('PASSWRD')) {
            return back()->withErrors(['current_password' => 'Current password is incorrect.']);
        }

        $employee->update([
            'PASSWRD' => hash('sha256', $credentials['new_password']),
        ]);

        return back()->with('success', 'Password changed successfully.');
    }

    public function verifyPassword(Request $request)
    {
        $request->validate(['password' => 'required']);

        $emp_id = session('emp_data.emp_id');
        $employee = Employee::where('EMPLOYID', $emp_id)->first();

        if (!$employee) {
            return response()->json(['valid' => false]);
        }

        $hashed = hash('sha256', $request->password);
        $valid = $hashed === $employee->getRawOriginal('PASSWRD');

        if ($valid) {
            // Unlock every session this user holds across every portal,
            // not just this one — so other locked tabs pick it up on
            // their next poll.
            \Illuminate\Support\Facades\DB::connection('authify')
                ->table('authify_sessions')
                ->where('emp_id', $emp_id)
                ->update(['locked_at' => null]);
        }

        return response()->json(['valid' => $valid]);
    }
}