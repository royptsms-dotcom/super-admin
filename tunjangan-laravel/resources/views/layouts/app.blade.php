<!doctype html>
<html lang="en" data-pc-preset="preset-1" data-pc-sidebar-caption="true" data-pc-direction="ltr" dir="ltr" data-pc-theme="light">
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
      /* Global Dark Mode Fixes */
      [data-pc-theme="dark"] body { background-color: #111111; }
      [data-pc-theme="dark"] .pc-container { background-color: #111111; }
      [data-pc-theme="dark"] .card { background-color: #1a1a1a !important; border-color: rgba(255,255,255,0.05) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important; }
      [data-pc-theme="dark"] .form-control, [data-pc-theme="dark"] .form-select { 
        background-color: rgba(255,255,255,0.05) !important; 
        border-color: rgba(255,255,255,0.1) !important; 
        color: #fff !important; 
      }
      [data-pc-theme="dark"] .form-control:focus { background-color: rgba(255,255,255,0.08) !important; border-color: #4680ff !important; }
      [data-pc-theme="dark"] .table { color: #ced4da !important; }
      [data-pc-theme="dark"] .table td, [data-pc-theme="dark"] .table th { border-color: rgba(255,255,255,0.05) !important; }
      [data-pc-theme="dark"] .bg-light { background-color: rgba(255,255,255,0.02) !important; }
      [data-pc-theme="dark"] .modal-content { background-color: #1e1e1e !important; color: #fff !important; }
      [data-pc-theme="dark"] .modal-header, [data-pc-theme="dark"] .modal-footer { border-color: rgba(255,255,255,0.1) !important; }
      
      /* Smooth Transitions */
      body, .card, .form-control, .pc-sidebar, .pc-header { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important; }
    </style>
    @stack('styles')

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
          } else {
              document.documentElement.setAttribute('data-pc-sidebar-theme', 'light');
              document.documentElement.setAttribute('data-pc-header-theme', 'light');
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

          // Pastikan loader hilang
          setTimeout(() => {
              const loader = document.querySelector('.loader-bg');
              if (loader) loader.style.display = 'none';
          }, 400);
      });
    </script>
    @stack('scripts')
  </body>
</html>
