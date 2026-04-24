@extends('layouts.app')

@section('title', 'Mapping Grup WA')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="page-header-title">
            <h5 class="mb-0 font-medium">Mapping Grup WhatsApp</h5>
        </div>
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
            <li class="breadcrumb-item" aria-current="page">Grup WA</li>
        </ul>
    </div>
</div>

<div class="card">
    <div class="card-header flex justify-between items-center">
        <h5>Pengaturan Notifikasi Grup WA</h5>
        <div class="flex gap-2">
            <button class="btn btn-outline-success btn-sm flex items-center gap-2" onclick="openModalBotAdmin()">
                <i data-feather="monitor" style="width: 16px; height: 16px;"></i> Scan Bot Admin
            </button>
            <button class="btn btn-primary btn-sm flex items-center gap-2" onclick="openModalWa()">
                <i data-feather="message-circle" style="width: 16px; height: 16px;"></i> Tambah Mapping
            </button>
        </div>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Kode/Nama Jabatan (Job)</th>
                        <th>ID Grup WhatsApp</th>
                        <th>Keterangan Nama Grup</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($mappings as $index => $m)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ strtoupper($m->job_name) }}</td>
                        <td class="font-mono text-sm text-primary-500">{{ $m->wa_group_id }}</td>
                        <td>{{ $m->group_name ?? '-' }}</td>
                        <td>
                            <div class="flex items-center gap-3">
                                <form action="{{ route('admin.wagroup.destroy', $m->id) }}" method="POST" class="d-inline" onsubmit="return confirm('Hapus mapping ini?')">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-link text-danger p-0 border-0 bg-transparent"><i data-feather="trash-2" style="width: 18px; height: 18px;"></i></button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="text-center p-3">Belum ada mapping grup WA.</td>
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
/* Custom Pure CSS Modal */
.custom-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}
.custom-modal-overlay.show {
    opacity: 1;
    visibility: visible;
}
.custom-modal-content {
    background: #fff;
    border-radius: 8px;
    width: 400px; /* Persegi / Kotak */
    max-width: 90%;
    transform: translateY(-20px);
    transition: all 0.3s ease;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.custom-modal-overlay.show .custom-modal-content {
    transform: translateY(0);
}
.dark .custom-modal-content {
    background: #1e293b;
    color: #fff;
}
</style>

<!-- Modal Tambah WA Group -->
<div id="modal-wagroup" class="custom-modal-overlay">
    <div class="custom-modal-content">
        <form action="{{ route('admin.wagroup.store') }}" method="POST">
            @csrf
            <div class="p-4 border-b flex justify-between items-center" style="border-bottom: 1px solid #eee;">
                <h5 class="m-0" style="font-size: 1.1rem; font-weight: 600;">Tambah Mapping WA</h5>
                <button type="button" class="btn-close" onclick="closeModalWa()">&times;</button>
            </div>
            <div class="p-4" style="max-height: 70vh; overflow-y: auto;">
                <div class="mb-4">
                    <label class="form-label text-sm font-bold">Pekerjaan</label>
                    <select name="job_name" class="form-select" required>
                        <option value="">-- Pilih Pekerjaan --</option>
                        @foreach($jobs as $job)
                            <option value="{{ $job }}">{{ strtoupper($job) }}</option>
                        @endforeach
                    </select>
                    <small class="text-muted text-xs">Otomatis sinkron dengan daftar Job di menu Karyawan.</small>
                </div>
                <div class="mb-3">
                    <label class="form-label text-sm">WhatsApp Group ID</label>
                    <input type="text" name="wa_group_id" id="input-group-id" class="form-control" placeholder="Contoh: 120...8@g.us" required>
                </div>
                <div class="mb-3">
                    <label class="form-label text-sm">Keterangan Label Grup</label>
                    <input type="text" name="group_name" id="input-group-name" class="form-control" placeholder="Contoh: Grup Teknisi Jakarta">
                </div>
            </div>
            <div class="p-4 border-t flex justify-end gap-2" style="border-top: 1px solid #eee;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="closeModalWa()">Batal</button>
                <button type="submit" class="btn btn-primary btn-sm">Simpan Mapping</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal Scan Bot Admin -->
<div id="modal-botadmin" class="custom-modal-overlay">
    <div class="custom-modal-content" style="width: 450px;">
        <div class="p-4 border-b flex justify-between items-center" style="border-bottom: 1px solid #eee;">
            <h5 class="m-0" style="font-size: 1.1rem; font-weight: 600;">Pairing Scanner Admin</h5>
            <button type="button" class="btn-close" onclick="closeModalBotAdmin()">&times;</button>
        </div>
        <div class="p-4 text-center">
            <p class="text-sm text-muted mb-3">Scan QR Code ini menggunakan HP khusus Admin Utama untuk melacak semua ID Grup Rumah Sakit secara instan.</p>
            <div id="qr-bot-container" class="my-4 bg-light d-flex flex-column align-items-center justify-content-center rounded border" style="min-height: 350px; width: 100%; padding: 20px;">
                <!-- Animasi loading -->
                <div class="spinner-border text-primary mb-3" role="status" id="qr-loading"></div>
                
                <!-- Wrapper untuk QR agar benar-benar di tengah -->
                <div class="d-block text-center w-100">
                    <img id="qr-bot-image" src="" class="d-none border bg-white p-2 mx-auto" alt="QR Code Admin" style="max-width: 260px; height: auto; display: block;" />
                </div>
                
                <div id="qr-bot-status" class="mt-3 font-weight-bold text-success text-center d-none" style="font-size: 1.1rem; width: 100%;"></div>
            </div>
            <div class="d-flex justify-content-center gap-2 mb-3">
                <button class="btn btn-outline-secondary btn-sm" onclick="fetchAdminQR()">Muat Ulang QR</button>
                <button class="btn btn-danger btn-sm d-none" id="qr-bot-logout" onclick="logoutAdminQR()"><i data-feather="power" class="w-4 h-4 mr-1"></i> Ganti HP / Disconnect</button>
            </div>

            <!-- Daftar Grup yang Muncul Setelah Konek -->
            <div id="qr-group-list-area" class="d-none text-left border-top pt-3">
                <div class="flex justify-between items-center mb-2">
                    <h6 class="m-0 font-bold text-sm">Grup WA Terdeteksi:</h6>
                    <button class="btn btn-link btn-sm p-0 text-primary text-xs" onclick="refreshGroupListInModal()">Refresh List</button>
                </div>
                <div class="bg-gray-50 rounded p-0 border overflow-hidden" style="max-height: 200px; overflow-y: auto;">
                    <table class="table table-sm table-striped mb-0 text-xs">
                        <thead class="bg-gray-200">
                            <tr>
                                <th class="py-1">Nama Grup</th>
                                <th class="py-1">Group ID (Copas ini)</th>
                            </tr>
                        </thead>
                        <tbody id="qr-group-items">
                            <tr><td colspan="2" class="text-center p-2">Memuat daftar grup...</td></tr>
                        </tbody>
                    </table>
                </div>
                <p class="text-xs text-muted mt-2">Pilih ID grup di atas untuk didaftarkan ke Job di menu "Tambah Mapping".</p>
            </div>
        </div>
    </div>
</div>
<!-- Modal Lihat QR Grup -->
<div id="modal-view-qr" class="custom-modal-overlay">
    <div class="custom-modal-content" style="width: 420px; border-radius: 12px; overflow: hidden; border: none;">
        <div class="p-4 border-b d-flex justify-content-between align-items-center bg-primary text-white" style="border-bottom: 1px solid #ebedef;">
            <h5 class="mb-0 text-white" id="qr-modal-title" style="font-size: 1.1rem; font-weight: 700;">QR Sinkronisasi</h5>
            <button type="button" class="btn-close border-0 bg-transparent text-white" style="font-size: 1.5rem; line-height: 1;" onclick="closeModalQR()">&times;</button>
        </div>
        <div class="p-5 text-center">
            <div class="alert alert-info py-2 px-3 text-xs mb-4 text-left" style="font-size: 0.75rem; border-left: 4px solid #00acc1;">
                <i data-feather="info" class="w-4 h-4 mr-2"></i>
                <strong>INFO:</strong> Gunakan fitur <b>Scanner di Aplikasi Mobile</b> untuk memindai kode ini. Kode ini berisi ID Grup untuk tujuan pengiriman laporan otomatis.
            </div>
            
            <div class="d-inline-block p-3 bg-white rounded shadow-sm border mb-4" style="background: #fff; border: 1px solid #f0f0f0 !important;">
                <img id="qr-image-display" src="" alt="QR Code" style="width: 260px; height: 260px; display: block; margin: 0 auto;">
            </div>

            <div class="mt-2 text-center">
                <span class="d-block text-muted font-bold mb-1" style="font-size: 0.7rem; letter-spacing: 1px;">KODE IDENTITAS GRUP:</span>
                <div class="p-2 bg-dark rounded d-inline-block w-100" style="word-break: break-all;">
                    <code id="qr-id-text" class="text-warning font-bold" style="font-size: 0.85rem;"></code>
                </div>
            </div>
        </div>
        <div class="p-4 bg-light text-center border-t" style="border-top: 1px solid #ebedef;">
            <button type="button" class="btn btn-primary px-5" style="border-radius: 6px; font-weight: 600;" onclick="closeModalQR()">Selesai</button>
        </div>
    </div>
</div>
@endpush

@push('scripts')
<script>
    function openModalWa() {
        document.getElementById('modal-wagroup').classList.add('show');
    }
    function closeModalWa() {
        document.getElementById('modal-wagroup').classList.remove('show');
    }

    function openModalBotAdmin() {
        document.getElementById('modal-botadmin').classList.add('show');
        fetchAdminQR();
    }
    function closeModalBotAdmin() {
        document.getElementById('modal-botadmin').classList.remove('show');
    }

    function fetchAdminQR() {
        const botHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? window.location.hostname : '127.0.0.1';
        const botUrl = `http://${botHost}:3001/api/wa/qr/report_bot`;

        document.getElementById('qr-loading').classList.remove('d-none');
        document.getElementById('qr-bot-image').classList.add('d-none');
        document.getElementById('qr-bot-status').classList.add('d-none');
        document.getElementById('qr-bot-logout').classList.add('d-none');

        fetch(botUrl)
            .then(res => res.json())
            .then(data => {
                document.getElementById('qr-loading').classList.add('d-none');
                if (data.status === 'connected') {
                    document.getElementById('qr-bot-status').innerText = '✅ Bot Aktif & Siap Merekam Grup!';
                    document.getElementById('qr-bot-status').classList.remove('d-none');
                    document.getElementById('qr-bot-logout').classList.remove('d-none');
                    document.getElementById('qr-group-list-area').classList.remove('d-none'); 
                    refreshGroupListInModal();
                    feather.replace();
                } else if (data.status === 'waiting') {
                    document.getElementById('qr-bot-image').src = data.qr;
                    document.getElementById('qr-bot-image').classList.remove('d-none');
                    setTimeout(fetchAdminQR, 5000);
                } else {
                    setTimeout(fetchAdminQR, 3000);
                }
            })
            .catch(err => {
                document.getElementById('qr-loading').classList.add('d-none');
                document.getElementById('qr-bot-status').innerHTML = `
                    ❌ Layanan Baileys Node.js Belum Dinyalakan!<br>
                    <button class="btn btn-primary btn-sm mt-3" onclick="startNodeServer()"><i data-feather="play"></i> Mulai Layanan Bot</button>
                `;
                document.getElementById('qr-bot-status').classList.remove('d-none');
                feather.replace();
            });
    }

    function startNodeServer() {
        document.getElementById('qr-bot-status').innerHTML = 'Memulai Server di Background... Mohon tunggu 3-5 detik.';
        fetch('{{ route("admin.wa-bot.start") }}')
            .then(res => res.json())
            .then(data => {
                setTimeout(fetchAdminQR, 3000);
            })
            .catch(err => {
                alert('Gagal memulai server lokal. Silakan jalankan node secara manual lewat terminal.');
            });
    }

    function logoutAdminQR() {
        const botHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? window.location.hostname : '127.0.0.1';
        if(!confirm('Yakin ingin memutuskan koneksi Bot WA Admin saat ini?')) return;
        document.getElementById('qr-bot-logout').innerHTML = 'Memproses...';
        
        fetch(`http://${botHost}:3001/api/wa/logout/report_bot`)
            .then(res => res.json())
            .then(data => {
                document.getElementById('qr-bot-logout').innerHTML = '<i data-feather="power" class="w-4 h-4 mr-1"></i> Ganti HP / Disconnect';
                document.getElementById('qr-group-list-area').classList.add('d-none'); 
                fetchAdminQR(); 
            });
    }

    function refreshGroupListInModal() {
        const botHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? window.location.hostname : '127.0.0.1';
        const tbody = document.getElementById('qr-group-items');
        tbody.innerHTML = '<tr><td colspan="2" class="text-center p-2">Memuat Grup...</td></tr>';

        fetch(`http://${botHost}:3001/api/wa/groups/report_bot`)
            .then(res => {
                if(!res.ok) throw new Error("Bot belum siap");
                return res.json();
            })
            .then(data => {
                if (data.success && data.groups.length > 0) {
                    tbody.innerHTML = '';
                    data.groups.forEach(g => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td class="py-1 font-weight-bold" style="font-size: 11px;">${g.subject}</td>
                            <td class="py-1 text-right"><code class="bg-white p-1 rounded border" style="user-select: all; font-size: 10px;">${g.id}</code></td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="2" class="text-center p-2 text-danger">Grup tidak ditemukan atau bot masih sinkronisasi.</td></tr>';
                }
            })
            .catch(err => {
                tbody.innerHTML = '<tr><td colspan="2" class="text-center p-2 text-danger">Gagal memuat. Pastikan HP sudah terhubung sempurna.</td></tr>';
            });
    }

    function openModalQR(groupId, jobName) {
        document.getElementById('qr-modal-title').innerText = "QR Group: " + jobName;
        document.getElementById('qr-id-text').innerText = groupId;
        document.getElementById('qr-image-display').src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(groupId);
        document.getElementById('modal-view-qr').classList.add('show');
    }
    function closeModalQR() {
        document.getElementById('modal-view-qr').classList.remove('show');
    }
</script>
@endpush
