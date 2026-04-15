@extends('layouts.app')

@section('title', 'Setting Scan Barcode')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Setting Scan Barcode</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
            <li class="breadcrumb-item" aria-current="page">Scan Barcode</li>
        </ul>
    </div>
</div>

<div class="row">
    @forelse($mappings as $m)
    <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm border-0">
            <div class="card-header bg-primary/10 border-0 flex justify-center py-3">
                <span class="badge bg-primary text-white text-lg px-4 py-2 uppercase">{{ $m->job_name }}</span>
            </div>
            <div class="card-body text-center flex flex-col items-center justify-center pt-4 pb-5">
                <p class="text-sm text-muted mb-4 px-2">
                    Arahkan fitur scanner di Aplikasi {{ $m->job_name }} ke kode ini untuk sinkronisasi grup pelaporan.
                </p>
                <div class="p-3 bg-white rounded-xl shadow-sm border" style="display: inline-block;">
                    {!! \SimpleSoftwareIO\QrCode\Facades\QrCode::size(200)->generate(json_encode([
                        'action' => 'WA_SETUP',
                        'job' => $m->job_name,
                        'group_id' => $m->wa_group_id
                    ])) !!}
                </div>
                <div class="mt-4 font-mono text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded w-full overflow-hidden text-ellipsis">
                    ID: {{ $m->wa_group_id }}
                </div>
            </div>
        </div>
    </div>
    @empty
    <div class="col-12">
        <div class="alert alert-warning text-center">
            <strong>Belum ada Pengelompokan Job.</strong><br>
            Silakan tambahkan Mapping Grup WA terlebih dahulu di menu Mapping Grup WA agar barcode dapat digenerate.
        </div>
    </div>
    @endforelse
</div>
@endsection
