@echo off
title Server 3 - Expo Go Mobile
cd /d D:\Android\e-sms

echo [SISTEM] Mendeteksi IP Address jaringan saat ini...
:: Mengambil IP Address baris pertama yang ditemukan
set MY_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"Wireless LAN adapter Wi-Fi" /A:4 ^| findstr "IPv4"') do (
    set MY_IP=%%a
)
if not defined MY_IP (
    for /f "usebackq tokens=2 delims=:" %%a in (`ipconfig ^| findstr /R "IPv4.*" ^| findstr /V "172." ^| findstr /V "192.168.56."`) do (
        if not defined MY_IP set MY_IP=%%a
    )
)
:found_ip
set MY_IP=%MY_IP: =%

echo [SISTEM] Jaringan terdeteksi di: %MY_IP%

:: Inject URL API backend otomatis ke file konfigurasi Mobile (.env)
echo EXPO_PUBLIC_API_URL=http://%MY_IP%:8000/api> .env

echo [SISTEM] API Server Mobile dikunci pada: http://%MY_IP%:8000/api
echo.
echo Menjalankan Expo Go (Aplikasi HP) di port 8085...
set EXPO_LAN_ADDRESS=%MY_IP%
npx expo start --host lan --port 8085
pause
