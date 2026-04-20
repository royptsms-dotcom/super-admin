<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/auth/login', [AuthController::class, 'apiLogin']);

Route::middleware(['auth:sanctum', 'role:user'])->group(function() {
    Route::get('/auth/profil', function (Request $request) {
        $user = $request->user();
        return [
            'employee_id' => $user->employee_id,
            'nama'        => $user->name,
            'email'       => $user->email,
            'no_wa'       => $user->no_wa,
            'job'         => $user->job,
            'role'        => $user->role,
            'foto_url'    => $user->foto_url ? url($user->foto_url) : null
        ];
    });

    Route::post('/auth/upload-foto', [AuthController::class, 'apiUploadFoto']);
    Route::post('/auth/update-group', function(Request $request) {
        $request->validate(['group_id' => 'required']);
        $request->user()->update(['wa_group_id' => $request->group_id]);
        return response()->json(['success' => true]);
    });
    Route::get('/master/rs', function() { return \App\Models\RumahSakit::all(); });
    Route::get('/master/users', function() { return \App\Models\User::where('is_active', 1)->get(['id', 'name as nama']); });
    Route::get('/master/config', function() { return \App\Models\Setting::first(); });
    Route::get('/lembur/draft', function(Request $request) { return \App\Models\Lembur::where('user_id', $request->user()->id)->where('status', 'draft')->get(); });
    
    Route::post('/share-lokasi', [\App\Http\Controllers\ShareLokasiController::class, 'apiStore']);
    Route::post('/lembur/foto', [\App\Http\Controllers\LemburController::class, 'apiFoto']);
    Route::post('/lembur/submit', [\App\Http\Controllers\LemburController::class, 'apiSubmit']);
    Route::post('/standby', [\App\Http\Controllers\StandbyController::class, 'store']);
    Route::get('/standby/status-hari-ini', [\App\Http\Controllers\StandbyController::class, 'statusHariIni']);
    Route::delete('/lembur/draft/{id}', function($id) { \App\Models\Lembur::destroy($id); return ['success' => true]; });
    
    // Cek Status Bot & Ambil Group ID Otomatis dari Database
    Route::get('/wa-status', function(Request $request) {
        try {
            $user = $request->user();
            
            // PRIORITAS 1: Ambil dari Kolom wa_group_id di Tabel User (Hasil Scan yang tersimpan selamanya)
            // PRIORITAS 2: Ambil dari Global WaGroupMapping berdasarkan Job
            $targetGroupId = $user->wa_group_id; 
            if (!$targetGroupId) {
                $group = \App\Models\WaGroupMapping::where('job_name', 'like', '%' . $user->job . '%')->first();
                $targetGroupId = $group ? $group->wa_group_id : null;
            }

            // Ambil Nama Grup jika ada mapping
            $groupName = \App\Models\WaGroupMapping::where('wa_group_id', $targetGroupId)->first()?->group_name;

            // 2. Cek Status WA (User atau Global) - Cache status 60 detik agar STABIL
            $cacheKey = 'wa_status_' . $user->id;
            if ($request->has('refresh')) {
                \Illuminate\Support\Facades\Cache::forget($cacheKey);
            }

            $isOnline = \Illuminate\Support\Facades\Cache::remember($cacheKey, 60, function() use ($user) {
                try {
                    $resUser = \Illuminate\Support\Facades\Http::timeout(3)->get("http://localhost:3001/api/wa/status/user_{$user->id}");
                    if ($resUser->ok() && $resUser->json('connected')) return true;
                } catch (\Exception $e) {}

                try {
                    $resBot = \Illuminate\Support\Facades\Http::timeout(3)->get('http://localhost:3001/api/wa/status/report_bot');
                    if ($resBot->ok() && $resBot->json('connected')) return true;
                } catch (\Exception $e) {}
                
                return false;
            });

            return response()->json([
                'online'    => $isOnline,
                'groupId'   => $targetGroupId,
                'groupName' => $groupName,
                'job'       => $user->job
            ]);
        } catch (\Exception $e) {
            return response()->json(['online' => false, 'error' => 'Error checking status']);
        }
    });
});
