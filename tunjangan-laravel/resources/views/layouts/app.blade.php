<!doctype html>
<html lang="en" data-pc-preset="preset-1" data-pc-sidebar-caption="true" data-pc-direction="ltr" dir="ltr" data-pc-theme="light" data-pc-layout="horizontal">
  <head>
    <script>
      (function() {
        const applyTheme = (theme) => {
          if (!theme) return;
          document.documentElement.setAttribute('data-pc-theme', theme);
          // Paksa Sidebar & Header ikut gelap kalau theme-nya dark
          if (theme === 'dark') {
            document.documentElement.setAttribute('data-pc-sidebar-theme', 'dark');
            document.documentElement.setAttribute('data-pc-header-theme', 'dark');
          } else {
            document.documentElement.setAttribute('data-pc-sidebar-theme', 'light');
            document.documentElement.setAttribute('data-pc-header-theme', 'light');
          }
        };

        const savedTheme = localStorage.getItem('pc-theme') || 'light';
        applyTheme(savedTheme);

        // Jaga-jaga kalau ada script lain yang nimpah (Cek 5x dalam 2 detik pertama)
        let checks = 0;
        const interval = setInterval(() => {
          applyTheme(localStorage.getItem('pc-theme') || 'light');
          if (checks++ > 10) clearInterval(interval);
        }, 200);
      })();
    </script>
    <title>@yield('title', 'Calibration Dashboard') | Datta Able</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimal-ui" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    
    <link rel="icon" href="{{ asset('assets/images/favicon.svg') }}" type="image/x-icon" />

    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="{{ asset('assets/fonts/phosphor/duotone/style.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/fonts/tabler-icons.min.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/fonts/feather.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/fonts/fontawesome.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/fonts/material.css') }}" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}" id="main-style-link" />
    <style>
      /* Global Dark Mode Fixes (Premium & Sleek) */
      :root[data-pc-theme="dark"],
      html[data-pc-theme="dark"], 
      html[data-pc-theme="dark"] body, 
      [data-pc-theme="dark"] body,
      body[data-pc-theme="dark"] { 
          background-color: #0f1114 !important; 
          background: #0f1114 !important;
          color: #a1aab5 !important; 
      }
      html[data-pc-theme="dark"] body,
      [data-pc-theme="dark"] body {
          min-height: 100%;
          min-width: 100%;
      }
      html[data-pc-theme="dark"] .pc-container, 
      html[data-pc-theme="dark"] .pc-content, 
      html[data-pc-theme="dark"] .pc-footer,
      [data-pc-theme="dark"] body.layout-horizontal .pc-container,
      [data-pc-theme="dark"] body.layout-horizontal .pc-content,
      [data-pc-theme="dark"] .page-header,
      [data-pc-theme="dark"] .page-block { 
          background-color: #0f1114 !important; 
          background: #0f1114 !important;
      }
      
      body.layout-horizontal {
          min-height: 100vh;
          width: 100%;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden;
      }
      
      /* FORCE DARK MODE ON HORIZONTAL LAYOUT */
      html[data-pc-theme="dark"] body.layout-horizontal,
      body.layout-horizontal[data-pc-theme="dark"],
      [data-pc-theme="dark"] body.layout-horizontal {
          background-color: #0f1114 !important;
          background: #0f1114 !important;
      }
      [data-pc-theme="dark"] h1, [data-pc-theme="dark"] h2, [data-pc-theme="dark"] h3, [data-pc-theme="dark"] h4, [data-pc-theme="dark"] h5, [data-pc-theme="dark"] h6 { color: #f8f9fa !important; }
      [data-pc-theme="dark"] .text-muted { color: #6c757d !important; }
      [data-pc-theme="dark"] .card { background-color: #1a1d21 !important; border: 1px solid rgba(255,255,255,0.04) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important; color: #ced4da !important; }
      [data-pc-theme="dark"] .card-header { border-bottom: 1px solid rgba(255,255,255,0.04) !important; background-color: transparent !important; }
      [data-pc-theme="dark"] .form-control, [data-pc-theme="dark"] .form-select { 
        background-color: rgba(255,255,255,0.03) !important; 
        border-color: rgba(255,255,255,0.08) !important; 
        color: #e9ecef !important; 
      }
      [data-pc-theme="dark"] .form-control:focus { background-color: rgba(255,255,255,0.06) !important; border-color: #4680ff !important; box-shadow: 0 0 0 0.2rem rgba(70, 128, 255, 0.25) !important; }
      [data-pc-theme="dark"] .table { color: #a1aab5 !important; background-color: transparent !important; margin-bottom: 0 !important; }
      [data-pc-theme="dark"] .table td, [data-pc-theme="dark"] .table th, [data-pc-theme="dark"] .table thead th { border-bottom: 1px solid rgba(255,255,255,0.04) !important; background-color: transparent !important; color: #a1aab5 !important; }
      [data-pc-theme="dark"] .table tbody tr:hover td { background-color: rgba(255,255,255,0.02) !important; }
      [data-pc-theme="dark"] .bg-light { background-color: rgba(255,255,255,0.02) !important; }
      [data-pc-theme="dark"] .modal-content { background-color: #1a1d21 !important; color: #ced4da !important; border: 1px solid rgba(255,255,255,0.08) !important; }
      [data-pc-theme="dark"] .modal-header, [data-pc-theme="dark"] .modal-footer { border-color: rgba(255,255,255,0.04) !important; }
      [data-pc-theme="dark"] .page-header-title h5, [data-pc-theme="dark"] .breadcrumb-item, [data-pc-theme="dark"] .breadcrumb-item a { color: #e9ecef !important; }
      
      /* Sleek Red & Yellow Cards for Dark Mode */
      [data-pc-theme="dark"] .bg-danger-500, [data-pc-theme="dark"] .card-header.bg-danger-500 { background-color: rgba(220, 53, 69, 0.1) !important; color: #ea868f !important; }
      [data-pc-theme="dark"] .card-header.bg-danger-500 h5, [data-pc-theme="dark"] .card-header.bg-danger-500 .text-white { color: #ea868f !important; }
      [data-pc-theme="dark"] .badge.bg-danger-500 { background-color: rgba(220, 53, 69, 0.2) !important; color: #ea868f !important; border: 1px solid rgba(220, 53, 69, 0.3) !important; }
      
      [data-pc-theme="dark"] .bg-warning-500, [data-pc-theme="dark"] .card-header.bg-warning-500 { background-color: rgba(255, 193, 7, 0.08) !important; color: #ffda6a !important; }
      [data-pc-theme="dark"] .card-header.bg-warning-500 h5, [data-pc-theme="dark"] .card-header.bg-warning-500 .text-white { color: #ffda6a !important; }
      [data-pc-theme="dark"] .badge.bg-warning-500 { background-color: rgba(255, 193, 7, 0.15) !important; color: #ffda6a !important; border: 1px solid rgba(255, 193, 7, 0.3) !important; }
      
      /* --- DYNAMIC LAYOUT ENGINE (SLEEK MINIMALIST REFINEMENT) --- */
      body.layout-horizontal .pc-sidebar { 
        top: 74px !important; 
        left: 0 !important; 
        width: 100% !important; 
        height: 52px !important; 
        position: fixed !important;
        border-right: none !important;
        border-bottom: 1px solid rgba(255,255,255,0.04) !important;
        /* TRANSISI FADE WARNA: DARI ATAS (#131920) KE NAVY (#3f4d67) */
        background: linear-gradient(to bottom, #131920 0%, #253041 40%, #3f4d67 100%) !important; 
        display: flex !important;
        justify-content: center !important;
        z-index: 2000 !important;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
        overflow: visible !important;
      }
      body.layout-horizontal .navbar-wrapper,
      body.layout-horizontal .navbar-content { 
          width: 100% !important; 
          max-width: 1320px !important; 
          margin: 0 auto !important; 
          padding: 0 !important; 
          display: flex; 
          align-items: center; 
          height: 100%; 
          overflow: visible !important;
      }
      
      body.layout-horizontal .pc-sidebar .m-header, 
      body.layout-horizontal .pc-sidebar .pc-caption,
      body.layout-horizontal .pc-sidebar .border-b,
      body.layout-horizontal .pc-sidebar .sidebar-wa-status { display: none !important; }
      
      body.layout-horizontal .pc-navbar { 
        flex-direction: row !important; 
        display: flex !important; 
        gap: 40px; /* Diperlebar agar sejajar ke kanan */
        padding: 0 25px !important;
        list-style: none;
        margin: 0;
        height: 100%;
        align-items: center;
      }
      body.layout-horizontal .pc-navbar > .pc-item { 
        margin: 0 !important; 
        width: auto !important; 
        display: flex !important;
        align-items: center;
        height: 100%;
        position: relative;
      }
      body.layout-horizontal .pc-navbar .pc-link { 
        padding: 0 5px !important; 
        height: 100% !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px;
        white-space: nowrap !important;
        color: rgba(255,255,255,0.6) !important;
        font-weight: 600;
        font-size: 11px;
        letter-spacing: 0.8px;
        transition: all 0.15s ease;
        text-decoration: none !important;
      }
      body.layout-horizontal .pc-navbar > .pc-item:hover > .pc-link { 
        color: #fff !important; 
      }
      
      /* DROPDOWN LOGIC (HORIZONTAL) */
      body.layout-horizontal .pc-submenu {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          min-width: 220px !important;
          background: #1a1d21 !important; /* Warna Navy Dropdown */
          box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 0 0 8px 8px !important;
          padding: 8px 0 !important;
          display: none !important;
          z-index: 1050;
      }
      body.layout-horizontal .pc-item:hover > .pc-submenu {
          display: block !important;
          animation: pc-fadeIn 0.2s ease;
      }
      @keyframes pc-fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
      }
      body.layout-horizontal .pc-submenu .pc-item { width: 100% !important; display: block !important; }
      body.layout-horizontal .pc-submenu .pc-link {
          padding: 10px 20px !important;
          width: 100% !important;
          height: auto !important;
          display: block !important;
          color: rgba(255,255,255,0.7) !important;
          font-weight: 400 !important;
          font-size: 13px !important;
          letter-spacing: 0;
      }
      body.layout-horizontal .pc-submenu .pc-link:hover {
          background: rgba(70, 128, 255, 0.1) !important;
          color: #4680ff !important;
      }
      body.layout-horizontal .pc-arrow { font-size: 10px; opacity: 0.5; }

      body.layout-horizontal .pc-navbar .pc-micon { 
        margin: 0 !important; 
        display: flex !important;
        align-items: center;
        width: 14px !important; 
        height: 14px !important; 
        opacity: 0.8;
      }
      body.layout-horizontal .pc-navbar .pc-micon i { width: 14px; height: 14px; }

      /* Logo Panel - Unified with Top Header */
      header .header-logo-horizontal { 
          display: none !important; 
      }
      body.layout-horizontal header .header-logo-horizontal { 
          display: flex !important;
          background: transparent !important; 
          height: 74px !important;
          padding: 0 25px;
          margin-left: 0 !important;
          border: none !important;
          align-items: center;
          position: absolute;
          left: 0;
          top: 0;
          z-index: 5;
      }
      body.layout-horizontal header .header-logo-horizontal img { height: 50px !important; width: auto !important; border-radius: 8px !important; }
      body.layout-horizontal header .header-logo-horizontal span { color: #fff !important; font-weight: 700; letter-spacing: 0.5px; margin-left: 16px; font-size: 18px !important; }

      /* --- UNIFIED TOP PANEL (ONE COLOR) --- */
      body.layout-horizontal .pc-header { 
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        background: #131920 !important; /* SATU WARNA SOLID UNTUK SELURUH PANEL ATAS */
        box-shadow: none !important;
        border: none !important;
        display: flex;
        justify-content: center;
        height: 74px !important;
        z-index: 3000 !important; /* OVERRIDE Z-INDEX AGAR PROFILE DROPDOWN TIDAK KETUTUP MENU */
      }
      body.layout-horizontal .header-wrapper {
          max-width: 1320px !important;
          width: 100% !important;
          margin: 0 auto !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          position: relative;
      }
      body.layout-horizontal .pc-navbar { 
        padding: 0 !important;
        width: 100%;
        display: flex !important;
        height: 100% !important;
        align-items: center !important;
        justify-content: center !important; /* POSISI RATA TENGAH (CENTER) */
        gap: 40px !important; /* JARAK PROPORSIONAL ANTAR MENU */
        margin: 0 !important;
        list-style: none;
      }
      body.layout-horizontal .pc-navbar > .pc-item { height: 100% !important; display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; }
      body.layout-horizontal .pc-navbar .pc-link { 
          color: rgba(255,255,255,0.85) !important; 
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none !important;
          margin: 0 !important;
      }
      body.layout-horizontal .pc-navbar .pc-micon { margin-right: 8px !important; display: flex !important; align-items: center !important; height: 100% !important; margin-left: 0 !important; }
      body.layout-horizontal .pc-micon + .pc-mtext { height: 100% !important; display: flex !important; align-items: center !important; }
      body.layout-horizontal .pc-navbar .pc-arrow { margin-left: 5px !important; display: flex !important; align-items: center !important; height: 100% !important; }

      body.layout-horizontal .pc-navbar > .pc-item:hover > .pc-link { color: #fff !important; }

      /* DROPDOWN DISPLAY FIX (HI-LAYER) */
      body.layout-horizontal .pc-item.pc-hasmenu { position: relative; }
      body.layout-horizontal .pc-submenu {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          min-width: 220px !important;
          background: #3f4d67 !important; 
          border: 1px solid rgba(255,255,255,0.1) !important;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4) !important;
          border-radius: 0 0 8px 8px !important;
          display: none !important;
          z-index: 3000 !important; /* LAPISAN PALING DEPAN */
          padding: 8px 0 !important;
          list-style: none;
      }
      body.layout-horizontal .pc-item:hover > .pc-submenu { display: block !important; }
      body.layout-horizontal .pc-submenu .pc-item { width: 100% !important; display: block !important; height: auto !important; }
      body.layout-horizontal .pc-submenu .pc-link { padding: 10px 20px !important; height: auto !important; width: 100% !important; }

      body.layout-horizontal .pc-container { margin-left: 0 !important; padding-top: 126px !important; background: #f4f7fa !important; display: flex; justify-content: center; width: 100%; }
      body.layout-horizontal .pc-content { 
          max-width: 1320px !important; 
          width: 100% !important; 
          margin: 0 auto !important; 
          padding: 25px 0 !important;
      }

      /* --- DASHBOARD 1 (VERTICAL) FADE BACKGROUND --- */
      body:not(.layout-horizontal) .pc-sidebar {
          /* FADE NAVY PRESISI SPT HORIZONTAL */
          background: linear-gradient(to bottom, #131920 0%, #253041 25%, #3f4d67 100%) !important;
      }
      body:not(.layout-horizontal) .pc-sidebar .m-header {
          background: transparent !important; /* BIAR MENUYATU DEGAN FADE LAYER */
      }

      /* --- HYBRID MENU VISIBILITY --- */
      .nav-horizontal { display: none !important; }
      .nav-vertical { display: block !important; }
      body.layout-horizontal .nav-vertical { display: none !important; }
      body.layout-horizontal .nav-horizontal { display: flex !important; }

      /* HIDE UNNECESSARY V-SIDEBAR ELEMENTS IN HORIZONTAL MODE */
      body.layout-horizontal .pc-sidebar .m-header,
      body.layout-horizontal .pc-sidebar .sidebar-wa-status { display: none !important; }
      body.layout-horizontal #sidebar-hide-container,
      body.layout-horizontal #mobile-collapse { display: none !important; }

      /* SIMPLEBAR OVERFLOW KILLER (ALLOW SCROLL MENU TO DROP DOWN) */
      body.layout-horizontal .navbar-content .simplebar-wrapper,
      body.layout-horizontal .navbar-content .simplebar-mask,
      body.layout-horizontal .navbar-content .simplebar-offset,
      body.layout-horizontal .navbar-content .simplebar-content-wrapper,
      body.layout-horizontal .navbar-content .simplebar-content {
          overflow: visible !important;
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: center !important;
      }

      /* REMOVE VERTICAL ACTIVE INDICATOR (BLUE LINE & BG) FROM HORIZONTAL BAR */
      body.layout-horizontal .pc-navbar > .pc-item::after,
      body.layout-horizontal .pc-navbar > .pc-item::before,
      body.layout-horizontal .pc-navbar > .pc-item > .pc-link::after,
      body.layout-horizontal .pc-navbar > .pc-item > .pc-link::before {
          display: none !important;
      }
      body.layout-horizontal .pc-navbar > .pc-item { background: transparent !important; }
      body.layout-horizontal .pc-navbar > .pc-item > .pc-link { background: transparent !important; }

      body, .card, .form-control, .pc-sidebar, .pc-header { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important; }
    </style>
    @stack('styles')
    <script>
      (function() {
        // Init Layout Choice
        const savedLayout = localStorage.getItem('pc-layout') || 'vertical';
        if (savedLayout === 'horizontal') {
            document.documentElement.setAttribute('data-pc-layout', 'horizontal');
            document.addEventListener('DOMContentLoaded', () => document.body.classList.add('layout-horizontal'));
        }
      })();
      
      function toggleLayout() {
          const isHorizontal = document.body.classList.contains('layout-horizontal');
          if (isHorizontal) {
              document.body.classList.remove('layout-horizontal');
              document.documentElement.setAttribute('data-pc-layout', 'vertical');
              localStorage.setItem('pc-layout', 'vertical');
          } else {
              document.body.classList.add('layout-horizontal');
              document.documentElement.setAttribute('data-pc-layout', 'horizontal');
              localStorage.setItem('pc-layout', 'horizontal');
          }
      }
    </script>
  </head>

  <body>
    <div class="loader-bg fixed inset-0 bg-white dark:bg-themedark-cardbg z-[1034]">
      <div class="loader-track h-[5px] w-full inline-block absolute overflow-hidden top-0">
        <div class="loader-fill w-[300px] h-[5px] bg-primary-500 absolute top-0 left-0 animate-[hitZak_0.6s_ease-in-out_infinite_alternate]"></div>
      </div>
    </div>

    @include('partials.sidebar')
    @include('partials.header')

    <div class="pc-container">
      <div class="pc-content">
        @yield('content')
      </div>
    </div>

    <footer class="pc-footer">
      <div class="footer-wrapper container-fluid">
        <div class="row align-items-center">
          <div class="col-sm-6 my-1">
            <p class="m-0 text-muted" style="font-size: 13px;">© {{ date('Y') }} Calibration Dashboard. Powered by <span class="text-primary fw-bold" style="letter-spacing: 0.5px;">Roy Leonardo Decaf Rio</span></p>
          </div>
        </div>
      </div>
    </footer>

    @stack('modals')
    <script src="https://code.jquery.com/jquery-3.6.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="{{ asset('assets/js/plugins/simplebar.min.js') }}"></script>
    <script src="{{ asset('assets/js/plugins/popper.min.js') }}"></script>
    <script src="{{ asset('assets/js/icon/custom-icon.js') }}"></script>
    <script src="{{ asset('assets/js/plugins/feather.min.js') }}"></script>
    <script src="{{ asset('assets/js/component.js') }}"></script>
    <script src="{{ asset('assets/js/theme.js') }}"></script>
    <script src="{{ asset('assets/js/script.js') }}"></script>
    <script>
      // SINKRONISASI TEMA KE LOCALSTORAGE (AMBIL JALUR AMAN)
      function syncThemeToAll(theme) {
          if (!theme) return;
          const current = document.documentElement.getAttribute('data-pc-theme');
          if (current !== theme) {
            document.documentElement.setAttribute('data-pc-theme', theme);
          }
          
          if (theme === 'dark') {
              document.documentElement.setAttribute('data-pc-sidebar-theme', 'dark');
              document.documentElement.setAttribute('data-pc-header-theme', 'dark');
              // BRUTE-FORCE BODY BACKGROUND (ZERO TOLERANCE FOR WHITE GAPS)
              document.documentElement.style.setProperty('background-color', '#0f1114', 'important');
              document.body.style.setProperty('background-color', '#0f1114', 'important');
          } else {
              document.documentElement.setAttribute('data-pc-sidebar-theme', 'light');
              document.documentElement.setAttribute('data-pc-header-theme', 'light');
              // REVERT TO LIGHT MODE BACKGROUND
              document.documentElement.style.setProperty('background-color', '#f4f7fa', 'important');
              document.body.style.setProperty('background-color', '#f4f7fa', 'important');
          }
          localStorage.setItem('pc-theme', theme);
      }

      window.addEventListener('DOMContentLoaded', function() {
          // Bajak fungsi ganti tema bawaan
          if (typeof layout_change === 'function') {
              const old_layout_change = layout_change;
              window.layout_change = function(v) {
                  syncThemeToAll(v);
                  if (typeof old_layout_change === 'function') old_layout_change(v);
              };
          }

          // SUPER ADMIN Failsafe: Paksa Background Hitam Sepenuhnya agar border putih hancur!
          const enforceDarkBackground = () => {
              if (document.documentElement.getAttribute('data-pc-theme') === 'dark') {
                  document.documentElement.style.setProperty('background-color', '#0f1114', 'important');
                  document.documentElement.style.setProperty('background', '#0f1114', 'important');
                  document.body.style.setProperty('background-color', '#0f1114', 'important');
                  document.body.style.setProperty('background', '#0f1114', 'important');
              }
          };
          enforceDarkBackground();
          // Pertahankan dari override layout bawaan JS
          setInterval(enforceDarkBackground, 500);

          // Pastikan loader hilang
          setTimeout(() => {
              const loader = document.querySelector('.loader-bg');
              if (loader) loader.style.display = 'none';
          }, 400);
      });
    </script>
    <script>
        // Global WA Bot Monitor
        function checkWaServer() {
            const BOT_URL = "http://" + window.location.hostname + ":3001";
            const indicators = [
                document.getElementById('global-wa-status'),
                document.getElementById('global-wa-status-sidebar')
            ];

            fetch(BOT_URL + '/api/wa/ping')
                .then(res => res.json())
                .then(data => {
                    if(data.pong) {
                        indicators.forEach(indicator => {
                            if(!indicator) return;
                            indicator.innerHTML = `
                                <span class="relative flex h-2 w-2">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                </span>
                                <span class="text-success text-[10px] font-bold">ONLINE</span>`;
                        });
                    }
                })
                .catch(() => {
                    indicators.forEach(indicator => {
                        if(!indicator) return;
                        indicator.innerHTML = `
                            <span class="relative flex h-2 w-2">
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                            </span>
                            <span class="text-danger text-[10px] font-bold">OFFLINE</span>`;
                    });
                });
        }
        setInterval(checkWaServer, 5000);
        checkWaServer();
    </script>
    @stack('scripts')
  </body>
</html>
