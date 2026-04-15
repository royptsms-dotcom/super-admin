<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function showLogin() {
        return view('auth.login');
    }

    public function postLogin(Request $request) {
        $credentials = $request->validate([
            'login' => 'required',
            'password' => 'required'
        ]);

        $field = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'employee_id';
        
        if (Auth::attempt([$field => $request->login, 'password' => $request->password])) {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                Auth::logout();
                return back()->withErrors(['login' => 'Akses ditolak. Dashboard hanya untuk Admin.']);
            }
            $request->session()->regenerate();
            return redirect()->intended('admin/dashboard');
        }

        return back()->withErrors(['login' => 'Kredensial tidak cocok.']);
    }

    public function logout(Request $request) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }

    // MODEL BARU ANTIGRAVITY
    public function apiLogin(Request $request) {
        $request->validate([
            'identifier' => 'required',
            'password'   => 'required'
        ]);

        // Cari berdasarkan ID Karyawan (Proritas) atau Email
        $user = User::where('employee_id', $request->identifier)
                    ->orWhere('email', $request->identifier)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            Log::warning("Gagal Login: " . $request->identifier);
            return response()->json(['error' => 'ID atau Password salah'], 401);
        }

        // Cek Role - User ONLY for API
        if ($user->role !== 'user') {
            return response()->json(['error' => 'Akses ditolak. Mobile App hanya untuk User.'], 403);
        }

        // Hapus token lama biar gak nyangkut
        $user->tokens()->delete();
        $token = $user->createToken('mobile-app')->plainTextToken;

        Log::info("Login Berhasil: " . $user->employee_id);

        return response()->json([
            'token' => $token,
            'user'  => [
                'employee_id' => $user->employee_id,
                'name'        => $user->name,
                'role'        => $user->role,
                'foto_url'    => $user->foto_url
            ]
        ]);
    }
}
