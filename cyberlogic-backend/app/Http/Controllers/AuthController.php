<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Permission;
use App\Services\ImageOptimizer;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle registration of a new user.
     */
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'school_id' => ['required', 'string', 'unique:users'],
            'year_level' => ['nullable', 'string'],
            'department' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'birthday' => ['nullable', 'date'],
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'school_id' => $request->school_id,
            'year_level' => $request->year_level,
            'department' => $request->department,
            'address' => $request->address,
            'birthday' => $request->birthday,
            'role' => 'member', // Default to standard member
            'status' => 'pending', // Default to pending approval
        ]);

        AuditLogger::log('registered', 'User', $user->id, $user->name, ['email' => $user->email], $request);

        return response()->json([
            'message' => 'Registration submitted successfully. Your account is pending review by an administrator or moderator.',
            'status' => 'pending',
        ], 201);
    }

    /**
     * Handle login of an existing user.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $user = Auth::user();
        if ($user->status === 'pending') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            throw ValidationException::withMessages([
                'email' => ['Your account registration is pending approval by an administrator or moderator.'],
            ]);
        }

        if ($user->status === 'rejected') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            throw ValidationException::withMessages([
                'email' => ['Your account registration request has been rejected. Please contact support.'],
            ]);
        }

        $request->session()->regenerate();

        AuditLogger::log('login', 'User', $user->id, $user->name, null, $request);

        return response()->json([
            'user' => $user,
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            AuditLogger::log('logout', 'User', $user->id, $user->name, null, $request);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => Auth::user(),
        ]);
    }

    /**
     * GET /api/users
     * List all registered members (Admin/Super Admin only).
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('manage_users')) {
            return response()->json(['error' => 'Forbidden. Access denied.'], 403);
        }

        $users = User::orderBy('id', 'desc')->get();
        return response()->json($users);
    }

    /**
     * PUT /api/users/{id}/role
     * Update user role (Super Admin / Club Moderator only).
     */
    public function updateRole(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || $currentUser->role !== 'superadmin') {
            return response()->json([
                'error' => 'Forbidden. Only the Club Moderator (Super Admin) can modify user access roles.'
            ], 403);
        }

        $validated = $request->validate([
            'role' => 'required|string|in:member,admin,superadmin',
        ]);

        $user = User::findOrFail($id);
        
        // Prevent Super Admin from changing their own role to avoid self-lockout
        if ($user->id === $currentUser->id && $validated['role'] !== 'superadmin') {
            return response()->json([
                'error' => 'Action Rejected. The primary Club Moderator cannot demote themselves.'
            ], 400);
        }

        $oldRole = $user->role;
        $updateData = ['role' => $validated['role']];

        // Clear admin_position and permissions when demoting from admin
        if ($validated['role'] === 'member') {
            $updateData['admin_position'] = null;
            $user->permissions()->detach();
        }

        $user->update($updateData);

        AuditLogger::log('role_changed', 'User', $user->id, $user->name, [
            'old_role' => $oldRole,
            'new_role' => $validated['role']
        ], $request);

        return response()->json([
            'success' => true,
            'user' => $user->fresh()
        ]);
    }

    /**
     * PUT /api/user/profile
     * Update current user's profile details.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'birthday' => ['nullable', 'date'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'expertise' => ['nullable', 'string', 'max:1000'],
        ]);

        $user->update($validated);

        AuditLogger::log('updated', 'User', $user->id, $user->name, [
            'fields' => array_keys($validated)
        ], $request);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => $user
        ]);
    }

    /**
     * PUT /api/user/password
     * Update current user's password securely.
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password does not match our records.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        AuditLogger::log('password_changed', 'User', $user->id, $user->name, null, $request);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }

    /**
     * POST /api/user/avatar
     * Upload and optimize user profile picture.
     */
    public function uploadAvatar(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,webp,jpg,gif', 'max:5120'],
        ]);

        if ($request->file('image')->isValid()) {
            // Delete old avatar file from disk if it exists
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            // Optimize and store new avatar using global optimizer service
            $path = ImageOptimizer::optimize($request->file('image'), 'avatars');

            $user->update([
                'avatar_path' => $path
            ]);

            AuditLogger::log('uploaded', 'User', $user->id, $user->name, ['type' => 'avatar'], $request);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture updated successfully.',
                'user' => $user
            ]);
        }

        return response()->json(['error' => 'Failed to upload profile picture.'], 400);
    }

    /**
     * PUT /api/users/{id}/approve
     * Approve a pending user registration (Admin/Super Admin only).
     */
    public function approve(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('manage_users')) {
            return response()->json(['error' => 'Forbidden. Access denied.'], 403);
        }

        $user = User::findOrFail($id);
        $user->update([
            'status' => 'approved'
        ]);

        AuditLogger::log('approved', 'User', $user->id, $user->name, null, $request);

        // Log mock email notification
        \Illuminate\Support\Facades\Log::info("Email notification: Account registration approved for User: {$user->email} ({$user->name})");

        return response()->json([
            'success' => true,
            'message' => "User {$user->name} has been approved successfully.",
            'user' => $user
        ]);
    }

    /**
     * DELETE /api/users/{id}
     * Reject and delete a registration request, or delete a user account (Admin/Super Admin only).
     */
    public function destroy(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('manage_users')) {
            return response()->json(['error' => 'Forbidden. Access denied.'], 403);
        }

        $user = User::findOrFail($id);
        
        // Prevent admins from deleting themselves
        if ($user->id === $currentUser->id) {
            return response()->json(['error' => 'Action Rejected. You cannot delete your own account.'], 400);
        }

        $userName = $user->name;
        $userEmail = $user->email;
        $userId = $user->id;
        $user->delete();

        AuditLogger::log('deleted', 'User', $userId, $userName, ['email' => $userEmail], $request);

        // Log rejection email notification
        \Illuminate\Support\Facades\Log::info("Email notification: Account registration rejected/deleted for User: {$userEmail} ({$userName})");

        return response()->json([
            'success' => true,
            'message' => "User {$userName} has been rejected and deleted successfully."
        ]);
    }

    /**
     * PUT /api/users/{id}/position
     * Update an admin user's position title (Superadmin only).
     */
    public function updatePosition(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || $currentUser->role !== 'superadmin') {
            return response()->json(['error' => 'Forbidden. Only the Super Admin can assign positions.'], 403);
        }

        $validated = $request->validate([
            'admin_position' => 'nullable|string|in:President,Vice President,Secretary,Auditor,Treasurer,PIO,1st Year Representative,2nd Year Representative,3rd Year Representative,4th Year Representative',
        ]);

        $user = User::findOrFail($id);

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Positions can only be assigned to admin users.'], 400);
        }

        $oldPosition = $user->admin_position;
        $user->update(['admin_position' => $validated['admin_position']]);

        AuditLogger::log('position_changed', 'User', $user->id, $user->name, [
            'old_position' => $oldPosition,
            'new_position' => $validated['admin_position'],
        ], $request);

        return response()->json([
            'success' => true,
            'user' => $user->fresh()
        ]);
    }

    /**
     * PUT /api/users/{id}/permissions
     * Sync an admin user's permissions (Superadmin only).
     */
    public function updatePermissions(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || $currentUser->role !== 'superadmin') {
            return response()->json(['error' => 'Forbidden. Only the Super Admin can assign permissions.'], 403);
        }

        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $user = User::findOrFail($id);

        if ($user->role === 'superadmin') {
            return response()->json(['error' => 'Super Admin permissions cannot be modified.'], 400);
        }

        $user->permissions()->sync($validated['permission_ids']);

        $permissionLabels = Permission::whereIn('id', $validated['permission_ids'])->pluck('label')->toArray();

        AuditLogger::log('permissions_updated', 'User', $user->id, $user->name, [
            'permissions' => $permissionLabels,
        ], $request);

        return response()->json([
            'success' => true,
            'user' => $user->fresh()
        ]);
    }

    /**
     * GET /api/permissions
     * List all available permissions (Superadmin only).
     */
    public function listPermissions(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser || $currentUser->role !== 'superadmin') {
            return response()->json(['error' => 'Forbidden. Access denied.'], 403);
        }

        $permissions = Permission::orderBy('group')->orderBy('label')->get();
        return response()->json($permissions);
    }
}
