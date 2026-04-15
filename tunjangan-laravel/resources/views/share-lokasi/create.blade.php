@extends('layouts.app')

@section('title', 'Share Lokasi')

@push('styles')
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css" />
@endpush

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Laporan Kehadiran (Share Lokasi)</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ url('/') }}">Home</a></li>
            <li class="breadcrumb-item">Share Lokasi</li>
        </ul>
    </div>
</div>

<div class="grid grid-cols-12 gap-x-6">
    <div class="col-span-12 md:col-span-8 lg:col-span-6">
        <div class="card">
            <div class="card-header bg-primary-500 text-white pb-3">
                <div class="flex items-center gap-3">
                    <i class="ti ti-map-pin text-2xl"></i>
                    <h5 class="mb-0 text-white text-lg">Absen Titik GPS</h5>
                </div>
            </div>
            <div class="card-body pt-5">
                @if(session('success'))
                    <div class="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
                        {{ session('success') }}
                    </div>
                @endif

                <div class="text-center mb-6" id="gps-status-container">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3 animate-pulse" id="gps-icon-container">
                        <i class="ti ti-loader text-2xl text-blue-500 animate-spin" id="gps-icon"></i>
                    </div>
                    <h6 class="text-gray-600 mb-1" id="gps-title">Mencari Koordinat GPS...</h6>
                    <small class="text-red-500" id="gps-error"></small>
                </div>

                <form action="{{ url('/share-lokasi') }}" method="POST" id="lokasiForm" style="display: none;">
                    @csrf
                    <!-- Hidden GPS Inputs -->
                    <input type="hidden" name="latitude" id="lat">
                    <input type="hidden" name="longitude" id="lng">

                    <div class="mb-4">
                        <label class="form-label text-gray-700 font-semibold mb-2">1. Pilih Lokasi Rumah Sakit</label>
                        <select name="rs_id" id="rs_select" class="form-control" required>
                            <option value="">Cari Rumah Sakit...</option>
                            @foreach($rumahSakit as $rs)
                                <option value="{{ $rs->id }}">{{ $rs->nama_rs }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="form-label text-gray-700 font-semibold mb-2">2. Keterangan Laporan (Opsional)</label>
                        <textarea name="keterangan" rows="3" class="form-control border-gray-300 rounded-lg focus:ring-primary-500" placeholder="Contoh: Sudah tiba di lokasi pengerjaan kalibrasi..."></textarea>
                    </div>

                    <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                        <i class="ti ti-send"></i> Kirim & Forward WA
                    </button>
                    
                    <p class="text-xs text-center text-gray-500 mt-4">Laporan akan diteruskan ke Grup WA langsung dari Nomor Anda (via Bot Multi-Session).</p>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Init Choices
        new Choices('#rs_select', { searchEnabled: true, itemSelectText: '' });

        // Get Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    document.getElementById('lat').value = position.coords.latitude;
                    document.getElementById('lng').value = position.coords.longitude;
                    
                    // Update UI
                    document.getElementById('gps-icon-container').classList.replace('bg-blue-100', 'bg-green-100');
                    document.getElementById('gps-icon-container').classList.remove('animate-pulse');
                    document.getElementById('gps-icon').className = 'ti ti-check text-2xl text-green-500';
                    document.getElementById('gps-title').innerHTML = `<span class="text-green-600 font-medium">GPS Terkunci: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}</span>`;
                    
                    // Show Form
                    document.getElementById('lokasiForm').style.display = 'block';
                }, 
                function(error) {
                    document.getElementById('gps-icon-container').classList.replace('bg-blue-100', 'bg-red-100');
                    document.getElementById('gps-icon-container').classList.remove('animate-pulse');
                    document.getElementById('gps-icon').className = 'ti ti-alert-circle text-2xl text-red-500';
                    
                    let msg = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED: msg = "Akses GPS ditolak! Harap izinkan lokasi browser."; break;
                        case error.POSITION_UNAVAILABLE: msg = "Sinyal GPS tidak tersedia."; break;
                        case error.TIMEOUT: msg = "Waktu pencarian GPS habis."; break;
                        default: msg = "Unknown Error GPS."; break;
                    }
                    document.getElementById('gps-title').innerText = "Gagal Mengunci Sistem Lokasi";
                    document.getElementById('gps-error').innerText = msg;
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            document.getElementById('gps-error').innerText = "Browser perangkat Anda tidak mendukung pelacakan Geolocation.";
        }
    });
</script>
@endpush
