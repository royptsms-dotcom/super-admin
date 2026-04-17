@extends('layouts.app')

@section('title', 'Tarik Laporan')

@section('content')
<style>
    .table-rekap td { padding: 0.75rem 1.5rem !important; }
    .table-rekap thead th { padding: 0.75rem 1.5rem !important; background-color: #f8fafc; }
    .modal-premium { border-radius: 20px; overflow: hidden; border: none; }
    .modal-premium .modal-header { background: linear-gradient(45deg, #4e73df, #224abe); border: none; padding: 1.5rem; }
    .nav-pills-custom .nav-link { border-radius: 10px; padding: 10px 20px; font-weight: 600; color: #64748b; }
    .nav-pills-custom .nav-link.active { background-color: #4e73df; color: #fff; box-shadow: 0 4px 12px rgba(78, 115, 223, 0.2); }
    .detail-row:hover { background-color: #f1f5f9; }
</style>

<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Rekapitulasi Laporan</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
            <li class="breadcrumb-item" aria-current="page">Tarik Laporan</li>
        </ul>
    </div>
</div>

<div class="card border-0 shadow-sm overflow-hidden" style="border-radius: 15px;">
    <div class="card-header py-3 px-4 flex justify-between items-center bg-white border-b">
        <div>
            <h6 class="mb-0 font-bold text-gray-800">Ringkasan Laporan Per Karyawan</h6>
            <p class="text-[10px] text-muted m-0 uppercase tracking-tighter">Monitoring aktivitas share lokasi, lembur & standby bulanan</p>
        </div>
        <button class="btn btn-sm btn-success shadow-none flex items-center gap-2 px-3">
            <i data-feather="download" style="width: 14px; height: 14px;"></i> XLSX
        </button>
    </div>
    <div class="card-body p-0">
        <div class="p-3 border-b border-gray-100 bg-light/30">
            <form method="GET" action="{{ route('admin.rekap') }}" class="flex gap-3 items-end">
                <div>
                    <label class="text-[10px] font-bold text-gray-400 uppercase mb-1 d-block tracking-widest">Filter Bulan</label>
                    <input type="month" name="bulan" class="form-control form-control-sm" value="{{ $bulan }}" style="border-radius: 8px; width: 180px;">
                </div>
                <button type="submit" class="btn btn-sm btn-primary px-4" style="border-radius: 8px; height: 35px;">
                    <i data-feather="refresh-cw" class="w-3 h-3 mr-1"></i> Update
                </button>
            </form>
        </div>

        <div class="table-responsive">
            <table class="table table-hover mb-0 table-rekap">
                <thead>
                    <tr>
                        <th class="text-[10px] font-bold text-gray-500 uppercase">Karyawan</th>
                        <th class="text-[10px] font-bold text-gray-500 uppercase text-center">Share Lokasi</th>
                        <th class="text-[10px] font-bold text-gray-500 uppercase text-center">Lembur</th>
                        <th class="text-[10px] font-bold text-gray-500 uppercase text-center">Standby</th>
                        <th class="text-[10px] font-bold text-gray-500 uppercase text-right">Total Biaya (Rp)</th>
                        <th class="text-[10px] font-bold text-gray-500 uppercase text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @php $grandTotalAll = 0; @endphp
                    @forelse($rekapData as $data)
                    @php $grandTotalAll += $data['total_biaya']; @endphp
                    <tr class="align-middle border-b border-gray-50">
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                    {{ substr($data['user']->name, 0, 1) }}
                                </div>
                                <div>
                                    <span class="font-bold text-sm d-block text-gray-800">{{ $data['user']->name }}</span>
                                    <span class="text-[10px] text-muted">{{ $data['user']->job ?? '-' }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">
                            <span class="text-xs font-semibold text-blue-600">{{ $data['total_share'] }}x</span>
                        </td>
                        <td class="text-center">
                            <span class="text-xs font-semibold text-amber-600">{{ $data['total_lembur'] }}x</span>
                        </td>
                        <td class="text-center">
                            <span class="text-xs font-semibold text-success">{{ $data['total_standby'] }}x</span>
                        </td>
                        <td class="text-right">
                            <span class="font-bold text-sm">Rp {{ number_format($data['total_biaya'], 0, ',', '.') }}</span>
                        </td>
                        <td class="text-center">
                            <button type="button" class="btn btn-sm btn-icon btn-light-primary shadow-none" 
                                    data-bs-toggle="modal" data-bs-target="#modalPreview{{ $data['user']->id }}">
                                <i data-feather="eye" class="w-4 h-4"></i> Preview
                            </button>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="6" class="text-center py-10 text-muted italic">
                            Tidak ada data rekap untuk periode {{ $bulan }}.
                        </td>
                    </tr>
                    @endforelse
                </tbody>
                @if(count($rekapData) > 0)
                <tfoot class="bg-gray-50">
                    <tr>
                        <td colspan="4" class="text-right font-bold text-gray-500 uppercase tracking-widest" style="font-size: 10px;">GRAND TOTAL SELURUH KARYAWAN</td>
                        <td class="text-right font-black text-primary" style="font-size: 16px;">
                            Rp {{ number_format($grandTotalAll, 0, ',', '.') }}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
                @endif
            </table>
        </div>
    </div>
</div>

<!-- MODAL PREVIEW PREMIUM -->
@foreach($rekapData as $data)
<div class="modal fade" id="modalPreview{{ $data['user']->id }}" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content modal-premium shadow-2xl">
            <div class="modal-header">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <i data-feather="user" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h5 class="modal-title font-bold text-white mb-0">{{ $data['user']->name }}</h5>
                        <p class="text-[10px] text-white/70 m-0 uppercase tracking-wider">{{ $data['user']->job ?? 'Karyawan' }}</p>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
                <div class="bg-light/50 p-3 flex justify-center border-b">
                    <ul class="nav nav-pills nav-pills-custom gap-2" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link active text-xs" data-bs-toggle="tab" href="#tabShare{{ $data['user']->id }}">📍 Share Lokasi ({{ $data['total_share'] }})</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link text-xs" data-bs-toggle="tab" href="#tabLembur{{ $data['user']->id }}">📸 Lembur ({{ $data['total_lembur'] }})</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link text-xs" data-bs-toggle="tab" href="#tabStandby{{ $data['user']->id }}">🟢 Standby ({{ $data['total_standby'] }})</a>
                        </li>
                    </ul>
                </div>
                <div class="tab-content">
                    <!-- Tab Share Lokasi -->
                    <div id="tabShare{{ $data['user']->id }}" class="tab-pane active fade show">
                        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-sm mb-0">
                                <thead class="bg-white sticky-top top-0 shadow-sm">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Waktu (WIB)</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Rumah Sakit</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Biaya</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($data['details_share'] as $s)
                                    <tr class="detail-row">
                                        <td class="px-4 py-2 small font-semibold">{{ \Carbon\Carbon::parse($s->waktu_share)->timezone('Asia/Jakarta')->format('d/m/y H:i') }}</td>
                                        <td class="px-4 py-2 small text-gray-700">{{ $s->rumahSakit->nama_rs ?? '-' }}</td>
                                        <td class="px-4 py-2 small text-right font-bold text-primary">Rp {{ number_format($s->harga, 0, ',', '.') }}</td>
                                    </tr>
                                    @endforeach
                                </tbody>
                                <tfoot>
                                    <tr class="bg-light">
                                        <td colspan="2" class="px-4 py-2 text-[10px] font-bold uppercase text-gray-400">Subtotal Share Lokasi</td>
                                        <td class="px-4 py-2 text-right font-bold text-primary">Rp {{ number_format($data['biaya_share'], 0, ',', '.') }}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <!-- Tab Lembur -->
                    <div id="tabLembur{{ $data['user']->id }}" class="tab-pane fade">
                         <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-sm mb-0">
                                <thead class="bg-white sticky-top top-0 shadow-sm">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Waktu Lapor</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Selesai</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Durasi Efektif</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Earned</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center">Foto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($data['details_lembur'] as $l)
                                    <tr class="detail-row">
                                        <td class="px-4 py-2 small font-semibold">
                                            {{ \Carbon\Carbon::parse($l->waktu_mulai)->timezone('Asia/Jakarta')->format('d/m/y H:i') }}
                                        </td>
                                        <td class="px-4 py-2 small font-semibold">
                                            {{ $l->waktu_selesai ? \Carbon\Carbon::parse($l->waktu_selesai)->timezone('Asia/Jakarta')->format('d/m/y H:i') : '-' }}
                                        </td>
                                        <td class="px-4 py-2 small text-gray-700">
                                            @if($l->waktu_mulai && $l->waktu_selesai)
                                                @php
                                                    $mulai = \Carbon\Carbon::parse($l->waktu_mulai);
                                                    $selesai = \Carbon\Carbon::parse($l->waktu_selesai);
                                                    $day = $mulai->dayOfWeek;
                                                    $startHr = ($day == 6) ? 15 : ($day == 0 ? 0 : 18);
                                                    $winStart = $mulai->copy()->hour($startHr)->minute(0)->second(0);
                                                    $calcStart = $mulai->gt($winStart) ? $mulai : $winStart;
                                                    
                                                    $diffMin = 0;
                                                    if($selesai->gt($calcStart)) {
                                                        $diffMin = $selesai->diffInMinutes($calcStart);
                                                    }
                                                    $h = floor($diffMin / 60);
                                                    $m = $diffMin % 60;
                                                @endphp
                                                {{ $h }}j {{ $m }}m
                                            @else
                                                -
                                            @endif
                                        </td>
                                        <td class="px-4 py-2 small text-right font-bold text-amber-600">
                                            Rp {{ number_format($l->earned_nominal ?? 0, 0, ',', '.') }}
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            @if($l->foto_url)
                                            <a href="{{ asset('storage/'.$l->foto_url) }}" target="_blank" class="btn btn-xs btn-outline-secondary py-0 text-[10px]">Lihat</a>
                                            @endif
                                        </td>
                                    </tr>
                                    @endforeach
                                </tbody>
                                <tfoot>
                                    <tr class="bg-light">
                                        <td colspan="4" class="px-4 py-2 text-[10px] font-bold uppercase text-gray-400">Subtotal Lembur (Terhitung Rate & Max Nominal)</td>
                                        <td class="px-4 py-2 text-right font-bold text-amber-600">Rp {{ number_format($data['biaya_lembur'], 0, ',', '.') }}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <!-- Tab Standby -->
                    <div id="tabStandby{{ $data['user']->id }}" class="tab-pane fade">
                         <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-sm mb-0">
                                <thead class="bg-white sticky-top top-0 shadow-sm">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Tanggal</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Jenis</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Biaya</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($data['details_standby'] as $st)
                                    <tr class="detail-row">
                                        <td class="px-4 py-2 small font-semibold">{{ \Carbon\Carbon::parse($st->tanggal)->format('d/m/y') }}</td>
                                        <td class="px-4 py-2 small">
                                            <span class="badge {{ $st->jenis_standby == 'minggu' ? 'bg-danger' : 'bg-primary' }}">
                                                {{ $st->jenis_standby == 'minggu' ? 'Minggu' : 'Biasa' }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 small text-right font-bold">
                                            Rp {{ number_format($st->jenis_standby == 'minggu' ? $hargaStandbyMinggu : $hargaStandbyBiasa, 0, ',', '.') }}
                                        </td>
                                    </tr>
                                    @endforeach
                                </tbody>
                                <tfoot>
                                    <tr class="bg-light">
                                        <td colspan="2" class="px-4 py-2 text-[10px] font-bold uppercase text-gray-400">Subtotal Standby</td>
                                        <td class="px-4 py-2 text-right font-bold text-success">Rp {{ number_format($data['biaya_standby'], 0, ',', '.') }}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-t bg-gray-50 flex justify-between items-center py-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Akumulasi Periode</span>
                <span class="font-black text-lg text-primary">Rp {{ number_format($data['total_biaya'], 0, ',', '.') }}</span>
            </div>
        </div>
    </div>
</div>
@endforeach

@endsection
