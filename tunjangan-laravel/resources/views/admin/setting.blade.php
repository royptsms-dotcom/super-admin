@extends('layouts.app')

@section('title', 'Setting Aplikasi')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Setting Aplikasi</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
            <li class="breadcrumb-item" aria-current="page">Setting</li>
        </ul>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h5>Profil Admin Aplikasi</h5>
    </div>
    <div class="card-body">
        <p class="text-muted">Halaman pengaturan profil dan informasi utama Admin Tunjangan App.</p>
    </div>
</div>
@endsection
