<?php

use App\Http\Controllers\CertificateController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminTunjanganController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceSettingController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    return redirect()->route('login');
});

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'postLogin'])->name('postLogin');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Protected Admin Routes
Route::middleware(['auth', 'permission'])->group(function () {
    Route::get('/notifications/read/{id}', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    Route::controller(SettingController::class)->group(function () {
        Route::get('/settings', 'index')->name('settings.index');
        Route::post('/settings', 'update')->name('settings.update');
        Route::get('/settings/sync', 'sync')->name('settings.sync');
    });

    Route::controller(CertificateController::class)->group(function () {
        Route::get('/certificates', 'index')->name('certificates.index');
        Route::get('/certificates/create', 'create')->name('certificates.create');
        Route::get('/certificates/get-count', 'getCount')->name('certificates.count');
        Route::post('/certificates', 'store')->name('certificates.store');
        Route::get('/certificates/download/{certificate}', 'download')->name('certificates.download');
        Route::delete('/certificates/{certificate}', 'destroy')->name('certificates.destroy');
    });

    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::controller(AdminTunjanganController::class)->prefix('admin')->group(function () {
        Route::get('/karyawan', 'karyawan')->name('admin.karyawan');
        Route::get('/karyawan/print/{id}', 'printKaryawan')->name('admin.karyawan.print');
        Route::post('/karyawan', 'storeKaryawan')->name('admin.karyawan.store');
        Route::put('/karyawan/{id}', 'updateKaryawan')->name('admin.karyawan.update');
        Route::delete('/karyawan/{id}', 'destroyKaryawan')->name('admin.karyawan.destroy');
        
        Route::get('/rekap', 'rekap')->name('admin.rekap');
        
        // WA Mapping
        Route::get('/wa-bot/start', 'startBot')->name('admin.wa-bot.start');
        Route::get('/wagroup', 'wagroup')->name('admin.wagroup');
        Route::post('/wagroup', 'storeWagroup')->name('admin.wagroup.store');
        Route::delete('/wagroup/{id}', 'destroyWagroup')->name('admin.wagroup.destroy');

        Route::get('/master-lokasi', 'masterLokasi')->name('admin.master-lokasi');
        Route::post('/master-lokasi', 'masterLokasiStore')->name('admin.master-lokasi.store');
        Route::get('/master-lokasi/sync', 'syncLokasi')->name('admin.master-lokasi.sync');
        Route::get('/karyawan/status/{id}', 'checkWaStatus')->name('admin.karyawan.status');

        Route::get('/master-sertifikat', 'masterSertifikat')->name('admin.master-sertifikat');

        // Permission Management
        Route::get('/permissions', [\App\Http\Controllers\PermissionController::class, 'index'])->name('admin.permissions');
        Route::post('/permissions', [\App\Http\Controllers\PermissionController::class, 'store'])->name('admin.permissions.store');
        Route::get('/permissions/{job}', [\App\Http\Controllers\PermissionController::class, 'getPermissions'])->name('admin.permissions.get');

        // Price Management
        Route::get('/harga', [PriceController::class, 'index'])->name('admin.harga');
        Route::post('/harga/rs', [PriceController::class, 'updateRS'])->name('admin.harga.rs');
        Route::post('/harga/general', [PriceController::class, 'updateGeneral'])->name('admin.harga.general');
    });

    // ABSENSI PIVOT TOOL
    Route::prefix('admin/absensi')->name('admin.absensi.')->group(function () {
        Route::get('/rekap', [AttendanceController::class, 'index'])->name('rekap');
        Route::post('/import', [AttendanceController::class, 'import'])->name('import');
        Route::get('/export', [AttendanceController::class, 'export'])->name('export');
        Route::get('/export-detail', [AttendanceController::class, 'exportDetail'])->name('export-detail');
        
        Route::get('/settings', [AttendanceSettingController::class, 'index'])->name('settings');
        Route::post('/settings', [AttendanceSettingController::class, 'update'])->name('settings.update');
    });
});

// Fitur Share Lokasi (Bisa diakses user jika diizinkan, atau tetap di sini)
Route::middleware(['auth'])->group(function() {
    Route::controller(\App\Http\Controllers\ShareLokasiController::class)->group(function () {
        Route::get('/share-lokasi', 'create')->name('share-lokasi.create');
        Route::post('/share-lokasi', 'store')->name('share-lokasi.store');
    });
});

// APIs (Can be open or use separate middleware)
