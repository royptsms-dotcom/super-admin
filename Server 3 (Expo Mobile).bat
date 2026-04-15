@echo off
title Server 3 - Expo Go Mobile
cd /d D:\Android\e-sms
echo Menjalankan Expo Go (Aplikasi HP) di port 8085...
set EXPO_LAN_ADDRESS=10.197.114.154
npx expo start --host lan --port 8085
pause
