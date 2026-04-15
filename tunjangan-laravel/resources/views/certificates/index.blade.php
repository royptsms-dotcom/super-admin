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
            <div class="card-header flex justify-between items-center">
                <h5>Data Sertifikat Kalibrasi</h5>
                <a href="{{ route('certificates.create') }}" class="btn btn-primary btn-sm">Generate Baru</a>
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
