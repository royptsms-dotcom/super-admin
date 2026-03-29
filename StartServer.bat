@echo off
title Tunjangan App - Server Launcher
color 0A

echo ============================================
echo   TUNJANGAN APP - SERVER LAUNCHER
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
wsl -e bash -c "echo \"export default { API_URL: 'http://%WIN_IP%:3000' }\" > /mnt/d/Android/tunjangan-app-win/constants/config.js"
echo     API_URL diupdate ke: http://%WIN_IP%:3000
echo.

:: ── 4. Set port forwarding + firewall ────────
echo [4/5] Setting port forwarding dan firewall...
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=%WSL_IP%
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=%WSL_IP%
netsh interface portproxy delete v4tov4 listenport=8081 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=%WSL_IP%
netsh advfirewall firewall delete rule name="Tunjangan Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Tunjangan Port 3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall delete rule name="Tunjangan Port 8080" >nul 2>&1
netsh advfirewall firewall add rule name="Tunjangan Port 8080" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
netsh advfirewall firewall delete rule name="Tunjangan Port 8081" >nul 2>&1
netsh advfirewall firewall add rule name="Tunjangan Port 8081" dir=in action=allow protocol=TCP localport=8081 >nul 2>&1
echo     Port forwarding dan firewall aktif
echo.

:: ── 5. Tulis script bash ke file temp ────────
echo [5/5] Menjalankan server...

wsl -e bash -c "cat > /tmp/run-backend.sh << 'BASHEOF'" 2>nul
wsl -e bash -c "echo 'pkill -f \"node server.js\" 2>/dev/null' > /tmp/run-backend.sh"
wsl -e bash -c "echo 'fuser -k 3000/tcp 2>/dev/null' >> /tmp/run-backend.sh"
wsl -e bash -c "echo 'pkill -f chromium 2>/dev/null' >> /tmp/run-backend.sh"
wsl -e bash -c "echo 'pkill -f chrome 2>/dev/null' >> /tmp/run-backend.sh"
wsl -e bash -c "echo 'sleep 1' >> /tmp/run-backend.sh"
wsl -e bash -c "echo 'cd /mnt/d/Android && HOST=0.0.0.0 node server.js' >> /tmp/run-backend.sh"
wsl -e bash -c "chmod +x /tmp/run-backend.sh"

wsl -e bash -c "echo 'pkill -f \"expo start\" 2>/dev/null' > /tmp/run-expo.sh"
wsl -e bash -c "echo 'fuser -k 8080/tcp 2>/dev/null' >> /tmp/run-expo.sh"
wsl -e bash -c "echo 'sleep 2' >> /tmp/run-expo.sh"
wsl -e bash -c "echo 'sleep 1' >> /tmp/run-expo.sh"
wsl -e bash -c "echo 'cd /mnt/d/Android/tunjangan-app-win && EXPO_NO_INSPECTOR=1 REACT_NATIVE_PACKAGER_HOSTNAME=%WIN_IP% npx expo start --port 8080' >> /tmp/run-expo.sh"
wsl -e bash -c "chmod +x /tmp/run-expo.sh"

start "Tunjangan Backend" wsl bash /tmp/run-backend.sh
timeout /t 3 /nobreak >nul
start "Tunjangan Expo" wsl bash /tmp/run-expo.sh

:: ── Info ──────────────────────────────────────
timeout /t 5 /nobreak >nul
echo ============================================
echo   SERVER SIAP!
echo ============================================
echo.
echo   Admin Dashboard : http://%WIN_IP%:3000/admin
echo   API Server      : http://%WIN_IP%:3000
echo   Expo Metro      : exp://%WIN_IP%:8080
echo.
echo   Pastikan HP terhubung WiFi yang sama!
echo ============================================
echo.
pause