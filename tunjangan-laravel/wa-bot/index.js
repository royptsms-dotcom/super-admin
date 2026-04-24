const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('baileys');
const P = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const { Jimp, loadFont } = require('jimp');
const fonts = require('@jimp/plugin-print/fonts');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const sessions = {};

async function startSession(sessionId, phoneNumber = null) {
    const authDir = `./sessions/${sessionId}`;
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();
    
    console.log(`[WA] Memulai sesi "${sessionId}" (Phone: ${phoneNumber || 'QR Mode'})`);

    const sock = makeWASocket({
        auth: state,
        version,
        logger: P({ level: 'silent' }),
        // PENTING: Untuk pairing code, browser harus Ubuntu/Chrome (bukan macOS) agar tidak ditolak WA
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
        printQRInTerminal: false,
        qrTimeout: 30000,
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    sessions[sessionId] = { 
        sock, 
        connected: false, 
        qr: null,
        pairingCode: null,
        lastSeen: Date.now()
    };

    // Jika ada nomor HP, minta pairing code ke WA Server
    if (phoneNumber && !state.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`[Pairing] Kode untuk ${sessionId} (${phoneNumber}): ${code}`);
                sessions[sessionId].pairingCode = code;
            } catch (err) {
                console.error(`[Pairing] Gagal minta kode untuk ${sessionId}:`, err.message);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) sessions[sessionId].qr = qr;

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            sessions[sessionId].connected = false;
            
            // Reconnect jika bukan karena logout manual
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log(`[WA] Sesi "${sessionId}" terputus (Status: ${statusCode}), menyambung kembali...`);
                setTimeout(() => startSession(sessionId), 5000);
            } else {
                console.log(`[WA] Sesi "${sessionId}" Logged Out. Menghapus folder data.`);
                delete sessions[sessionId];
                if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            sessions[sessionId].connected = true;
            sessions[sessionId].qr = null;
            sessions[sessionId].pairingCode = null;
            console.log(`[WA] Sesi "${sessionId}" BERHASIL TERHUBUNG!`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Endpoint untuk mendapatkan Pairing Code (Opsi 1)
app.get('/api/wa/pair-code/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { phone } = req.query; // format 62812xxx

    if (!phone) return res.status(400).json({ error: 'Nomor HP wajib ada' });

    // Bersihkan sesi lama jika ada
    const authDir = `./sessions/${sessionId}`;
    if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
    delete sessions[sessionId];

    await startSession(sessionId, phone);
    
    // Tunggu kode digenerate
    let retry = 0;
    const checkCode = setInterval(() => {
        const s = sessions[sessionId];
        if (s?.pairingCode) {
            clearInterval(checkCode);
            return res.json({ status: 'waiting', code: s.pairingCode });
        }
        if (retry > 10) {
            clearInterval(checkCode);
            return res.status(500).json({ error: 'Gagal mendapatkan kode pairing dari WA' });
        }
        retry++;
    }, 1000);
});

async function addWatermark(imagePathOrUrl, data) {
    console.log('[Watermark] Memulai proses watermark untuk:', imagePathOrUrl);
    try {
        const sharp = require('sharp');
        let imageBuffer;

        if (imagePathOrUrl.startsWith('http')) {
            console.log('[Watermark] Mengunduh gambar via HTTP...');
            const response = await axios.get(imagePathOrUrl, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data);
        } else {
            console.log('[Watermark] Membaca gambar dari local disk...');
            if (!fs.existsSync(imagePathOrUrl)) {
                throw new Error("File gambar lokal tidak ditemukan: " + imagePathOrUrl);
            }
            imageBuffer = fs.readFileSync(imagePathOrUrl);
        }
        
        console.log('[Watermark] Meresize gambar dengan Sharp (untuk mencegah blocking event loop)...');
        // Resize dengan sharp sangat cepat (C++) dan tidak mem-block event loop seperti Jimp
        const resizedBuffer = await sharp(imageBuffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .toBuffer();

        console.log('[Watermark] Memuat gambar ke Jimp...');
        let image = await Jimp.read(resizedBuffer);
        console.log('[Watermark] Gambar berhasil dimuat oleh Jimp.');
        
        const width = image.bitmap.width;
        const height = image.bitmap.height;
 
        const margin = Math.floor(width * 0.03); 
        const padding = 20; 
        const boxWidth = width - (margin * 2);
        
        const isHighRes = width > 1000;
        console.log('[Watermark] Memuat font... (isHighRes:', isHighRes, ')');
        const fontLarge = await loadFont(isHighRes ? fonts.SANS_32_WHITE : fonts.SANS_16_WHITE);
        const fontSmall = await loadFont(isHighRes ? fonts.SANS_16_WHITE : fonts.SANS_8_WHITE);
        console.log('[Watermark] Font berhasil dimuat.');
        
        const lineSpacingLarge = isHighRes ? 45 : 25;
        const lineSpacingSmall = isHighRes ? 25 : 15;

        const boxHeight = padding * 2 + lineSpacingLarge + (lineSpacingSmall * 3);
        const boxY = height - boxHeight - margin;
        
        console.log('[Watermark] Membuat overlay...');
        const overlay = new Jimp({ width: boxWidth, height: boxHeight, color: 0x000000B3 }); 
        image.composite(overlay, margin, boxY);
 
        let textX = margin + padding;
        let textY = boxY + padding;
 
        image.print({ font: fontLarge, x: textX, y: textY, text: data.location || 'Lokasi', maxWidth: boxWidth - (padding * 2) });
        textY += lineSpacingLarge;

        image.print({ font: fontSmall, x: textX, y: textY, text: data.note || 'GPS Map Camera', maxWidth: boxWidth - (padding * 2) });
        textY += lineSpacingSmall;

        image.print({ font: fontSmall, x: textX, y: textY, text: `Lat ${data.lat} Long ${data.lng}`, maxWidth: boxWidth - (padding * 2) });
        textY += lineSpacingSmall;

        image.print({ font: fontSmall, x: textX, y: textY, text: data.time, maxWidth: boxWidth - (padding * 2) });
  
        const outputPath = path.join(__dirname, 'temp_watermark_' + Date.now() + '.jpg');
        console.log('[Watermark] Menyimpan gambar ke:', outputPath);
        await image.write(outputPath);
        console.log('[Watermark] Selesai menyusun gambar!');
        return outputPath;
    } catch (err) {
        console.error('[Watermark Error]:', err.message);
        return null;
    }
}
 
// Endpoint kirim pesan (Multi-Session)
app.post('/api/wa/send', async (req, res) => {
    const { sessionId, to, text, imageUrl } = req.body;
    console.log('DEBUG: Menerima request kirim ke:', to, imageUrl ? '(With Image)' : '(Text Only)');
    const s = sessions[sessionId];

    if (!s || !s.connected) {
        console.error(`[Error] Sesi ${sessionId} tidak ditemukan atau OFFLINE!`);
        return res.status(400).json({ error: 'Sesi WA belum terhubung atau tidak aktif.' });
    }

    try {
        if (!to) {
            return res.status(400).json({ error: 'ID Grup/Tujuan wajib diisi!' });
        }

        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        
        if (req.body.location) {
            // KIRIM LOKASI ASLI (Murni peta, tanpa nama kustom agar tidak ngelink)
            await s.sock.sendMessage(jid, { 
                location: { 
                    degreesLatitude: req.body.location.latitude, 
                    degreesLongitude: req.body.location.longitude
                }
            });
            // KIRIM KETERANGAN SEBAGAI PESAN TERPISAH (Ukuran normal, tidak ngelink)
            if (text) {
                await s.sock.sendMessage(jid, { text: text.trim() });
            }
        } else if (imageUrl) {
            let finalImage = imageUrl;
            let isTemp = false;
 
            if (req.body.watermark) {
                const watermarkedPath = await addWatermark(imageUrl, req.body.watermark);
                if (watermarkedPath) {
                    finalImage = watermarkedPath;
                    isTemp = true;
                }
            }
 
            // KIRIM GAMBAR DENGAN CAPTION
            const imagePayload = (finalImage.startsWith('http') && !isTemp) 
                                 ? { url: finalImage } 
                                 : fs.readFileSync(finalImage);

            await s.sock.sendMessage(jid, { 
                image: imagePayload, 
                caption: text 
            });
 
            if (isTemp && fs.existsSync(finalImage)) {
                fs.unlinkSync(finalImage);
            }
        } else {
            // KIRIM TEKS SAJA
            await s.sock.sendMessage(jid, { text });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('[WA Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint untuk status sesi
app.get('/api/wa/status/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    let s = sessions[sessionId];

    // Jika memori kosong tapi folder ada, coba aktifkan secara instan
    if (!s) {
        const authDir = `./sessions/${sessionId}`;
        if (fs.existsSync(authDir)) {
            console.log(`[Status Check] Memicu aktivasi sesi: ${sessionId}`);
            await startSession(sessionId);
            // Tunggu sebentar proses koneksi
            await new Promise(r => setTimeout(r, 2000));
            s = sessions[sessionId];
        }
    }

    res.json({ 
        connected: s?.connected || false,
        hasPairingCode: !!s?.pairingCode
    });
});

app.get('/api/wa/qr/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    let s = sessions[sessionId];
    if (!s) {
        await startSession(sessionId);
        await new Promise(r => setTimeout(r, 3000));
        s = sessions[sessionId];
    }
    if (s?.connected) return res.json({ status: 'connected' });
    if (s?.qr) {
        const img = await QRCode.toDataURL(s.qr);
        return res.json({ status: 'waiting', qr: img });
    }
    res.json({ status: 'generating' });
});

app.get('/api/wa/groups/:sessionId', async (req, res) => {
    const s = sessions[req.params.sessionId];
    if (!s || !s.connected) return res.status(400).json({ error: 'Sesi tidak aktif' });
    try {
        const allGroups = await s.sock.groupFetchAllParticipating();
        const groups = Object.values(allGroups).map(g => ({ id: g.id, subject: g.subject }));
        res.json({ success: true, groups });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/wa/logout/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const s = sessions[sessionId];
    if (s?.sock) await s.sock.logout().catch(() => {});
    delete sessions[sessionId];
    const authDir = `./sessions/${sessionId}`;
    if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
    res.json({ success: true });
});

// Endpoint Testing
app.get('/api/wa/ping', (req, res) => {
    res.json({ pong: true, time: new Date() });
});

// Auto-start semua sesi yang tersimpan di folder saat server menyala
const loadSessions = () => {
    const sessionsDir = './sessions';
    if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);
    
    const folders = fs.readdirSync(sessionsDir);
    folders.forEach(folder => {
        try {
            if (fs.lstatSync(`${sessionsDir}/${folder}`).isDirectory()) {
                console.log(`[Startup] Mengaktifkan kembali sesi: ${folder}`);
                startSession(folder);
            }
        } catch (err) {
            console.error(`[Startup Error] Gagal memuat sesi ${folder}:`, err.message);
        }
    });
};

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] WA Bot Multi-Session standby di port ${PORT} (Listening on 0.0.0.0)`);
    loadSessions();
});
