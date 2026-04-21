<header class="pc-header">
  <div class="header-wrapper flex max-sm:px-[15px] px-[25px] grow">
    <div class="me-auto px-0 flex items-center">
      <!-- Horizontal Logo (Only visible in Horizontal Mode) -->
      <a href="{{ route('dashboard') }}" class="header-logo-horizontal b-brand flex items-center gap-2 me-4">
        <img src="{{ asset('assets/images/icon.png?v=1.4') }}" class="img-fluid logo" style="height: 40px; width: auto; border-radius: 6px;" alt="logo" />
        <span class="text-white font-bold ml-1" style="font-size: 14px;">Sarana Megamedilab Sentosa</span>
      </a>

      <ul class="inline-flex *:min-h-header-height *:inline-flex *:items-center">
        <li class="pc-h-item pc-sidebar-collapse max-lg:hidden lg:inline-flex" id="sidebar-hide-container">
          <a href="#" class="pc-head-link ltr:!ml-0 rtl:!mr-0" id="sidebar-hide">
            <i data-feather="menu"></i>
          </a>
        </li>
        <li class="pc-h-item pc-sidebar-popup lg:hidden">
          <a href="#" class="pc-head-link ltr:!ml-0 rtl:!mr-0" id="mobile-collapse">
            <i data-feather="menu"></i>
          </a>
        </li>
      </ul>
    </div>
    <div class="ms-auto flex items-center">
      <!-- Status WA Global -->
      <div id="global-wa-status" class="flex items-center gap-2 me-4 px-3 py-1 bg-black/10 rounded-full border border-white/5">
          <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
          </span>
          <span class="text-white/70 text-[10px] font-bold">WA: CHECKING...</span>
      </div>

      <ul class="inline-flex *:min-h-header-height *:inline-flex *:items-center">
        <!-- New Layout Switcher Button -->
        <li class="pc-h-item">
          <a class="pc-head-link me-0 cursor-pointer" onclick="toggleLayout()" title="Switch Layout (Vertical/Horizontal)">
            <i data-feather="layout"></i>
          </a>
        </li>

        <!-- Notifikasi -->
        @include('partials.app-notifications')

        <!-- Mode Gelap Terang -->
        <li class="dropdown pc-h-item">
          <a class="pc-head-link dropdown-toggle me-0" data-pc-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
            <i data-feather="sun"></i>
          </a>
          <div class="dropdown-menu dropdown-menu-end pc-h-dropdown">
            <a href="#!" class="dropdown-item" onclick="layout_change('dark')">
              <i data-feather="moon"></i>
              <span>Dark Mode</span>
            </a>
            <a href="#!" class="dropdown-item" onclick="layout_change('light')">
              <i data-feather="sun"></i>
              <span>Light Mode</span>
            </a>
            <a href="#!" class="dropdown-item" onclick="layout_change_default()">
              <i data-feather="monitor"></i>
              <span>System Default</span>
            </a>
          </div>
        </li>

        <!-- Profil & Logout -->
        <li class="dropdown pc-h-item header-user-profile">
          <a class="pc-head-link dropdown-toggle arrow-none me-0" data-pc-toggle="dropdown" href="#" role="button" aria-haspopup="false" data-pc-auto-close="outside" aria-expanded="false">
            <i data-feather="user"></i>
          </a>
          <div class="dropdown-menu dropdown-user-profile dropdown-menu-end pc-h-dropdown p-2 overflow-hidden shadow-2xl">
            <div class="dropdown-header flex items-center justify-between py-4 px-5 bg-primary-500 rounded-t-lg">
              <div class="flex mb-1 items-center">
                <div class="shrink-0">
                  <div class="w-10 h-10 rounded-full bg-white text-primary-500 flex items-center justify-center font-bold text-lg">
                    {{ substr(Auth::user()->name ?? 'A', 0, 1) }}
                  </div>
                </div>
                <div class="grow ms-3">
                  <h6 class="mb-1 text-white">{{ Auth::user()->name ?? 'Administrator' }}</h6>
                  <span class="text-white text-sm opacity-80">{{ Auth::user()->email ?? 'admin@gmail.com' }}</span>
                </div>
              </div>
            </div>
            <div class="dropdown-body py-4 px-5">
              <div class="profile-notification-scroll position-relative">
                <a href="#" class="dropdown-item">
                  <span>
                    <i data-feather="user" class="me-2 text-muted"></i>
                    <span>ID: {{ Auth::user()->employee_id ?? '-' }}</span>
                  </span>
                </a>
                <a href="#" class="dropdown-item">
                  <span>
                    <i data-feather="shield" class="me-2 text-muted"></i>
                    <span>Role: {{ strtoupper(Auth::user()->role ?? 'ADMIN') }}</span>
                  </span>
                </a>
                <hr class="my-3 border-gray-200" />
                <div class="grid my-3">
                  <form action="{{ route('logout') }}" method="POST" id="form-logout-top">
                    @csrf
                    <button type="submit" class="btn btn-primary flex items-center justify-center w-full">
                      <i data-feather="power" class="me-2"></i> Log Out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</header>
