<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        // Get current route name
        $routeName = $request->route()->getName();

        // Allowed routes that don't need check (login, logout, etc.)
        $allowedRoutes = ['login', 'postLogin', 'logout', 'notifications.read', 'notifications.read-all']; // dashboard is now controlled by permissions

        if (in_array($routeName, $allowedRoutes)) {
            return $next($request);
        }

        // Check if user has permission
        if (!$user->hasPermission($routeName)) {
            // Check for grouped permissions (e.g., if it's a sub-route admin.karyawan.store, check admin.karyawan)
            $parts = explode('.', $routeName);
            while (count($parts) > 1) {
                array_pop($parts);
                $parentRoute = implode('.', $parts);
                if ($user->hasPermission($parentRoute)) {
                    return $next($request);
                }
            }
            
            abort(403, 'Akses ditolak. Anda tidak memiliki izin untuk mengakses fitur ini.');
        }

        return $next($request);
    }
}
