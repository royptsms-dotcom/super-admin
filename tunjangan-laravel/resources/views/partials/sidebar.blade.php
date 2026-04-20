<nav class="pc-sidebar">
  <div class="navbar-wrapper">
    <div class="m-header flex items-center py-4 px-6 h-header-height">
      <a href="{{ route('dashboard') }}" class="b-brand flex items-center gap-2">
        <img src="{{ asset('assets/images/icon.png?v=1.4') }}" class="img-fluid logo" style="height: 60px; width: auto; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.3);" alt="logo" />
        <span class="text-white font-bold ml-3" style="font-size: 16px; line-height: 1.2;">Sarana<br>Megamedilab<br>Sentosa</span>
      </a>
    </div>
    
    <!-- Status WA Global (Sidebar Version) -->
    <div class="px-6 py-2 mb-2 border-b border-white/5 flex items-center justify-between sidebar-wa-status">
        <span class="text-white/50 text-[10px] uppercase font-bold tracking-widest">WA Server Status</span>
        <div id="global-wa-status-sidebar" class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
            </span>
            <span class="text-gray-400 text-[10px] font-bold">CHECKING...</span>
        </div>
    </div>

    <div class="navbar-content h-full">
      <!-- 1. DASHBOARD 1: VERTICAL FLAT MENU (Tampil Semua) -->
      <ul class="pc-navbar nav-vertical">
        <li class="pc-item pc-caption"><label>UTAMA</label></li>
        <li class="pc-item @if(Request::is('admin/dashboard') || Request::is('dashboard')) active @endif">
          <a href="{{ route('dashboard') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="home"></i></span>
            <span class="pc-mtext">Dashboard</span>
          </a>
        </li>
        @if(Auth::user()->hasPermission('admin.karyawan'))
        <li class="pc-item @if(Request::is('admin/karyawan*')) active @endif">
          <a href="{{ route('admin.karyawan') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="users"></i></span>
            <span class="pc-mtext">Data Karyawan</span>
          </a>
        </li>
        @endif
        @if(Auth::user()->hasPermission('admin.permissions'))
        <li class="pc-item @if(Request::is('admin/permissions*')) active @endif">
          <a href="{{ route('admin.permissions') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="shield"></i></span>
            <span class="pc-mtext">Izin Akses (Permission)</span>
          </a>
        </li>
        @endif

        @if(Auth::user()->hasPermission('admin.rekap') || Auth::user()->hasPermission('admin.wagroup') || Auth::user()->hasPermission('admin.harga'))
        <li class="pc-item pc-caption"><label>SHARE LOKASI & LAPORAN</label></li>
        @if(Auth::user()->hasPermission('admin.rekap'))
        <li class="pc-item @if(Request::is('admin/rekap*')) active @endif">
          <a href="{{ route('admin.rekap') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="file-text"></i></span>
            <span class="pc-mtext">Tarik Laporan (Rekap)</span>
          </a>
        </li>
        @endif
        @if(Auth::user()->hasPermission('admin.wagroup'))
        <li class="pc-item @if(Request::is('admin/wagroup*')) active @endif">
          <a href="{{ route('admin.wagroup') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="message-circle"></i></span>
            <span class="pc-mtext">Mapping Grup WA</span>
          </a>
        </li>
        @endif
        @if(Auth::user()->hasPermission('admin.harga'))
        <li class="pc-item @if(Request::is('admin/harga*')) active @endif">
          <a href="{{ route('admin.harga') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="dollar-sign"></i></span>
            <span class="pc-mtext">Manajemen Harga</span>
          </a>
        </li>
        @endif
        @endif

        @if(Auth::user()->hasPermission('certificates.create') || Auth::user()->hasPermission('certificates.index') || Auth::user()->hasPermission('admin.master-sertifikat'))
        <li class="pc-item pc-caption"><label>KONTROL SERTIFIKAT</label></li>
        @if(Auth::user()->hasPermission('certificates.create'))
        <li class="pc-item @if(Request::is('certificates/create')) active @endif">
          <a href="{{ route('certificates.create') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="plus-circle"></i></span>
            <span class="pc-mtext">Generate Sertifikat</span>
          </a>
        </li>
        @endif
        @if(Auth::user()->hasPermission('certificates.index'))
        <li class="pc-item @if(Request::is('certificates')) active @endif">
          <a href="{{ route('certificates.index') }}" class="pc-link">
            <span class="pc-micon"><i data-feather="database"></i></span>
            <span class="pc-mtext">Database Sertifikat</span>
          </a>
        </li>
        @endif
        @if(Auth::user()->hasPermission('admin.master-sertifikat'))
        <li class="pc-item @if(Request::is('admin/master-sertifikat*')) active @endif">
            <a href="{{ route('admin.master-sertifikat') }}" class="pc-link">
                <span class="pc-micon"><i data-feather="settings"></i></span>
                <span class="pc-mtext">Pengaturan Sistem</span>
            </a>
        </li>
        @endif
        @endif

        @if(Auth::user()->hasPermission('admin.absensi.rekap') || Auth::user()->hasPermission('admin.absensi.settings'))
        <li class="pc-item pc-caption"><label>ABSENSI</label></li>
        @if(Auth::user()->hasPermission('admin.absensi.rekap'))
        <li class="pc-item @if(Request::is('admin/absensi/rekap*')) active @endif">
            <a href="{{ route('admin.absensi.rekap') }}" class="pc-link">
                <span class="pc-micon"><i data-feather="file-text"></i></span>
                <span class="pc-mtext">Rekap Absensi</span>
            </a>
        </li>
        @endif
        @if(Auth::user()->hasPermission('admin.absensi.settings'))
        <li class="pc-item @if(Request::is('admin/absensi/settings*')) active @endif">
            <a href="{{ route('admin.absensi.settings') }}" class="pc-link">
                <span class="pc-micon"><i data-feather="settings"></i></span>
                <span class="pc-mtext">Pengaturan Absensi</span>
            </a>
        </li>
        @endif
        @endif
      </ul>

      <!-- 2. DASHBOARD 2: HORIZONTAL DROPDOWN MENU (Tampil Ringkas) -->
      <ul class="pc-navbar nav-horizontal uppercase font-bold text-[11px]">
        <li class="pc-item pc-hasmenu">
          <a href="#!" class="pc-link">
            <span class="pc-micon"><i data-feather="grid"></i></span>
            <span class="pc-mtext">MENU UTAMA</span>
            <span class="pc-arrow"><i data-feather="chevron-down"></i></span>
          </a>
          <ul class="pc-submenu">
            <li class="pc-item"><a class="pc-link" href="{{ route('dashboard') }}">Dashboard</a></li>
            @if(Auth::user()->hasPermission('admin.karyawan'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.karyawan') }}">Data Karyawan</a></li>
            @endif
            @if(Auth::user()->hasPermission('admin.permissions'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.permissions') }}">Izin Akses (Permission)</a></li>
            @endif
          </ul>
        </li>

        @if(Auth::user()->hasPermission('admin.rekap') || Auth::user()->hasPermission('admin.wagroup') || Auth::user()->hasPermission('admin.harga'))
        <li class="pc-item pc-hasmenu">
          <a href="#!" class="pc-link">
            <span class="pc-micon"><i data-feather="file-text"></i></span>
            <span class="pc-mtext">LAPORAN & GRUP</span>
            <span class="pc-arrow"><i data-feather="chevron-down"></i></span>
          </a>
          <ul class="pc-submenu">
            @if(Auth::user()->hasPermission('admin.rekap'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.rekap') }}">Tarik Laporan (Rekap)</a></li>
            @endif
            @if(Auth::user()->hasPermission('admin.wagroup'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.wagroup') }}">Mapping Grup WA</a></li>
            @endif
            @if(Auth::user()->hasPermission('admin.harga'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.harga') }}">Manajemen Harga</a></li>
            @endif
          </ul>
        </li>
        @endif

        @if(Auth::user()->hasPermission('certificates.create') || Auth::user()->hasPermission('certificates.index') || Auth::user()->hasPermission('admin.master-sertifikat'))
        <li class="pc-item pc-hasmenu">
          <a href="#!" class="pc-link">
            <span class="pc-micon"><i data-feather="award"></i></span>
            <span class="pc-mtext">KONTROL SERTIFIKAT</span>
            <span class="pc-arrow"><i data-feather="chevron-down"></i></span>
          </a>
          <ul class="pc-submenu">
            @if(Auth::user()->hasPermission('certificates.create'))
            <li class="pc-item"><a class="pc-link" href="{{ route('certificates.create') }}">Generate Sertifikat</a></li>
            @endif
            @if(Auth::user()->hasPermission('certificates.index'))
            <li class="pc-item"><a class="pc-link" href="{{ route('certificates.index') }}">Database Sertifikat</a></li>
            @endif
            @if(Auth::user()->hasPermission('admin.master-sertifikat'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.master-sertifikat') }}">Pengaturan Sistem</a></li>
            @endif
          </ul>
        </li>
        @endif

        @if(Auth::user()->hasPermission('admin.absensi.rekap') || Auth::user()->hasPermission('admin.absensi.settings'))
        <li class="pc-item pc-hasmenu">
          <a href="#!" class="pc-link">
            <span class="pc-micon"><i data-feather="clock"></i></span>
            <span class="pc-mtext">ABSENSI</span>
            <span class="pc-arrow"><i data-feather="chevron-down"></i></span>
          </a>
          <ul class="pc-submenu">
            @if(Auth::user()->hasPermission('admin.absensi.rekap'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.absensi.rekap') }}">Rekap Absensi</a></li>
            @endif
            @if(Auth::user()->hasPermission('admin.absensi.settings'))
            <li class="pc-item"><a class="pc-link" href="{{ route('admin.absensi.settings') }}">Pengaturan Absensi</a></li>
            @endif
          </ul>
        </li>
        @endif
      </ul>
    </div>
  </div>
</nav>
