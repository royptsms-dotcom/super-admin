@echo off
echo ==============================================
echo WEBSITE UPDATER SAKTI E-SMS
echo ==============================================
echo Sedang mengirim perubahan ke sistem Cloudflare...
echo Mohon tunggu sebentar...
echo.

cd /d "%~dp0"
git add .
git commit -m "Update website assets & logo"
git push

echo.
echo ==============================================
echo SELESAI! Gambar dan Web Anda sedang diupdate.
echo Silakan tunggu 1 menit lalu refresh web Anda.
echo ==============================================
pause
