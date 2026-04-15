@echo off
title Server 4 - IP Check & Status
echo.
echo === INFORMASI JARINGAN SAAT INI ===
ipconfig | findstr /R /C:"IPv4 Address"
echo.
echo ===================================
echo Pastikan IP di atas (IPv4) Sesuai dengan yang ada di Server 3.bat
echo Jika Berbeda, silakan edit Server 3.bat lalu ganti IP-nya.
echo.
echo Mencoba cek koneksi ke Bot WA...
curl http://localhost:3001/api/wa/ping
echo.
echo.
pause
