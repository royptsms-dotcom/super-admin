@extends('layouts.app')

@section('title', 'Generate Sertifikat')

@section('content')
<!-- Choices.js CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css" />
<style>
    /* Dark Mode Fix for Choices.js */
    [data-pc-theme="dark"] .choices__inner {
        background-color: rgba(255,255,255,0.05) !important;
        border-color: rgba(255,255,255,0.15) !important;
        color: #fff !important;
    }
    [data-pc-theme="dark"] .choices__list--dropdown {
        background-color: #1e293b !important;
        border-color: rgba(255,255,255,0.15) !important;
    }
    [data-pc-theme="dark"] .choices__list--dropdown .choices__item--selectable.is-highlighted {
        background-color: #4680ff !important;
    }
    [data-pc-theme="dark"] .choices[data-type*="select-one"] .choices__button {
        filter: invert(1);
    }
</style>

<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Buat Sertifikat Kalibrasi</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ url('/') }}">Home</a></li>
            <li class="breadcrumb-item"><a href="{{ route('certificates.index') }}">Sertifikat</a></li>
            <li class="breadcrumb-item">Buat</li>
        </ul>
    </div>
</div>

<div class="grid grid-cols-12 gap-x-6">
    <div class="col-span-12 md:col-span-10 lg:col-span-8">
        <div class="card">
            <div class="card-header">
                <h5>Form Kalibrasi Alat</h5>
            </div>
            <div class="card-body">
                @if ($errors->any())
                    <div class="alert alert-danger">
                        <ul>
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif
                <form action="{{ route('certificates.store') }}" method="POST" id="certForm">
                    @csrf
                    
                    <div class="mb-4">
                        <label class="form-label">1. Pilih Instansi / Rumah Sakit</label>
                        <select id="hospital_select" name="hospital_name" class="form-control" required>
                            <option value="">Cari dan Pilih RS...</option>
                            @php
                                $hospitals = array_unique(array_column($masterData, 'hospital'));
                                sort($hospitals);
                            @endphp
                            @foreach($hospitals as $rs)
                                <option value="{{ $rs }}">{{ $rs }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="mb-4" id="instrument_wrapper" style="display:none;">
                        <label class="form-label">2. Pilih Nama Alat</label>
                        <select id="instrument_select" name="instrument_name" class="form-control" required>
                            <option value="">Cari dan Pilih Alat...</option>
                        </select>
                    </div>

                    <div class="mb-4" id="sn_wrapper" style="display:none;">
                        <label class="form-label">3. Pilih Serial Number</label>
                        <select id="sn_select" name="serial_number" class="form-control">
                            <option value="">Cari dan Pilih SN...</option>
                        </select>
                    </div>

                    <hr class="my-6">

                    <div id="auto_fields" style="display:none;">
                        <input type="hidden" id="hidden_sn" name="serial_number_hidden">
                        <div class="mb-4">
                            <label class="form-label">Nomor Sertifikat (Dapat Diedit)</label>
                            <input type="text" id="cert_number" name="certificate_number" class="form-control" required>
                            <small class="text-muted">Format: XXX/SMS-CC/ROMAN-MONTH/YEAR</small>
                        </div>

                        <div class="mb-4">
                            <label class="form-label">Nama PT</label>
                            <input type="text" id="pt_name" name="pt_name" class="form-control" readonly>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="mb-4">
                                <label class="form-label">Nama Teknisi</label>
                                <input type="text" id="technician_name" name="technician_name" class="form-control" readonly>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Customer Support Manager</label>
                                <input type="text" id="manager_name" name="supervisor_name" class="form-control" readonly>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="mb-4">
                                <label class="form-label">Hasil Akhir (Result)</label>
                                <select name="result" class="form-control">
                                    <option value="PASSED">PASSED</option>
                                    <option value="FAILED">FAILED</option>
                                </select>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Tanggal Kalibrasi</label>
                                <input type="date" name="calibration_date" class="form-control" value="{{ date('Y-m-d') }}" required>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-full shadow-lg mt-4">Generate Sertifikat & Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<!-- Choices.js JS -->
<script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>
<script>
    const masterData = @json($masterData);
    const meta = @json($meta);

    // Initialize Choices.js
    const hospitalChoices = new Choices('#hospital_select', { searchEnabled: true, itemSelectText: '' });
    const instrumentChoices = new Choices('#instrument_select', { searchEnabled: true, itemSelectText: '' });
    const snChoices = new Choices('#sn_select', { searchEnabled: true, itemSelectText: '' });

    const hospitalSelect = document.getElementById('hospital_select');
    const instrumentSelect = document.getElementById('instrument_select');
    const snSelect = document.getElementById('sn_select');

    hospitalSelect.addEventListener('change', function() {
        const hospital = this.value;
        
        instrumentChoices.clearStore();
        snChoices.clearStore();
        
        instrumentChoices.setChoices([{ value: '', label: 'Cari dan Pilih Alat...', selected: true, disabled: true }], 'value', 'label', true);
        snChoices.setChoices([{ value: '', label: 'Cari dan Pilih SN...', selected: true, disabled: true }], 'value', 'label', true);

        document.getElementById('instrument_wrapper').style.display = 'none';
        document.getElementById('sn_wrapper').style.display = 'none';
        document.getElementById('auto_fields').style.display = 'none';

        if (hospital) {
            const filtered = masterData.filter(row => row.hospital === hospital);
            const instruments = [...new Set(filtered.map(row => row.instrument))].sort();
            
            const choices = instruments.map(inst => ({ value: inst, label: inst }));
            instrumentChoices.setChoices(choices, 'value', 'label', true);
            document.getElementById('instrument_wrapper').style.display = 'block';
        }
    });

    instrumentSelect.addEventListener('change', function() {
        const hospital = hospitalSelect.value;
        const instrument = this.value;

        snChoices.clearStore();
        snChoices.setChoices([{ value: '', label: 'Cari dan Pilih SN...', selected: true, disabled: true }], 'value', 'label', true);
        
        document.getElementById('sn_wrapper').style.display = 'none';
        document.getElementById('auto_fields').style.display = 'none';

        if (instrument) {
            const sns = masterData.filter(row => row.hospital === hospital && row.instrument === instrument);
            
            if (sns.length === 1) {
                fillFields(sns[0]);
            } else {
                const choices = sns.map(row => ({ value: row.sn, label: row.sn }));
                snChoices.setChoices(choices, 'value', 'label', true);
                document.getElementById('sn_wrapper').style.display = 'block';
            }
        }
    });

    snSelect.addEventListener('change', function() {
        const hospital = hospitalSelect.value;
        const instrument = instrumentSelect.value;
        const sn = this.value;
        if (sn) {
            const row = masterData.find(row => row.hospital === hospital && row.instrument === instrument && row.sn === sn);
            fillFields(row);
        }
    });

    function fillFields(row) {
        console.log('Filling fields for:', row);
        
        // Update SN Choice if not already selected
        if (snSelect.value !== row.sn) {
            snChoices.setChoices([{ value: row.sn, label: row.sn, selected: true }], 'value', 'label', true);
        }

        document.getElementById('pt_name').value = row.pt || '';
        document.getElementById('technician_name').value = row.tech || '';
        document.getElementById('manager_name').value = row.manager || '';
        document.getElementById('auto_fields').style.display = 'block';

        const url = `{{ url('certificates/get-count') }}?sn=${encodeURIComponent(row.sn)}&hospital=${encodeURIComponent(row.hospital)}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const seq = String(data.count).padStart(3, '0');
                updateCertNumber(seq);
            })
            .catch(err => {
                updateCertNumber('001');
            });
    }

    function updateCertNumber(seq) {
        const dateVal = document.querySelector('input[name="calibration_date"]').value;
        const date = dateVal ? new Date(dateVal) : new Date();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        const romanMonths = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        const roman = romanMonths[month];
        
        // Use provided seq or extract from current if just changing date
        const currentVal = document.getElementById('cert_number').value;
        const finalSeq = seq || (currentVal ? currentVal.split('/')[0] : '001');
        
        document.getElementById('cert_number').value = `${finalSeq}/SMS-CC/${roman}/${year}`;
    }

    // Listen for date change
    document.querySelector('input[name="calibration_date"]').addEventListener('change', function() {
        updateCertNumber();
    });
</script>
@endpush
@endsection
