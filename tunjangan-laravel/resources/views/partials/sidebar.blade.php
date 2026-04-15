<nav class="pc-sidebar">
  <div class="navbar-wrapper">
    <div class="m-header flex items-center py-4 px-6 h-header-height">
      <a href="{{ url('/') }}" class="b-brand flex items-center gap-2">
        <img src="{{ asset('assets/images/icon.png') }}" class="img-fluid logo bg-white p-1 rounded-md" style="height: 38px; width: auto;" alt="logo" />
        <span class="text-white font-bold text-sm leading-tight ml-2">Sarana<br>Megamedilab<br>Sentosa</span>
      </a>
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
      </ul>
    </div>
  </div>
</nav>
