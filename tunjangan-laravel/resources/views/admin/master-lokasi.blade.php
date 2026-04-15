@extends('layouts.app')

@section('title', 'Master Lokasi')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Master Lokasi</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
            <li class="breadcrumb-item" aria-current="page">Master Lokasi</li>
        </ul>
    </div>
</div>

<div class="card border-0 shadow-sm overflow-hidden text-gray-800 dark:text-gray-200">
    <div class="card-header py-4 px-6 border-b border-gray-100 dark:border-themedark-border">
        <h5 class="mb-1 font-bold">Integrasi Master Data Lokasi</h5>
        <p class="text-xs text-muted m-0">Sinkronisasi daftar Rumah Sakit via Google Spreadsheet</p>
    </div>
    <div class="card-body p-6">
        @if(session('success'))
            <div class="alert alert-success border-0 bg-success-50 text-success-700 p-4 mb-6 rounded-lg flex items-center shadow-sm">
                <i data-feather="check-circle" class="mr-3"></i>
                <span class="font-medium">{{ session('success') }}</span>
            </div>
        @endif
        
        <form action="{{ route('admin.master-lokasi.store') }}" method="POST">
            @csrf
            <div class="mb-6">
                <label class="form-label text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 d-block">Link Google Spreadsheet (CSV)</label>
                <div class="input-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
                    <span class="input-group-text px-4"><i data-feather="link" class="w-4 h-4 text-gray-400"></i></span>
                    <input type="url" name="sheet_url" class="form-control py-3" value="{{ $sheetUrl }}" placeholder="https://docs.google.com/spreadsheets/d/..." style="font-size: 0.9rem;">
                </div>
                <div class="flex items-start mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                    <i data-feather="info" class="w-4 h-4 text-blue-500 mr-3 mt-0.5"></i>
                    <small class="text-blue-700 dark:text-blue-300 leading-relaxed">Pastikan Spreadsheet Anda diatur ke <b>"Anyone with the link can view"</b> dan pastikan format yang dimasukkan adalah URL CSV/Publish to Web.</small>
                </div>
            </div>

            <div class="flex gap-3">
                <button type="submit" class="btn btn-primary px-6 py-2.5 shadow-md flex items-center gap-2" style="border-radius: 10px;">
                    <i data-feather="save" class="w-4 h-4"></i> Simpan Konfigurasi
                </button>
                @if($sheetUrl)
                <a href="{{ route('admin.master-lokasi.sync') }}" class="btn btn-success px-6 py-2.5 shadow-md flex items-center gap-2" style="border-radius: 10px;">
                    <i data-feather="refresh-cw" class="w-4 h-4"></i> Sinkronisasi Data RS
                </a>
                @endif
            </div>
        </form>
    </div>
</div>
@endsection
