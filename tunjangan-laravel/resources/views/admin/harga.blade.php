@extends('layouts.app')

@section('title', 'Manajemen Harga')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="row align-items-center">
            <div class="col-md-12">
                <div class="page-header-title">
                    <h5 class="m-b-10">Manajemen Harga</h5>
                </div>
                <ul class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
                    <li class="breadcrumb-item">Master Data</li>
                    <li class="breadcrumb-item" aria-current="page">Manajemen Harga</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-sm-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center py-3">
                <h5 class="mb-0">Pengaturan Harga</h5>
                <div class="d-flex gap-2">
                    <button type="button" onclick="document.getElementById('form-general').submit();" class="btn btn-primary btn-sm d-flex align-items-center">
                        <i data-feather="save" class="me-2" style="width: 16px; height: 16px;"></i> Simpan Harga Umum
                    </button>
                    <button type="button" onclick="document.getElementById('form-rs').submit();" class="btn btn-info btn-sm d-flex align-items-center text-white">
                        <i data-feather="save" class="me-2" style="width: 16px; height: 16px;"></i> Simpan Harga RS
                    </button>
                </div>
            </div>
            <div class="card-body">
                @if(session('success'))
                    <div class="alert alert-success">{{ session('success') }}</div>
                @endif

                <ul class="nav nav-tabs mb-4" id="priceTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active fw-bold" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab" aria-controls="general" aria-selected="true">Harga Umum (Lembur & Standby)</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link fw-bold" id="rs-tab" data-bs-toggle="tab" data-bs-target="#rs" type="button" role="tab" aria-controls="rs" aria-selected="false">Harga Per Rumah Sakit</button>
                    </li>
                </ul>
                
                <div class="tab-content" id="priceTabContent">
                    <!-- Tab Harga Umum -->
                    <div class="tab-pane fade show active" id="general" role="tabpanel" aria-labelledby="general-tab">
                        <form id="form-general" action="{{ route('admin.harga.general') }}" method="POST">
                            @csrf
                            <div class="row">
                                <div class="col-md-6 mb-4">
                                    <label class="form-label font-bold">Harga Lembur Per Jam</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-light">Rp</span>
                                        <input type="number" name="harga_lembur_per_jam" class="form-control" value="{{ $prices['harga_lembur_per_jam'] }}" required>
                                    </div>
                                    <small class="text-muted mt-1 d-block">Lembur dihitung mulai jam 18:00 (Senin-Jumat) atau 15:00 (Sabtu).</small>
                                </div>
                                <div class="col-md-6 mb-4">
                                    <label class="form-label font-bold">Maksimal Nominal Lembur (Per Klaim)</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-light">Rp</span>
                                        <input type="number" name="max_nominal_lembur" class="form-control" value="{{ $prices['max_nominal_lembur'] ?? 0 }}" required>
                                    </div>
                                    <small class="text-muted mt-1 d-block">Batas maksimal uang lembur yang bisa didapat dalam satu kali laporan.</small>
                                </div>
                                <div class="col-md-6 mb-4">
                                    <label class="form-label font-bold">Harga Standby (Hari Minggu/Libur)</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-light">Rp</span>
                                        <input type="number" name="harga_standby_minggu" class="form-control" value="{{ $prices['harga_standby_minggu'] }}" required>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-4">
                                    <label class="form-label font-bold">Harga Standby (Hari Biasa/Lainnya)</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-light">Rp</span>
                                        <input type="number" name="harga_standby_biasa" class="form-control" value="{{ $prices['harga_standby_biasa'] }}" required>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Tab Harga RS -->
                    <div class="tab-pane fade" id="rs" role="tabpanel" aria-labelledby="rs-tab">
                        <form id="form-rs" action="{{ route('admin.harga.rs') }}" method="POST">
                            @csrf
                            <div class="table-responsive" style="max-height: 600px; overflow-y: auto;">
                                <table class="table table-hover table-borderless align-middle">
                                    <thead class="bg-light sticky-top top-0">
                                        <tr>
                                            <th width="50" class="ps-4">No</th>
                                            <th>Nama Rumah Sakit</th>
                                            <th>Kode RS</th>
                                            <th width="300" class="pe-4 text-center">Harga Share Lokasi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach($rumahSakit as $rs)
                                        <tr class="border-bottom">
                                            <td class="ps-4">{{ $loop->iteration }}</td>
                                            <td class="fw-semibold text-dark">{{ $rs->nama_rs }}</td>
                                            <td><span class="badge bg-secondary-subtle text-secondary px-2 py-1">{{ $rs->kode_rs }}</span></td>
                                            <td class="pe-4">
                                                <div class="input-group input-group-sm w-75 mx-auto">
                                                    <span class="input-group-text">Rp</span>
                                                    <input type="number" name="rs_prices[{{ $rs->id }}]" class="form-control text-end" value="{{ $rs->harga_share_lokasi }}">
                                                </div>
                                            </td>
                                        </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        if (window.feather) {
            feather.replace();
        }
    });

    var rsTab = document.getElementById('rs-tab');
    rsTab.addEventListener('shown.bs.tab', function () {
        if (window.feather) {
            feather.replace();
        }
    });
</script>
@endpush
