<nav class="pc-sidebar">
  <div class="navbar-wrapper">
    <div class="m-header flex items-center py-4 px-6 h-header-height">
      <a href="{{ route('dashboard') }}" class="b-brand flex items-center gap-2">
        <img src="{{ asset('assets/images/icon.png?v=1.4') }}" class="img-fluid logo" style="height: 60px; width: auto; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.3);" alt="logo" />
        <span class="text-white font-bold ml-3" style="font-size: 16px; line-height: 1.2;">Sarana<br>Megamedilab<br>Sentosa</span>
      </a>
    </div>
    
    <!-- Status WA Global -->
    <div class="px-6 py-2 mb-2 border-b border-white/5 flex items-center justify-between">
        <span class="text-white/50 text-[10px] uppercase font-bold tracking-widest">WA Server Status</span>
        <div id="global-wa-status" class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
            </span>
            <span class="text-gray-400 text-[10px] font-bold">CHECKING...</span>
        </div>
    </div>
    <div class="navbar-content h-[calc(100vh_-_74px)] py-2.5">
      <ul class="pc-navbar">
        <li class="pc-item pc-caption">
          <label>UTAMA</label>
        </li>
        <li class="pc-item @if(Request::is('dashboard')) active @endif">
          <a href="{{ route('dashboard') }}" class="pc-link">
            <span class="pc-micon">
              <i data-feather="home"></i>
            </span>
            <span class="pc-mtext">Dashboard</span>
          </a>
        </li>
        <li class="pc-item @if(Request::is('admin/karyawan*')) active @endif">
          <a href="{{ route('admin.karyawan') }}" class="pc-link">
            <span class="pc-micon">
              <i data-feather="users"></i>
            </span>
            <span class="pc-mtext">Data Karyawan</span>
          </a>
        </li>
        
        <li class="pc-item pc-caption mt-2">
          <label>SHARE LOKASI & LAPORAN</label>
        </li>
        <li class="pc-item @if(Request::is('admin/rekap*')) active @endif">
          <a href="{{ route('admin.rekap') }}" class="pc-link">
            <span class="pc-micon">
              <i data-feather="file-text"></i>
            </span>
            <span class="pc-mtext">Tarik Laporan (Rekap)</span>
          </a>
        </li>
        <li class="pc-item @if(Request::is('admin/wagroup*')) active @endif">
          <a href="{{ route('admin.wagroup') }}" class="pc-link">
            <span class="pc-micon">
              <i data-feather="message-circle"></i>
            </span>
            <span class="pc-mtext">Mapping Grup WA</span>
          </a>
        </li>
        <li class="pc-item @if(Request::is('admin/harga*')) active @endif">
          <a href="{{ route('admin.harga') }}" class="pc-link">
            <span class="pc-micon">
              <i data-feather="dollar-sign"></i>
            </span>
            <span class="pc-mtext">Manajemen Harga</span>
          </a>
        </li>
        <li class="pc-item pc-caption mt-2">
          <label>KONTROL SERTIFIKAT</label>
        </li>
        <li class="pc-item @if(Request::is('certificates/create')) active @endif">
          <a href="{{ route('certificates.create') }}" class="pc-link">
            <span class="pc-micon">
              <i data-feather="plus-circle"></i>
            </span>
            <span class="pc-mtext">Generate Sertifikat</span>
          </a>
        </li>
        <li class="pc-item @if(Request::is('certificates')) active @endif">
          <a href="{{ route('certificates.index') }}" class="pc-link">
            <span class="pc-micon">
              <i data-feather="database"></i>
            </span>
            <span class="pc-mtext">Database Sertifikat</span>
          </a>
        </li>

        <li class="pc-item @if(Request::is('admin/settings*') || Request::is('settings*')) active @endif">
            <a href="{{ route('admin.master-sertifikat') }}" class="pc-link">
                <span class="pc-micon"><i data-feather="settings"></i></span>
                <span class="pc-mtext">Pengaturan Sistem</span>
            </a>
        </li>

        <li class="pc-item pc-caption mt-2">
            <label>ABSENSI</label>
        </li>
        <li class="pc-item @if(Request::is('admin/absensi/rekap*')) active @endif">
            <a href="{{ route('admin.absensi.rekap') }}" class="pc-link">
                <span class="pc-micon"><i data-feather="file-text"></i></span>
                <span class="pc-mtext">Rekap Absensi</span>
            </a>
        </li>
        <li class="pc-item @if(Request::is('admin/absensi/settings*')) active @endif">
            <a href="{{ route('admin.absensi.settings') }}" class="pc-link">
                <span class="pc-micon"><i data-feather="settings"></i></span>
                <span class="pc-mtext">Pengaturan Absensi</span>
            </a>
        </li>
      </ul>
    </div>
  </div>
</nav>
