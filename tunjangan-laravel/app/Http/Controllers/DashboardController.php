<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $twoMonthsFromNow = Carbon::now()->addMonths(2);

        // Stats
        $inactiveCount = Certificate::where('expiry_date', '<', $now)->count();
        $expiringCount = Certificate::where('expiry_date', '>=', $now)
            ->where('expiry_date', '<', $twoMonthsFromNow)
            ->count();
        $activeCount = Certificate::where('expiry_date', '>=', $twoMonthsFromNow)->count();

        // Combined for chart 1
        $totalActive = $activeCount + $expiringCount;

        // Lists
        $inactiveList = Certificate::where('expiry_date', '<', $now)->orderBy('expiry_date', 'desc')->get();
        $expiringList = Certificate::where('expiry_date', '>=', $now)
            ->where('expiry_date', '<', $twoMonthsFromNow)
            ->orderBy('expiry_date', 'asc')
            ->get();

        return view('dashboard.index', compact(
            'totalActive', 'inactiveCount', 'activeCount', 'expiringCount',
            'inactiveList', 'expiringList'
        ));
    }
}
