@extends('layouts.app')

@section('title', 'Data Master')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Pengaturan Data Master</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ url('/') }}">Home</a></li>
            <li class="breadcrumb-item">Data Master</li>
        </ul>
    </div>
</div>

<div class="grid grid-cols-12 gap-x-6">
    <div class="col-span-12 lg:col-span-6">
        <div class="card">
            <div class="card-header">
                <h5>Link Google Sheet</h5>
            </div>
            <div class="card-body">
                <form action="{{ route('settings.update') }}" method="POST">
                    @csrf
                    <div class="mb-4">
                        <label class="form-label">Link CSV Google Sheet (Publish to Web)</label>
                        <input type="url" name="sheet_url" class="form-control" value="{{ $sheetUrl }}" placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" required>
                        <small class="text-muted">Gunakan link dari menu <b>File > Share > Publish to web</b>, pilih format <b>CSV</b>.</small>
                    </div>
                    <button type="submit" class="btn btn-primary">Simpan Link</button>
                    <a href="{{ route('settings.sync') }}" class="btn btn-success ml-2">
                        <i data-feather="refresh-cw" class="w-4 h-4 mr-1"></i> Update Data Sekarang
                    </a>
                </form>
            </div>
        </div>
    </div>

    @if($masterData)
    <div class="col-span-12">
        <div class="card">
            <div class="card-header">
                <h5>Pratinjau Data Sinkronisasi</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>PT Name</th>
                                <th>Hospital</th>
                                <th>Instrument</th>
                                <th>Serial Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($masterData as $row)
                            <tr>
                                <td>{{ $row['pt'] ?? '-' }}</td>
                                <td>{{ $row['hospital'] ?? '-' }}</td>
                                <td>{{ $row['instrument'] ?? '-' }}</td>
                                <td>{{ $row['sn'] ?? '-' }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    @endif
</div>
@endsection
