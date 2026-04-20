@extends('layouts.app')

@section('title', 'Data Karyawan')

@section('content')
<style>
    .table th, .table td { vertical-align: middle !important; }
    .text-center-force { text-align: center !important; }
    .card-header { position: relative; display: block !important; }
    .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
    }
    .action-container {
        display: flex !important;
        flex-direction: row !important;
        justify-content: center !important;
        gap: 12px !important;
        white-space: nowrap !important;
    }
    .table-sm td, .table-sm th { padding: 0.35rem 0.5rem !important; }
    /* Tombol tambah super mungil */
    .btn-mungil {
        font-size: 0.75rem !important;
        padding: 2px 10px !important;
        font-weight: 600 !important;
        border-radius: 4px !important;
    }
    .search-input {
        width: 200px;
        font-size: 0.75rem !important;
        padding: 5px 12px !important;
        border-radius: 6px !important;
    }
    
    /* Dark Mode Improvements */
    [data-pc-theme="dark"] .card { background: #1a1a1a !important; border-color: rgba(255,255,255,0.05); }
    [data-pc-theme="dark"] .card-header { border-bottom-color: rgba(255,255,255,0.05); }
    [data-pc-theme="dark"] .table { color: #ced4da !important; }
    [data-pc-theme="dark"] .table thead tr { background: rgba(255,255,255,0.02) !important; border-bottom-color: rgba(255,255,255,0.1) !important; }
    [data-pc-theme="dark"] .table tbody tr { border-bottom-color: rgba(255,255,255,0.05) !important; }
    [data-pc-theme="dark"] .table-hover tbody tr:hover { background-color: rgba(255,255,255,0.03) !important; }
    [data-pc-theme="dark"] .text-dark { color: #fff !important; }
    [data-pc-theme="dark"] .bg-light { background: rgba(0,0,0,0.2) !important; }
    
    [data-pc-theme="dark"] .search-input {
        background: rgba(255,255,255,0.05) !important;
        border-color: rgba(255,255,255,0.1) !important;
        color: #fff !important;
    }
    [data-pc-theme="dark"] .search-input::placeholder { color: rgba(255,255,255,0.4); }

</style>

<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Data Karyawan</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
            <li class="breadcrumb-item" aria-current="page">Karyawan</li>
        </ul>
    </div>
</div>

<div class="card" style="overflow: visible;">
    <div class="card-header py-2 px-4">
        <h5 class="mb-0 font-weight-bold" style="font-size: 0.95rem;">Manajemen Data Karyawan</h5>
        <div class="header-actions">
            <!-- Fitur Pencarian -->
            <input type="text" id="searchInput" class="search-input form-control-sm d-inline-block" placeholder="Cari Nama / ID..." onkeyup="filterTable()">
            
            <button onclick="openModalTambah()" class="btn btn-primary btn-mungil shadow-none d-inline-flex align-items-center justify-content-center gap-1">
                <i data-feather="plus" style="width: 12px; height: 12px; margin-top: -1px;"></i> Tambah
            </button>
        </div>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover table-sm mb-0" id="employeeTable">
                <thead>
                    <tr class="bg-light" style="font-size: 0.75rem; border-bottom: 2px solid #edeff0;">
                        <th class="text-center-force" style="width: 40px;">#</th>
                        <th class="text-center-force" style="width: 70px;">ID</th>
                        <th>NAMA LENGKAP</th>
                        <th>EMAIL</th>
                        <th class="text-center-force" style="width: 130px;">WHATSAPP</th>
                        <th class="text-center-force" style="width: 120px;">KONEKSI WA</th>
                        <th class="text-center-force" style="width: 100px;">ROLE</th>
                        <th class="text-center-force" style="width: 130px;">PEKERJAAN</th>
                        <th class="text-center-force" style="width: 90px;">AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($users as $index => $u)
                    <tr class="employee-row" style="font-size: 0.82rem; border-bottom: 1px solid #f8f9fa;" id="user-row-{{ $u->id }}">
                        <td class="text-center-force text-muted small">{{ $index + 1 }}</td>
                        <td class="text-center-force font-bold text-dark emp-id">{{ $u->employee_id ?? '-' }}</td>
                        <td class="emp-name"><strong>{{ $u->name }}</strong></td>
                        <td class="text-muted small">{{ $u->email }}</td>
                        <td class="text-center-force small">{{ $u->no_wa ?? '-' }}</td>
                        <td class="text-center-force">
                            <div id="wa-status-{{ $u->id }}">
                                <span class="badge bg-light text-muted border px-2 py-1" style="font-size: 0.65rem;">Mengecek...</span>
                            </div>
                        </td>
                        <td class="text-center-force">
                            <span class="text-primary font-bold" style="font-size: 0.7rem;">{{ strtoupper($u->role) }}</span>
                        </td>
                        <td class="text-center-force text-secondary small">{{ strtoupper($u->job ?? '-') }}</td>
                        <td>
                            <div class="action-container">
                                <a href="javascript:void(0)" onclick="requestPairing('{{ $u->id }}', '{{ $u->no_wa }}', '{{ $u->name }}')" 
                                   class="text-success" title="Link WhatsApp (8-Digit Code)"><i data-feather="link-2" style="width: 14px;"></i></a>

                                <a href="{{ route('admin.karyawan.print', $u->id) }}" target="_blank"
                                   class="text-primary" title="Cetak Name Tag"><i data-feather="printer" style="width: 14px;"></i></a>

                                <a href="javascript:void(0)" 
                                   onclick="openModalEdit({{ $u->id }}, '{{ addslashes($u->employee_id ?? '') }}', '{{ addslashes($u->name) }}', '{{ addslashes($u->email) }}', '{{ addslashes($u->no_wa) }}', '{{ addslashes($u->job) }}', '{{ addslashes($u->role) }}')" 
                                   class="text-info" title="Edit"><i data-feather="edit" style="width: 14px;"></i></a>
                                
                                <form action="{{ route('admin.karyawan.destroy', $u->id) }}" method="POST" class="m-0" style="display: inline;" onsubmit="return confirm('Hapus?')">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="p-0 border-0 bg-transparent text-danger"><i data-feather="trash-2" style="width: 14px;"></i></button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="9" class="text-center p-5 text-muted">Belum ada data karyawan.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@push('modals')
<style>
.custom-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    visibility: hidden; opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(5px);
}
.custom-modal-overlay.show { visibility: visible; opacity: 1; }
.custom-modal-content {
    background: #fff; width: 500px; border-radius: 20px; overflow: hidden;
    transform: scale(0.8); transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 30px 60px -12px rgba(0,0,0,0.45), 0 10px 20px -5px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
}
.custom-modal-overlay.show .custom-modal-content { transform: scale(1); }
.modal-header-premium {
    background: linear-gradient(135deg, #4680ff, #3264d1);
    padding: 22px 30px;
    color: #fff;
    border-bottom: 3px solid rgba(0,0,0,0.05);
}
.modal-body-premium {
    padding: 30px;
    max-height: 70vh;
    overflow-y: auto;
}
.modal-footer-premium {
    padding: 20px 30px 30px 30px;
    background: #f8f9fa;
    display: flex;
    justify-content: end;
    gap: 12px;
    border-top: 1px solid #ebedef;
}
.form-label-premium {
    font-size: 11px;
    font-weight: 800;
    color: #8b96a5;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
    text-transform: uppercase;
}
.premium-input {
    border-radius: 12px !important;
    border: 2px solid #f0f2f5 !important;
    padding: 12px 18px !important;
    font-size: 0.9rem !important;
    transition: all 0.3s ease;
    background: #fafbfd !important;
    color: inherit;
}
[data-pc-theme="dark"] .premium-input {
    background: rgba(255,255,255,0.03) !important;
    border-color: rgba(255,255,255,0.08) !important;
    color: #fff !important;
}
[data-pc-theme="dark"] .custom-modal-content {
    background: #1e1e1e;
    border-color: rgba(255,255,255,0.1);
}
[data-pc-theme="dark"] .modal-footer-premium {
    background: #181818;
    border-top-color: rgba(255,255,255,0.05);
}
[data-pc-theme="dark"] .form-label-premium { color: #6c757d; }

.premium-input:focus {
    background: #fff !important;
    border-color: #4680ff !important;
    box-shadow: 0 8px 20px rgba(70, 128, 255, 0.15) !important;
    transform: translateY(-1px);
}
.btn-premium {
    padding: 10px 25px !important;
    border-radius: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.btn-premium:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0,0,0,0.15);
}
</style>

<div id="modal-tambah" class="custom-modal-overlay">
    <div class="custom-modal-content">
        <form action="{{ route('admin.karyawan.store') }}" method="POST">
            @csrf
            <div class="modal-header-premium d-flex justify-content-between align-items-center">
                <h6 class="mb-0 text-white font-bold"><i data-feather="user-plus" class="me-2" style="width:20px;"></i> Tambah Karyawan Baru</h6>
                <button type="button" class="border-0 bg-transparent text-white opacity-75" style="font-size: 28px; line-height: 1;" onclick="closeModalTambah()">&times;</button>
            </div>
            <div class="modal-body-premium">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">ID Karyawan</label>
                        <input type="text" name="employee_id" class="form-control premium-input" value="{{ $nextId }}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">Bidang Pekerjaan</label>
                        <input type="text" name="job" class="form-control premium-input" placeholder="Misal: Teknisi">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label-premium">Nama Lengkap</label>
                    <input type="text" name="name" class="form-control premium-input" placeholder="Contoh: Budi Santoso" required>
                </div>
                <div class="mb-3">
                    <label class="form-label-premium">Alamat Email Login</label>
                    <input type="email" name="email" class="form-control premium-input" placeholder="email@contoh.com" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">No WhatsApp</label>
                        <input type="text" name="no_wa" class="form-control premium-input" placeholder="08xxx">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">Hak Akses Sistem</label>
                        <select name="role" class="form-select premium-input">
                            <option value="user">User (Teknisi)</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label-premium">Password Default</label>
                    <input type="text" name="password" class="form-control premium-input" value="123456" required>
                </div>
            </div>
            <div class="modal-footer-premium">
                <button type="button" class="btn btn-secondary btn-premium px-4" onclick="closeModalTambah()">Batal</button>
                <button type="submit" class="btn btn-primary btn-premium px-4 shadow">Simpan Data</button>
            </div>
        </form>
    </div>
</div>

<div id="modal-edit" class="custom-modal-overlay">
    <div class="custom-modal-content">
        <form id="form-edit" method="POST">
            @csrf @method('PUT')
            <div class="modal-header-premium d-flex justify-content-between align-items-center" style="background: linear-gradient(45deg, #04a9f5, #0492d4);">
                <h6 class="mb-0 text-white font-bold"><i data-feather="edit-3" class="me-2" style="width:18px;"></i> Edit Data Karyawan</h6>
                <button type="button" class="border-0 bg-transparent text-white" style="font-size: 24px; line-height: 1;" onclick="closeModalEdit()">&times;</button>
            </div>
            <div class="modal-body-premium">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">ID Karyawan</label>
                        <input type="text" name="employee_id" id="edit-employee_id" class="form-control premium-input" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">Pekerjaan</label>
                        <input type="text" name="job" id="edit-job" class="form-control premium-input">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label-premium">Nama Lengkap</label>
                    <input type="text" name="name" id="edit-name" class="form-control premium-input" required>
                </div>
                <div class="mb-3">
                    <label class="form-label-premium">Email Terdaftar</label>
                    <input type="email" name="email" id="edit-email" class="form-control premium-input" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">No WhatsApp</label>
                        <input type="text" name="no_wa" id="edit-no_wa" class="form-control premium-input">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label-premium">Hak Akses</label>
                        <select name="role" id="edit-role" class="form-select premium-input">
                            <option value="user">User (Teknisi)</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                </div>
                <div class="mt-2 p-3 theme-adaptive-box" style="background: #f8f9fa; border: 1px solid #e1e5eb; border-radius: 15px;">
                    <label class="form-label-premium mb-1"><i data-feather="lock" style="width:12px;"></i> Ganti Password (Opsional)</label>

                    <input type="text" name="password" class="form-control premium-input" placeholder="Isi hanya jika ingin ganti password baru">
                </div>
            </div>
            <div class="modal-footer-premium">
                <button type="button" class="btn btn-secondary btn-premium px-4" onclick="closeModalEdit()">Batal</button>
                <button type="submit" class="btn btn-info text-white btn-premium px-4 shadow">Update Profile</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal Pairing WhatsApp -->
<div id="modal-pairing" class="custom-modal-overlay">
    <div class="custom-modal-content" style="width: 450px; text-align: center;">
        <div class="modal-header-premium" style="background: linear-gradient(135deg, #2ecc71, #27ae60);">
            <h6 class="mb-0 text-white font-bold"><i data-feather="link" class="me-2" style="width:20px;"></i> Tautkan WhatsApp</h6>
        </div>
        <div class="modal-body-premium">
            <p class="text-sm text-muted mb-3">Tautkan Akun WA: <strong id="pair-user-name" class="text-dark"></strong></p>
            
            <div class="d-flex justify-content-center gap-2 mb-4">
                <button type="button" id="btn-mode-qr" class="btn btn-sm btn-outline-success active" onclick="switchMode('qr')">Scan QR Code</button>
                <button type="button" id="btn-mode-code" class="btn btn-sm btn-outline-success" onclick="switchMode('code')">8-Digit Code</button>
            </div>

            <div id="pair-loading" class="py-4">
                <div class="spinner-border text-success" role="status"></div>
                <p class="mt-2 text-xs text-muted">Menghubungkan ke server...</p>
            </div>

            <!-- MODE QR -->
            <div id="pair-qr-area" class="d-none">
                <div class="p-2 border rounded-3 bg-white mb-3 d-inline-block">
                    <img id="display-qr-img" src="" style="width: 250px; height: 250px; display: block; margin: 0 auto;" />
                </div>
                <p class="text-xs text-muted">Buka WA -> Perangkat Tertaut -> Tautkan Perangkat -> <b>Scan QR di atas</b></p>
            </div>

            <!-- MODE CODE -->
            <div id="pair-code-area" class="d-none">
                <div class="p-4 rounded-3 border bg-light mb-3">
                    <span class="d-block text-xs font-bold text-muted mb-2">MASUKKAN KODE INI DI HP KARYAWAN:</span>
                    <h2 id="display-pair-code" class="mb-0 font-bold tracking-widest text-success" style="font-family: monospace; letter-spacing: 5px;">--------</h2>
                </div>
                <div class="alert alert-warning py-2 text-xs text-start">
                    <ol class="ps-3 mb-0">
                        <li>Buka WhatsApp di HP Karyawan</li>
                        <li><b>Linked Devices / Perangkat Tertaut</b></li>
                        <li>Pilih <b>Link with Phone Number</b></li>
                        <li>Masukkan 8 digit kode di atas</li>
                    </ol>
                </div>
            </div>
        </div>
        <div class="modal-footer-premium">
            <button type="button" class="btn btn-secondary btn-premium px-4 w-100" onclick="closeModalPairing()">Tutup</button>
        </div>
    </div>
</div>
@endpush

@push('scripts')
<script>
    function openModalTambah() { 
        document.getElementById('modal-tambah').classList.add('show'); 
        feather.replace();
    }
    function closeModalTambah() { document.getElementById('modal-tambah').classList.remove('show'); }
    function openModalEdit(id, emp_id, name, email, wa, job, role) {
        let f = document.getElementById('form-edit');
        f.action = "{{ url('admin/karyawan') }}/" + id;
        document.getElementById('edit-employee_id').value = emp_id;
        document.getElementById('edit-name').value = name;
        document.getElementById('edit-email').value = email;
        document.getElementById('edit-no_wa').value = wa;
        document.getElementById('edit-job').value = job;
        document.getElementById('edit-role').value = role;
        document.getElementById('modal-edit').classList.add('show');
        feather.replace();
    }
    function closeModalEdit() { document.getElementById('modal-edit').classList.remove('show'); }

    // Fitur Pencarian Real-time
    function filterTable() {
        let input = document.getElementById("searchInput");
        let filter = input.value.toLowerCase();
        let rows = document.getElementsByClassName("employee-row");

        for (let i = 0; i < rows.length; i++) {
            let id = rows[i].getElementsByClassName("emp-id")[0].textContent.toLowerCase();
            let name = rows[i].getElementsByClassName("emp-name")[0].textContent.toLowerCase();
            
            if (id.includes(filter) || name.includes(filter)) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }

    // WHATSAPP PAIRING LOGIC
    const BOT_URL = "http://" + window.location.hostname + ":3001"; 
    let currentPairId = null;
    let currentPairPhone = null;
    let modeInterval = null;
    let statusInterval = null;

    function requestPairing(id, phone, name) {
        if(!phone || phone === '') return alert('Nomor WA belum diisi!');
        
        currentPairId = id;
        currentPairPhone = phone;
        document.getElementById('pair-user-name').innerText = name;
        document.getElementById('modal-pairing').classList.add('show');
        
        switchMode('qr'); // Default QR MODE
        feather.replace();
    }

    function switchMode(mode) {
        clearInterval(modeInterval);
        const loadingBox = document.getElementById('pair-loading');
        const qrArea = document.getElementById('pair-qr-area');
        const codeArea = document.getElementById('pair-code-area');
        const qrImg = document.getElementById('display-qr-img');
        const codeText = document.getElementById('display-pair-code');

        loadingBox.classList.remove('d-none');
        qrArea.classList.add('d-none');
        codeArea.classList.add('d-none');
        
        document.getElementById('btn-mode-qr').classList.toggle('active', mode === 'qr');
        document.getElementById('btn-mode-code').classList.toggle('active', mode === 'code');

        if(mode === 'qr') {
            qrImg.src = ""; // Reset
            let attempts = 0;
            const fetchQR = () => {
                fetch(`${BOT_URL}/api/wa/qr/user_${currentPairId}`)
                    .then(res => res.json())
                    .then(data => {
                        if(data.status === 'waiting' && data.qr) {
                            loadingBox.classList.add('d-none');
                            qrImg.src = data.qr;
                            qrArea.classList.remove('d-none');
                        } else if (data.status === 'connected') {
                            loadingBox.innerHTML = '<p class="text-success font-bold">Terhubung!</p>';
                        } else {
                            // Masih generating, coba lagi
                            attempts++;
                            if(attempts < 10) setTimeout(fetchQR, 2000);
                            else loadingBox.innerHTML = '<p class="text-danger">Gagal memuat QR. Coba lagi nanti.</p>';
                        }
                    })
                    .catch(() => {
                        loadingBox.innerHTML = '<p class="text-danger">Bot Server tidak aktif (Port 3001)</p>';
                    });
            };
            fetchQR();
            modeInterval = setInterval(fetchQR, 30000);
        } else {
            let cleanPhone = currentPairPhone.replace(/[^0-9]/g, '');
            if(cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);

            fetch(`${BOT_URL}/api/wa/pair-code/user_${currentPairId}?phone=${cleanPhone}`)
                .then(res => res.json())
                .then(data => {
                    loadingBox.classList.add('d-none');
                    if(data.code) {
                        codeText.innerText = data.code;
                        codeArea.classList.remove('d-none');
                    }
                })
                .catch(() => {
                    loadingBox.innerHTML = '<p class="text-danger">Gagal mendapatkan kode.</p>';
                });
        }
        
        // Start checking connection status using our new centralized Laravel endpoint
        if(!statusInterval) startPollingStatus(currentPairId);
    }

    function closeModalPairing() {
        clearInterval(modeInterval);
        clearInterval(statusInterval);
        statusInterval = null;
        document.getElementById('modal-pairing').classList.remove('show');
    }

    function updateBadgeStatus(id, connected) {
        const div = document.getElementById(`wa-status-${id}`);
        if(!div) return;
        if(connected) {
            div.innerHTML = '<span class="badge bg-success shadow-sm px-2 py-1" style="font-size: 0.65rem;"><i data-feather="check" style="width:10px;height:10px;"></i> CONNECTED</span>';
        } else {
            div.innerHTML = '<span class="badge bg-danger shadow-sm px-2 py-1" style="font-size: 0.65rem;"><i data-feather="x" style="width:10px;height:10px;"></i> OFFLINE</span>';
        }
        feather.replace();
    }

    function startPollingStatus(id) {
        statusInterval = setInterval(() => {
            fetch(`{{ url('admin/karyawan/status') }}/${id}`)
                .then(res => res.json())
                .then(data => {
                    if(data.connected) {
                        updateBadgeStatus(id, true);
                        if(document.getElementById('modal-pairing').classList.contains('show')) {
                            closeModalPairing();
                            alert('WhatsApp Berhasil Terhubung!');
                        }
                    } else {
                        updateBadgeStatus(id, false);
                    }
                });
        }, 5000);
    }

    // Init status saat halaman load
    function initializeStatusCheck() {
        const rows = document.querySelectorAll('[id^="wa-status-"]');
        rows.forEach(row => {
            const id = row.id.replace('wa-status-', '');
            fetch(`{{ url('admin/karyawan/status') }}/${id}`)
                .then(res => res.json())
                .then(data => {
                    updateBadgeStatus(id, data.connected);
                })
                .catch(() => updateBadgeStatus(id, false));
        });
    }

    // Run on load and after a short delay to ensure everything is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeStatusCheck, 500);
    });

</script>
@endpush
