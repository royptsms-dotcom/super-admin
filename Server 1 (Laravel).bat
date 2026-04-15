@echo off
title Server 1 - Laravel Backend
cd /d D:\Android\tunjangan-laravel
echo Menjalankan Laravel di port 8000...
php artisan serve --host=0.0.0.0 --port=8000
pause
