require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;
const SESSIONS_DIR = path.join(__dirname, 'wa_sessions');

// Initialize empty sessions directory
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Global Storage for active connections
const sessions = new Map();

// Helper to create and start a Bot session
async function startSession(sessionId) {
    if (sessions.has(sessionId)) {
        return sessions.get(sessionId); // already running
    }

    const sessionDir = path.join(SESSIONS_DIR, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Windows', 'Chrome', '121.0.0'],
        syncFullHistory: false
    });

    const sessionObj = {
        sock,
        qr: null,
        status: 'initializing' // 'initializing', 'qr', 'connected', 'disconnected'
    };

    sessions.set(sessionId, sessionObj);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            sessionObj.status = 'qr';
            sessionObj.qr = await QRCode.toDataURL(qr);
            console.log(`[${sessionId}] Menyiapkan QR Code...`);
        }

        if (connection === 'close') {
            sessionObj.status = 'disconnected';
            sessionObj.qr = null;
            
            const statusCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : null;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log(`[${sessionId}] Terputus sesaat (${statusCode}), mencoba menyambung ulang...`);
                sessions.delete(sessionId);
                startSession(sessionId); // try to reconnect
            } else {
                console.log(`[${sessionId}] Perangkat dilogout (Di-disconnect user). Menghapus data sesi.`);
                sessions.delete(sessionId);
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                } catch(e) {}
            }
        } else if (connection === 'open') {
            sessionObj.status = 'connected';
            sessionObj.qr = null;
            console.log(`[${sessionId}] 🎉 WA tersambung sukses!`);
        }
    });

    return sessionObj;
}

// --- API ENDPOINTS --- //

app.get('/', (req, res) => {
    res.json({ message: "Baileys Multi-Session Microservice is Running" });
});

app.post('/api/sessions/create', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    await startSession(sessionId);
    res.json({ success: true, message: "Session berjalan", sessionId });
});

app.get('/api/sessions/:sessionId/status', async (req, res) => {
    const { sessionId } = req.params;
    const sessionPath = path.join(SESSIONS_DIR, sessionId);
    
    // Check if session directory exists (misal saat restart)
    if (!sessions.has(sessionId) && fs.existsSync(sessionPath)) {
        await startSession(sessionId);
    }

    const sessionObj = sessions.get(sessionId);
    if (!sessionObj) {
        return res.json({ status: "not_found", qr: null });
    }

    // Jika folder ada tapi belum fully connected, kita tunggu sebentar
    if (sessionObj.status === 'initializing') {
         await new Promise(r => setTimeout(r, 1000));
    }

    res.json({ status: sessionObj.status, qr: sessionObj.qr });
});

app.delete('/api/sessions/:sessionId', async (req, res) => {
     const { sessionId } = req.params;
     const sessionObj = sessions.get(sessionId);
     if (sessionObj) {
         try { await sessionObj.sock.logout(); } catch(e) {}
         sessions.delete(sessionId);
     }
     const sessionDir = path.join(SESSIONS_DIR, sessionId);
     try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch(e) {}
     res.json({ success: true, message: "Session berhasil dilogout & dihapus" });
});

// Endpoint untuk mencari group per ID
app.get('/api/sessions/:sessionId/groups', async (req, res) => {
    const { sessionId } = req.params;
    const sessionObj = sessions.get(sessionId);
    if (!sessionObj || sessionObj.status !== 'connected') {
         return res.status(400).json({ error: "Sesi tidak ditemukan atau belum terkoneksi WA." });
    }
    
    try {
        const groups = Object.values(await sessionObj.sock.groupFetchAllParticipating());
        const result = groups.map(g => ({ id: g.id, name: g.subject }));
        res.json({ success: true, data: result });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/send-message', async (req, res) => {
    const { sessionId, to, text, image } = req.body;
    if (!sessionId || !to) return res.status(400).json({ error: "sessionId and to required" });

    // Pastikan sesi menyala
    if (!sessions.has(sessionId)) {
        const sessionPath = path.join(SESSIONS_DIR, sessionId);
        if (fs.existsSync(sessionPath)) {
            await startSession(sessionId);
        } else {
             return res.status(400).json({ error: "Sesi karyawan belum terdaftar. Harus Scan QR dulu." });
        }
    }

    const sessionObj = sessions.get(sessionId);
    let waitCount = 0;
    while(sessionObj.status !== 'connected' && waitCount < 10) {
        await new Promise(r => setTimeout(r, 1000));
        waitCount++;
    }

    if (sessionObj.status !== 'connected') {
        return res.status(400).json({ error: "Sesi WA karyawan terputus/off. Minta karyawan buka aplikasi WA miliknya." });
    }

    try {
        // jika 'to' tidak ada spasi @ maka beri default ke wa group atau japri
        const target = to.includes('@') ? to : (to.length > 15 ? `${to}@g.us` : `${to}@s.whatsapp.net`); 
        
        if (image) {
            await sessionObj.sock.sendMessage(target, { image: { url: image }, caption: text || '' });
        } else {
            await sessionObj.sock.sendMessage(target, { text: text || '' });
        }
        res.json({ success: true, message: "Pesan WhatsApp diteruskan dari " + sessionId });
    } catch(err) {
        console.error("Gagal mengirim WA: ", err);
        res.status(500).json({ error: err.message });
    }
});

// Auto-load all active sessions on boot
function loadAllExistingSessions() {
    console.log("Memuat semua sesi WA Karyawan yang tersimpan...");
    if (fs.existsSync(SESSIONS_DIR)) {
        const folders = fs.readdirSync(SESSIONS_DIR);
        for (const folder of folders) {
             startSession(folder);
        }
    }
}

app.listen(PORT, () => {
    const divider = "=================================================";
    console.log(`\n${divider}`);
    console.log(`🤖 BAILEYS MULTI-SESSION MICROSERVICE AKTIF (Port ${PORT})`);
    console.log(`${divider}\n`);
    loadAllExistingSessions();
});