@echo off
cd /d "%~dp0"
title E-SMS - Server Launcher
color 0A

echo ============================================
echo   E-SMS - SERVER LAUNCHER (PERMANEN)
echo ============================================
echo.

:: ── 1. Ambil IP WSL terbaru ──────────────────
echo [1/5] Mengambil IP WSL terbaru...
for /f "tokens=*" %%i in ('wsl hostname -I') do set WSL_IP=%%i
for /f "tokens=1" %%a in ("%WSL_IP%") do set WSL_IP=%%a
echo     IP WSL: %WSL_IP%
echo.

:: ── 2. Ambil IP WiFi Windows ─────────────────
echo [2/5] Mengambil IP WiFi Windows...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "172\." ^| findstr /v "169\." ^| findstr /v "127\." ^| findstr /v "192\."') do (
    set WIN_IP=%%a
    goto :got_ip
)
:got_ip
set WIN_IP=%WIN_IP: =%
echo     IP Windows: %WIN_IP%
echo.

:: ── 3. Update config.js dengan IP terbaru ────
echo [3/5] Update API_URL di config.js...
wsl -e bash -c "echo \"export default { API_URL: 'http://%WIN_IP%:3000' }\" > /mnt/d/Android/e-sms/constants/config.js"
echo     API_URL diupdate ke: http://%WIN_IP%:3000
echo.

:: ── 4. Set port forwarding + firewall ────────
echo [4/5] Setting firewall...
netsh advfirewall firewall delete rule name="E-SMS Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="E-SMS Port 3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
echo     Firewall aktif di Port 3000
echo.

:: ── 5. Menjalankan Server & Ngrok ────────
echo [5/5] Menjalankan server & Ngrok...

:: Jalankan Ngrok di terminal terpisah
start "E-SMS Ngrok" "%~dp0ngrok.exe" http --domain=jakobe-synovial-gonzalo.ngrok-free.dev 3000

:: Jalankan Backend di terminal terpisah
wsl -e bash -c "echo '#!/bin/bash' > /tmp/run-backend.sh && echo 'pkill -f \"node server.js\" 2>/dev/null' >> /tmp/run-backend.sh && echo 'fuser -k 3000/tcp 2>/dev/null' >> /tmp/run-backend.sh && echo 'sleep 2' >> /tmp/run-backend.sh && echo 'cd /mnt/d/Android && HOST=0.0.0.0 node server.js' >> /tmp/run-backend.sh && chmod +x /tmp/run-backend.sh"
start "E-SMS Backend" wsl bash -c "bash /tmp/run-backend.sh; echo ''; echo 'Server berhenti. Tekan Enter untuk tutup.'; read"

timeout /t 3 /nobreak >nul

:: Jalankan Expo di terminal terpisah (Hanya untuk Testing/Development)
wsl -e bash -c "echo '#!/bin/bash' > /tmp/run-expo.sh && echo 'pkill -f \"expo start\" 2>/dev/null' >> /tmp/run-expo.sh && echo 'fuser -k 8080/tcp 2>/dev/null' >> /tmp/run-expo.sh && echo 'sleep 2' >> /tmp/run-expo.sh && echo 'cd /mnt/d/Android/e-sms && EXPO_NO_INSPECTOR=1 REACT_NATIVE_PACKAGER_HOSTNAME=%WIN_IP% npx expo start --port 8080' >> /tmp/run-expo.sh && chmod +x /tmp/run-expo.sh"
start "E-SMS Expo" wsl bash -c "bash /tmp/run-expo.sh; echo ''; echo 'Expo berhenti. Tekan Enter untuk tutup.'; read"

:: ── Info ──────────────────────────────────────
timeout /t 5 /nobreak >nul
echo ============================================
echo   SERVER PERMANEN SIAP!
echo ============================================
echo.
echo   Website Admin   : https://smsereport.pages.dev
echo   Backend Tunnel  : https://jakobe-synovial-gonzalo.ngrok-free.dev
echo   Status Ngrok    : Terminal Ngrok sedang berjalan
echo.
echo   Pastikan APK sudah diupdate menggunakan domain Ngrok!
echo ============================================
echo.
pause