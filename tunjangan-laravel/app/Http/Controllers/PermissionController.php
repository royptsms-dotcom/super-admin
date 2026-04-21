<?php

namespace App\Http\Controllers;

use App\Models\JobPermission;
use App\Models\User;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index()
    {
        $jobs = User::whereNotNull('job')
            ->selectRaw('UPPER(job) as job')
            ->distinct()
            ->pluck('job')
            ->toArray();
            
        // Add default jobs if not in DB
        $defaultJobs = ['OPERATOR', 'TEKNISI'];
        $jobs = array_unique(array_merge($jobs, array_map('strtoupper', $defaultJobs)));
        sort($jobs);

        $permissionsList = [
            'UTAMA' => [
                'dashboard' => ['label' => 'Dashboard Admin'],
                'admin.permissions' => ['label' => 'Manajemen Izin Akses'],
                'admin.karyawan' => ['label' => 'Data Karyawan'],
            ],
            'SHARE LOKASI & LAPORAN' => [
                'admin.rekap' => ['label' => 'Tarik Laporan (Rekap)'],
                'admin.wagroup' => ['label' => 'Mapping Grup WA'],
                'admin.harga' => ['label' => 'Manajemen Harga'],
            ],
            'APLIKASI MOBILE (E-SMS)' => [
                'share-lokasi.create' => ['label' => 'Input Share Lokasi', 'is_parent' => true],
                'api.lembur.submit' => ['label' => 'Input Lembur (Overtime)', 'parent' => 'share-lokasi.create'],
                'api.standby' => ['label' => 'Input Standby / On Call', 'parent' => 'share-lokasi.create'],
            ],
            'KONTROL SERTIFIKAT' => [
                'certificates.create' => ['label' => 'Generate Sertifikat'],
                'certificates.index' => ['label' => 'Database Sertifikat'],
                'admin.master-sertifikat' => ['label' => 'Pengaturan Master Sertifikat'],
            ],
            'ABSENSI' => [
                'admin.absensi.rekap' => ['label' => 'Rekap Absensi'],
                'admin.absensi.export' => ['label' => 'Terima Laporan'],
                'admin.absensi.settings' => ['label' => 'Pengaturan Absensi'],
            ],
        ];

        return view('admin.permissions', compact('jobs', 'permissionsList'));
    }

    public function getPermissions($job)
    {
        $permission = JobPermission::whereRaw('UPPER(job) = ?', [strtoupper($job)])->first();
        return response()->json([
            'permissions' => $permission ? $permission->permissions : []
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'job' => 'required|string',
            'permissions' => 'array',
        ]);

        JobPermission::updateOrCreate(
            ['job' => strtoupper($request->job)],
            ['permissions' => $request->permissions ?? []]
        );

        return back()->with('success', 'Izin akses berhasil diperbarui untuk job: ' . $request->job);
    }
}
