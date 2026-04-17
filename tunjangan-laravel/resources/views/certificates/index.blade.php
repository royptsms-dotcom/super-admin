@extends('layouts.app')

@section('title', 'Daftar Sertifikat')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Manajemen Sertifikat</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ url('/') }}">Home</a></li>
            <li class="breadcrumb-item">Sertifikat</li>
        </ul>
    </div>
</div>

<div class="grid grid-cols-12 gap-x-6">
    <div class="col-span-12">
        <div class="card table-card">
            <div class="card-header flex justify-between items-center py-3">
                <h5>Data Sertifikat Kalibrasi</h5>
                <div class="flex items-center gap-2">
                    <form action="{{ route('certificates.index') }}" method="GET" class="flex items-center gap-1.5 mr-3">
                        <input type="text" name="search" class="form-control form-control-sm" placeholder="Cari RS atau Nama Alat..." value="{{ request('search') }}" style="width: 280px; font-size: 0.82rem;">
                        <button type="submit" class="btn btn-light-primary btn-sm" style="padding: 5px 10px;">
                            <i data-feather="search" style="width: 14px; height: 14px;"></i>
                        </button>
                        @if(request('search'))
                            <a href="{{ route('certificates.index') }}" class="btn btn-light-danger btn-sm" style="padding: 5px 10px;" title="Reset Pencarian">
                                <i data-feather="x" style="width: 14px; height: 14px;"></i>
                            </a>
                        @endif
                    </form>
                    <a href="{{ route('certificates.create') }}" class="btn btn-primary btn-sm px-4">
                        <i data-feather="plus-circle" class="me-1" style="width: 14px; height: 14px;"></i> Generate Baru
                    </a>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Nomor Sertifikat</th>
                                <th>Alat</th>
                                <th>RS / Instansi</th>
                                <th>Tanggal Kalibrasi</th>
                                <th>ED (Berakhir)</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($certificates as $cert)
                            <tr>
                                <td>{{ $cert->certificate_number }}</td>
                                <td>{{ $cert->instrument_name }}</td>
                                <td>{{ $cert->hospital_name }}</td>
                                <td>{{ $cert->calibration_date->format('d/m/Y') }}</td>
                                <td>
                                    <span class="badge {{ $cert->expiry_date->isPast() ? 'bg-danger-500' : 'bg-success-500' }}">
                                        {{ $cert->expiry_date->format('d/m/Y') }}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="{{ route('certificates.download', $cert->id) }}" class="btn btn-icon btn-sm btn-outline-primary" title="Download PDF">
                                            <i data-feather="download"></i>
                                        </a>
                                        <form action="{{ route('certificates.destroy', $cert->id) }}" method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus sertifikat ini?')">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-icon btn-sm btn-outline-danger" title="Hapus">
                                                <i data-feather="trash-2"></i>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="6" class="text-center">Belum ada data sertifikat.</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
                <div class="p-4">
                    {{ $certificates->links() }}
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
