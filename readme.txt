cmd windows:

D:\Android\cd tunjangan-app-win
npx expo start

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

cmd administrator:

netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.19.52.172

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

terminal:

cd /mnt/d/Android && HOST=0.0.0.0 node server.js
```

Cek di terminal — harusnya muncul:
```
✅ Server jalan di port 3000
🌐 Admin dashboard: http://localhost:3000/admin