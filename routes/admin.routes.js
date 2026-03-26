const express   = require('express');
const router    = express.Router();
const supabase  = require('../lib/supabase');
const auth      = require('../middleware/auth');
const ExcelJS   = require('exceljs');
const bcrypt    = require('bcryptjs');

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Hanya admin yang bisa akses' });
  next();
}

function formatWaktu(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatTanggal(iso) {
  if (!iso) return '-';
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ─── PROFIL ───────────────────────────────────────────────────────────────────
router.get('/profil', auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama, email, role, no_wa, foto_url, employee_id, created_at')
    .eq('id', req.user.id).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.patch('/profil', auth, adminOnly, async (req, res) => {
  const { nama, no_wa, foto_url } = req.body;
  const { data, error } = await supabase
    .from('users').update({ nama, no_wa, foto_url })
    .eq('id', req.user.id)
    .select('id, nama, email, role, no_wa, foto_url').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// ─── SETTING ──────────────────────────────────────────────────────────────────
router.get('/setting', auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase.from('config').select('key, value, keterangan');
  if (error) return res.status(400).json({ error: error.message });
  const result = {};
  data.forEach(row => { result[row.key] = row.value; });
  res.json(result);
});

router.patch('/setting', auth, adminOnly, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await supabase.from('config').update({ value: String(value) }).eq('key', key);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/rs/:id', auth, adminOnly, async (req, res) => {
  const { harga_share_lokasi, is_active } = req.body;
  const updateData = {};
  if (harga_share_lokasi !== undefined) updateData.harga_share_lokasi = harga_share_lokasi;
  if (is_active !== undefined) updateData.is_active = is_active;
  const { data, error } = await supabase
    .from('rumah_sakit').update(updateData).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

router.get('/rs', auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('rumah_sakit').select('id, kode_rs, nama_rs, harga_share_lokasi, is_active').order('nama_rs');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ─── JOB ──────────────────────────────────────────────────────────────────────
// GET /api/admin/jobs
router.get('/jobs', auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('jobs').select('id, nama').order('nama');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/jobs
router.post('/jobs', auth, adminOnly, async (req, res) => {
  const { nama } = req.body;
  if (!nama) return res.status(400).json({ error: 'Nama job wajib diisi' });
  const { data, error } = await supabase
    .from('jobs').insert({ nama: nama.trim().toLowerCase() })
    .select().single();
  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Job sudah ada' });
    return res.status(400).json({ error: error.message });
  }
  res.json({ success: true, data });
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', auth, adminOnly, async (req, res) => {
  const { error } = await supabase
    .from('jobs').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ─── KARYAWAN ─────────────────────────────────────────────────────────────────
router.get('/users', auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, employee_id, nama, email, role, no_wa, foto_url, job, is_active, created_at')
    .order('employee_id');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { nama, email, password, role, no_wa, employee_id, job } = req.body;
    if (!nama || !email || !password)
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });

    let empId = employee_id;
    if (!empId) {
      const { data: maxData } = await supabase
        .from('users').select('employee_id').not('employee_id', 'is', null)
        .order('employee_id', { ascending: false }).limit(1);
      const maxNum = maxData && maxData.length > 0 ? parseInt(maxData[0].employee_id) + 1 : 1;
      empId = String(maxNum).padStart(3, '0');
    }

    const { data: existing } = await supabase
      .from('users').select('id').eq('employee_id', empId).single();
    if (existing)
      return res.status(400).json({ error: `ID karyawan ${empId} sudah dipakai` });

    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ nama, email: email.toLowerCase(), password_hash: hash, role: role || 'client', no_wa, employee_id: empId, job: job || null })
      .select('id, employee_id, nama, email, role, no_wa, job').single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email sudah terdaftar' });
      return res.status(400).json({ error: error.message });
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id', auth, adminOnly, async (req, res) => {
  const { nama, no_wa, role, is_active, employee_id, password, job } = req.body;
  const updateData = {};
  if (nama        !== undefined) updateData.nama        = nama;
  if (no_wa       !== undefined) updateData.no_wa       = no_wa;
  if (role        !== undefined) updateData.role        = role;
  if (is_active   !== undefined) updateData.is_active   = is_active;
  if (employee_id !== undefined) updateData.employee_id = employee_id;
  if (job         !== undefined) updateData.job         = job;
  if (password) updateData.password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users').update(updateData).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
  const { error } = await supabase
    .from('users').update({ is_active: false }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ─── REKAP ────────────────────────────────────────────────────────────────────
router.get('/rekap', auth, adminOnly, async (req, res) => {
  try {
    const { bulan } = req.query;
    if (!bulan) return res.status(400).json({ error: 'Parameter bulan wajib (format: 2026-01)' });
    const awal  = `${bulan}-01`;
    const akhir = new Date(new Date(awal).getFullYear(), new Date(awal).getMonth() + 1, 0).toISOString().split('T')[0];
    const { data: clients } = await supabase
      .from('users').select('id, nama, employee_id, job')
      .eq('role', 'client').eq('is_active', true).order('nama');
    const rekap = [];
    for (const client of clients) {
      const { data: shareLokasi } = await supabase
        .from('share_lokasi').select('*, rumah_sakit(nama_rs)')
        .eq('user_id', client.id).gte('waktu_share', awal).lte('waktu_share', akhir + 'T23:59:59Z').order('waktu_share');
      const { data: lembur } = await supabase
        .from('lembur').select('*, rumah_sakit(nama_rs)')
        .eq('user_id', client.id).eq('status', 'submitted').gte('waktu_foto', awal).lte('waktu_foto', akhir + 'T23:59:59Z').order('waktu_foto');
      const { data: standby } = await supabase
        .from('standby').select('*')
        .eq('user_id', client.id).gte('tanggal', awal).lte('tanggal', akhir).order('tanggal');
      const totalShare   = (shareLokasi || []).reduce((s, r) => s + parseFloat(r.harga || 0), 0);
      const totalLembur  = (lembur || []).reduce((s, r) => s + parseFloat(r.total_harga || 0), 0);
      const totalStandby = (standby || []).reduce((s, r) => s + parseFloat(r.harga || 0), 0);
      rekap.push({ client, shareLokasi: shareLokasi||[], lembur: lembur||[], standby: standby||[],
        total: { share: totalShare, lembur: totalLembur, standby: totalStandby, grand: totalShare+totalLembur+totalStandby } });
    }
    res.json({ bulan, rekap });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/rekap/xlsx', auth, adminOnly, async (req, res) => {
  try {
    const { bulan } = req.query;
    if (!bulan) return res.status(400).json({ error: 'Parameter bulan wajib (format: 2026-01)' });
    const awal      = `${bulan}-01`;
    const akhir     = new Date(new Date(awal).getFullYear(), new Date(awal).getMonth() + 1, 0).toISOString().split('T')[0];
    const namaBulan = new Date(awal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const { data: clients } = await supabase
      .from('users').select('id, nama, employee_id, job')
      .eq('role', 'client').eq('is_active', true).order('nama');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tunjangan App'; workbook.created = new Date();
    const C_SHARE='FF4361EE',C_LEMBUR='FFFF8C00',C_STANDBY='FF2DC653',C_TOTAL='FF1A1A2E',C_WHITE='FFFFFFFF',C_ALT='FFF8F9FF';
    const hStyle=(color)=>({font:{bold:true,color:{argb:C_WHITE},size:10},fill:{type:'pattern',pattern:'solid',fgColor:{argb:color}},alignment:{horizontal:'center',vertical:'middle',wrapText:true},border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}});
    const dStyle=(alt=false)=>({font:{size:10},fill:{type:'pattern',pattern:'solid',fgColor:{argb:alt?C_ALT:C_WHITE}},alignment:{vertical:'middle',wrapText:true},border:{top:{style:'hair'},bottom:{style:'hair'},left:{style:'hair'},right:{style:'hair'}}});
    const rStyle=(alt=false)=>({...dStyle(alt),numFmt:'"Rp"#,##0',alignment:{horizontal:'right',vertical:'middle'}});
    for (const client of clients) {
      const { data: shareLokasi } = await supabase.from('share_lokasi').select('*, rumah_sakit(nama_rs)').eq('user_id', client.id).gte('waktu_share', awal).lte('waktu_share', akhir+'T23:59:59Z').order('waktu_share');
      const { data: lembur } = await supabase.from('lembur').select('*, rumah_sakit(nama_rs)').eq('user_id', client.id).eq('status', 'submitted').gte('waktu_foto', awal).lte('waktu_foto', akhir+'T23:59:59Z').order('waktu_foto');
      const { data: standby } = await supabase.from('standby').select('*').eq('user_id', client.id).gte('tanggal', awal).lte('tanggal', akhir).order('tanggal');
      const sheetName = client.nama.replace(/[:\\\/\?\*\[\]]/g,'').substring(0,31);
      const sheet = workbook.addWorksheet(sheetName);
      let r=1;
      sheet.mergeCells(`A${r}:F${r}`);
      const tc=sheet.getCell(`A${r}`);
      tc.value=`REKAP TUNJANGAN — ${client.nama.toUpperCase()} — ${namaBulan.toUpperCase()}${client.job?' ('+client.job.toUpperCase()+')':''}`;
      tc.font={bold:true,size:12,color:{argb:C_TOTAL}};tc.alignment={horizontal:'center',vertical:'middle'};tc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE8F0FE'}};
      sheet.getRow(r).height=28;r+=2;
      sheet.mergeCells(`A${r}:F${r}`);Object.assign(sheet.getCell(`A${r}`),{value:'SHARE LOKASI',font:{bold:true,size:11,color:{argb:C_WHITE}},fill:{type:'pattern',pattern:'solid',fgColor:{argb:C_SHARE}},alignment:{horizontal:'left',vertical:'middle'}});sheet.getRow(r).height=22;r++;
      ['No','Nama','Tanggal','Jam','Lokasi RS','Nilai (Rp)'].forEach((h,i)=>{const c=sheet.getCell(r,i+1);c.value=h;Object.assign(c,hStyle(C_SHARE));});[4,18,26,14,28,16].forEach((w,i)=>{sheet.getColumn(i+1).width=w;});sheet.getRow(r).height=18;r++;
      (shareLokasi||[]).forEach((sl,idx)=>{const alt=idx%2===1,w=new Date(sl.waktu_share);const tgl=w.toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'});const jam=w.toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'});[idx+1,client.nama,tgl,jam,sl.rumah_sakit?.nama_rs||'-',parseFloat(sl.harga||0)].forEach((v,i)=>{const c=sheet.getCell(r,i+1);c.value=v;Object.assign(c,i===5?rStyle(alt):dStyle(alt));});sheet.getRow(r).height=16;r++;});
      if(!shareLokasi?.length){sheet.mergeCells(`A${r}:F${r}`);sheet.getCell(`A${r}`).value='Tidak ada data';sheet.getCell(`A${r}`).font={italic:true,color:{argb:'FF888888'},size:10};sheet.getCell(`A${r}`).alignment={horizontal:'center'};r++;}
      const tShare=(shareLokasi||[]).reduce((s,r)=>s+parseFloat(r.harga||0),0);
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?'TOTAL SHARE LOKASI':tShare;c.font={bold:true,size:10,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_SHARE}};c.alignment={horizontal:'right'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=18;r+=2;
      sheet.mergeCells(`A${r}:F${r}`);Object.assign(sheet.getCell(`A${r}`),{value:'LEMBUR',font:{bold:true,size:11,color:{argb:C_WHITE}},fill:{type:'pattern',pattern:'solid',fgColor:{argb:C_LEMBUR}},alignment:{horizontal:'left',vertical:'middle'}});sheet.getRow(r).height=22;r++;
      ['No','Nama','Waktu Foto','Lokasi RS','Keterangan','Total (Rp)'].forEach((h,i)=>{const c=sheet.getCell(r,i+1);c.value=h;Object.assign(c,hStyle(C_LEMBUR));});sheet.getRow(r).height=18;r++;
      (lembur||[]).forEach((l,idx)=>{const alt=idx%2===1;[idx+1,client.nama,formatWaktu(l.waktu_foto),l.rumah_sakit?.nama_rs||'-',l.keterangan||'-',parseFloat(l.total_harga||0)].forEach((v,i)=>{const c=sheet.getCell(r,i+1);c.value=v;Object.assign(c,i===5?rStyle(alt):dStyle(alt));});sheet.getRow(r).height=16;r++;});
      if(!lembur?.length){sheet.mergeCells(`A${r}:F${r}`);sheet.getCell(`A${r}`).value='Tidak ada data';sheet.getCell(`A${r}`).font={italic:true,color:{argb:'FF888888'},size:10};sheet.getCell(`A${r}`).alignment={horizontal:'center'};r++;}
      const tLembur=(lembur||[]).reduce((s,r)=>s+parseFloat(r.total_harga||0),0);
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?'TOTAL LEMBUR':tLembur;c.font={bold:true,size:10,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_LEMBUR}};c.alignment={horizontal:'right'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=18;r+=2;
      sheet.mergeCells(`A${r}:F${r}`);Object.assign(sheet.getCell(`A${r}`),{value:'STANDBY',font:{bold:true,size:11,color:{argb:C_WHITE}},fill:{type:'pattern',pattern:'solid',fgColor:{argb:C_STANDBY}},alignment:{horizontal:'left',vertical:'middle'}});sheet.getRow(r).height=22;r++;
      ['No','Nama','Tanggal','Jenis','Keterangan','Tunjangan (Rp)'].forEach((h,i)=>{const c=sheet.getCell(r,i+1);c.value=h;Object.assign(c,hStyle(C_STANDBY));});sheet.getRow(r).height=18;r++;
      (standby||[]).forEach((s,idx)=>{const alt=idx%2===1;const jenis=s.jenis_standby==='hari_raya'?`Hari Raya${s.nama_hari_raya?` (${s.nama_hari_raya})`:''}`:'Hari Minggu';[idx+1,client.nama,formatTanggal(s.tanggal),jenis,'-',parseFloat(s.harga||0)].forEach((v,i)=>{const c=sheet.getCell(r,i+1);c.value=v;Object.assign(c,i===5?rStyle(alt):dStyle(alt));});sheet.getRow(r).height=16;r++;});
      if(!standby?.length){sheet.mergeCells(`A${r}:F${r}`);sheet.getCell(`A${r}`).value='Tidak ada data';sheet.getCell(`A${r}`).font={italic:true,color:{argb:'FF888888'},size:10};sheet.getCell(`A${r}`).alignment={horizontal:'center'};r++;}
      const tStandby=(standby||[]).reduce((s,r)=>s+parseFloat(r.harga||0),0);
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?'TOTAL STANDBY':tStandby;c.font={bold:true,size:10,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_STANDBY}};c.alignment={horizontal:'right'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=18;r+=2;
      const grand=tShare+tLembur+tStandby;
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?`GRAND TOTAL — ${client.nama.toUpperCase()}`:grand;c.font={bold:true,size:12,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_TOTAL}};c.alignment={horizontal:'right',vertical:'middle'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=26;
    }
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="Rekap_Tunjangan_${bulan}.xlsx"`);
    await workbook.xlsx.write(res);res.end();
  } catch (err) { console.error('Error generate XLSX:', err); res.status(500).json({ error: err.message }); }
});

module.exports = router;      