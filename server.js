require('dotenv').config();
const express = require('express');
const path    = require('path');
const app     = express();
const cors    = require('cors');

// Izinkan semua asal frontend untuk mengakses API
app.use(cors({ origin: '*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Routes
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/share-lokasi', require('./routes/share-lokasi.routes'));
app.use('/api/lembur',       require('./routes/lembur.routes'));
app.use('/api/standby',      require('./routes/standby.routes'));
app.use('/api/admin',        require('./routes/admin.routes'));
app.use('/api/master',       require('./routes/master.routes'));

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', app: 'tunjangan-app-backend' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ Server jalan di port ${PORT}`);
  console.log(`🌐 Admin dashboard: http://localhost:${PORT}/admin`);

  require('./services/whatsapp.service');

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL !== 'isi_nanti') {
    const { syncRumahSakit, jadwalkanAutoSync } = require('./services/google-sheets.service');
    await syncRumahSakit();
    jadwalkanAutoSync();
  } else {
    console.log('⚠️  Google Sheets belum dikonfigurasi, skip sync.');
  }

  // Start cache cleanup service
  const { scheduleCleanup } = require('./services/cache-cleanup.service');
  scheduleCleanup();
});