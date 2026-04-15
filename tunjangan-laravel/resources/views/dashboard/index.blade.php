@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Dashboard</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
            <li class="breadcrumb-item">Dashboard</li>
        </ul>
    </div>
</div>

<div class="grid grid-cols-12 gap-x-6 mb-6">
    <!-- Chart 1: Aktif vs Tidak Aktif (Template Style) -->
    <div class="col-span-12 md:col-span-6">
        <div class="card user-list h-full">
            <div class="card-header">
                <h5>Status Sertifikat</h5>
            </div>
            <div class="card-body">
                <div class="flex items-center justify-between gap-1 mb-5">
                  <h2 class="font-light flex items-center m-0">
                    {{ $totalActive + $inactiveCount }}
                  </h2>
                  <h6 class="flex items-center m-0 text-muted">Aset Terdata</h6>
                </div>

                <div class="flex items-center justify-between gap-2 mb-2">
                  <h6 class="flex items-center gap-1">
                    Aktif
                  </h6>
                  <h6>{{ $totalActive }}</h6>
                </div>
                <div class="w-full bg-theme-bodybg rounded-lg h-1.5 mb-6 mt-3 dark:bg-themedark-bodybg">
                  <div class="bg-theme-bg-1 h-full rounded-lg shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]" style="width: {{ ($totalActive + $inactiveCount) > 0 ? ($totalActive / ($totalActive + $inactiveCount)) * 100 : 0 }}%"></div>
                </div>

                <div class="flex items-center justify-between gap-2 mb-2">
                  <h6 class="flex items-center gap-1">
                    Nonaktif
                  </h6>
                  <h6>{{ $inactiveCount }}</h6>
                </div>
                <div class="w-full bg-theme-bodybg rounded-lg h-1.5 mt-3 dark:bg-themedark-bodybg">
                  <div class="bg-danger-500 h-full rounded-lg shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]" style="width: {{ ($totalActive + $inactiveCount) > 0 ? ($inactiveCount / ($totalActive + $inactiveCount)) * 100 : 0 }}%"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Chart 2: Detail Status Sertifikat (Template Style) -->
    <div class="col-span-12 md:col-span-6">
        <div class="card user-list h-full">
            <div class="card-header">
                <h5>Detail Masa Berlaku</h5>
            </div>
            <div class="card-body">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <h6 class="flex items-center gap-1">Aktif (> 2 Bulan)</h6>
                  <h6>{{ $activeCount }}</h6>
                </div>
                <div class="w-full bg-theme-bodybg rounded-lg h-1.5 mb-6 mt-3 dark:bg-themedark-bodybg">
                  <div class="bg-theme-bg-1 h-full rounded-lg shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]" style="width: {{ ($totalActive + $inactiveCount) > 0 ? ($activeCount / ($totalActive + $inactiveCount)) * 100 : 0 }}%"></div>
                </div>

                <div class="flex items-center justify-between gap-2 mb-2">
                  <h6 class="flex items-center gap-1">Akan Berakhir (≤ 2 Bulan)</h6>
                  <h6>{{ $expiringCount }}</h6>
                </div>
                <div class="w-full bg-theme-bodybg rounded-lg h-1.5 mb-6 mt-3 dark:bg-themedark-bodybg">
                  <div class="bg-warning-500 h-full rounded-lg shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]" style="width: {{ ($totalActive + $inactiveCount) > 0 ? ($expiringCount / ($totalActive + $inactiveCount)) * 100 : 0 }}%"></div>
                </div>

                <div class="flex items-center justify-between gap-2 mb-2">
                  <h6 class="flex items-center gap-1">Nonaktif</h6>
                  <h6>{{ $inactiveCount }}</h6>
                </div>
                <div class="w-full bg-theme-bodybg rounded-lg h-1.5 mt-3 dark:bg-themedark-bodybg">
                  <div class="bg-danger-500 h-full rounded-lg shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]" style="width: {{ ($totalActive + $inactiveCount) > 0 ? ($inactiveCount / ($totalActive + $inactiveCount)) * 100 : 0 }}%"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="grid grid-cols-12 gap-x-6">
    <!-- List: Nonaktif -->
    <div class="col-span-12 md:col-span-6">
        <div class="card table-card">
            <div class="card-header bg-danger-500 text-white">
                <h5 class="text-white">Daftar Sertifikat Nonaktif</h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Rumah Sakit</th>
                                <th>Nama Alat</th>
                                <th>Berakhir Pada</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($inactiveList as $cert)
                            <tr class="unread">
                                <td>{{ $cert->hospital_name }}</td>
                                <td>{{ $cert->instrument_name }}</td>
                                <td><span class="badge bg-danger-500 text-white">{{ $cert->expiry_date->format('d M Y') }}</span></td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="3" class="text-center p-3">Tidak ada data.</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- List: 2 Bulan Menuju Nonaktif -->
    <div class="col-span-12 md:col-span-6">
        <div class="card table-card">
            <div class="card-header bg-warning-500 text-white">
                <h5 class="text-white">Akan Berakhir (≤ 2 Bulan)</h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Rumah Sakit</th>
                                <th>Nama Alat</th>
                                <th>Berakhir Pada</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($expiringList as $cert)
                            <tr class="unread">
                                <td>{{ $cert->hospital_name }}</td>
                                <td>{{ $cert->instrument_name }}</td>
                                <td><span class="badge bg-warning-500 text-white">{{ $cert->expiry_date->format('d M Y') }}</span></td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="3" class="text-center p-3">Tidak ada data.</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
