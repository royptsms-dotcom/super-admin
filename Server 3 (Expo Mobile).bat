@echo off
title Server 3 - Expo Go Mobile
cd /d D:\Android\e-sms

echo [SISTEM] Mendeteksi IP Address jaringan saat ini...
:: Mengambil IP Address baris pertama yang ditemukan
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    set MY_IP=%%a
    goto :found_ip
)
:found_ip
:: Hapus spasi berlebih
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
