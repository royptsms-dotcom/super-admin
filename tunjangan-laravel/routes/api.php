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
    
    // Cek Status Bot (Pribadi atau Utama)
    Route::get('/wa-status', function(Request $request) {
        try {
            $user = $request->user();
            // Cek sesi pribadi dulu
            $resUser = \Illuminate\Support\Facades\Http::timeout(1)->get("http://localhost:3001/api/wa/qr/user_{$user->id}");
            if ($resUser->json('status') === 'connected') {
                return response()->json(['online' => true, 'mode' => 'pribadi']);
            }
            
            // Kalau pribadi ga ada, cek bot utama
            $resBot = \Illuminate\Support\Facades\Http::timeout(1)->get('http://localhost:3001/api/wa/qr/report_bot');
            return response()->json([
                'online' => ($resBot->json('status') === 'connected'),
                'mode' => 'global'
            ]);
        } catch (\Exception $e) {
            return response()->json(['online' => false, 'error' => $e->getMessage()]);
        }
    });
});
