<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
        ]);

        Auth::login($user);

        return response()->json([
            'user' => $user,
            'message' => 'Registration successful.',
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

        $request->session()->regenerate();

        return response()->json([
            'user' => Auth::user(),
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request)
    {
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
        if (!$currentUser || !in_array($currentUser->role, ['admin', 'superadmin'])) {
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
            'role' => 'required|string|in:member,officer,admin,superadmin',
        ]);

        $user = User::findOrFail($id);
        
        // Prevent Super Admin from changing their own role to avoid self-lockout
        if ($user->id === $currentUser->id && $validated['role'] !== 'superadmin') {
            return response()->json([
                'error' => 'Action Rejected. The primary Club Moderator cannot demote themselves.'
            ], 400);
        }

        $user->update([
            'role' => $validated['role']
        ]);

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }
}
