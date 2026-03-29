const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const multer   = require('multer');
const cloudinary = require('cloudinary').v2;
const supabase = require('../lib/supabase');
const auth     = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    ).end(buffer);
  });
}

// POST /api/auth/login
// Body: { identifier, password } — identifier bisa email ATAU employee_id
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = identifier || email; // support keduanya

    if (!loginId || !password)
      return res.status(400).json({ error: 'ID/Email dan password wajib diisi' });

    // Cari user by email ATAU employee_id
    const isEmail = loginId.includes('@');
    const query   = supabase.from('users').select('*').eq('is_active', true);

    const { data: user, error } = isEmail
      ? await query.eq('email', loginId.toLowerCase()).single()
      : await query.eq('employee_id', loginId.trim()).single();

    if (error || !user)
      return res.status(401).json({ error: 'ID/Email atau password salah' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'ID/Email atau password salah' });

    const token = jwt.sign(
      { id: user.id, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id:          user.id,
        nama:        user.nama,
        email:       user.email,
        role:        user.role,
        no_wa:       user.no_wa,
        employee_id: user.employee_id,
        foto_url:    user.foto_url,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama, email, role, no_wa, employee_id, foto_url')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json(data);
});

// GET /api/auth/profil — ambil profil lengkap user yang login + settings
router.get('/profil', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, email, role, no_wa, employee_id, foto_url, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) return res.status(404).json({ error: 'User tidak ditemukan' });

    // Fetch lembur timeout dari config
    const { data: configData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'lembur_timeout_seconds')
      .single();

    const timeout = parseInt(configData?.value || '600');

    res.json({
      ...data,
      lembur_timeout_seconds: timeout
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/profil — update foto saja (nama, no_wa, employee_id dikunci)
router.patch('/profil', auth, async (req, res) => {
  try {
    const { foto_url } = req.body;
    const updateData = {};
    if (foto_url !== undefined) updateData.foto_url = foto_url;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, nama, email, role, no_wa, employee_id, foto_url')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/upload-foto — upload foto profil ke Cloudinary
router.post('/upload-foto', auth, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File foto wajib diupload' });
    const result = await uploadToCloudinary(req.file.buffer, 'tunjangan-app/profil');

    // Simpan URL ke database
    await supabase.from('users')
      .update({ foto_url: result.secure_url })
      .eq('id', req.user.id);

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/ganti-password
router.post('/ganti-password', auth, async (req, res) => {
  try {
    const { password_lama, password_baru } = req.body;
    if (!password_lama || !password_baru)
      return res.status(400).json({ error: 'Password lama dan baru wajib diisi' });
    if (password_baru.length < 6)
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });

    // Ambil hash password lama
    const { data: user } = await supabase
      .from('users').select('password_hash').eq('id', req.user.id).single();

    const valid = await bcrypt.compare(password_lama, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Password lama tidak sesuai' });

    const hash = await bcrypt.hash(password_baru, 10);
    await supabase.from('users').update({ password_hash: hash }).eq('id', req.user.id);

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register (admin only)
router.post('/register', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Hanya admin yang bisa tambah user' });
    const { nama, email, password, role, no_wa } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ nama, email: email.toLowerCase(), password_hash: hash, role: role || 'client', no_wa })
      .select('id, nama, email, role').single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;