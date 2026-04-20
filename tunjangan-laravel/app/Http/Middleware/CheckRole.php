<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Allow admin to bypass role checks, or check if role matches
        if (!$request->user() || ($request->user()->role !== 'admin' && $request->user()->role !== $role)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthorized. Access restricted to ' . $role . ' role.'], 403);
            }
            
            return redirect('/')->with('error', 'Anda tidak memiliki akses ke halaman ini.');
        }

        return $next($request);
    }
}
