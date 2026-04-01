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
    console.log('--- UPDATING SETTINGS ---', updates);
    for (const [key, value] of Object.entries(updates)) {
      if (!key) continue;
      const { error } = await supabase.from('config').upsert({ key, value: String(value) }, { onConflict: 'key' });
      if (error) {
        console.error(`Gagal update config [${key}]:`, error);
        return res.status(400).json({ error: `Gagal simpan setting ${key}: ${error.message}` });
      }
    }
    res.json({ success: true });
  } catch (err) { 
    console.error('Crash PATCH setting:', err);
    res.status(500).json({ error: err.message }); 
  }
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
    .from('rumah_sakit').select('id, kode_rs, nama_rs, harga_share_lokasi, is_active').eq('is_active', true).order('nama_rs');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ─── JOB ──────────────────────────────────────────────────────────────────────
router.get('/jobs', auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase.from('jobs').select('id, nama').order('nama');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/jobs', auth, adminOnly, async (req, res) => {
  const { nama } = req.body;
  if (!nama) return res.status(400).json({ error: 'Nama job wajib diisi' });
  const { data, error } = await supabase
    .from('jobs').insert({ nama: nama.trim().toLowerCase() }).select().single();
  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Job sudah ada' });
    return res.status(400).json({ error: error.message });
  }
  res.json({ success: true, data });
});

router.delete('/jobs/:id', auth, adminOnly, async (req, res) => {
  const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ─── WA GROUPS (Per-Job WhatsApp Group Mapping) ────────────────────────────────
router.get('/wa-groups', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wa_group_mappings')
      .select('id, job_id, wa_group_id, group_name, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    
    // Enrich dengan job info
    const enriched = await Promise.all(data.map(async (mapping) => {
      const { data: job } = await supabase
        .from('jobs').select('id, nama').eq('id', mapping.job_id).single();
      return { ...mapping, job: job };
    }));
    
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/wa-groups', auth, adminOnly, async (req, res) => {
  try {
    const { job_id, wa_group_id, group_name } = req.body;
    
    if (!job_id || !wa_group_id)
      return res.status(400).json({ error: 'Job ID dan WhatsApp Group ID wajib diisi' });
    
    // Validasi job exists
    const { data: jobExists } = await supabase
      .from('jobs').select('id, nama').eq('id', job_id).single();
    if (!jobExists)
      return res.status(400).json({ error: 'Job tidak ditemukan' });
    
    // Check duplicate wa_group_id
    const { data: duplicate } = await supabase
      .from('wa_group_mappings').select('id').eq('wa_group_id', wa_group_id).limit(1);
    if (duplicate && duplicate.length > 0)
      return res.status(400).json({ error: 'Group WA ini sudah terdaftar' });
    
    const { data, error } = await supabase
      .from('wa_group_mappings')
      .insert({
        job_id,
        wa_group_id,
        group_name: group_name || jobExists.nama
      })
      .select().single();
    
    if (error) return res.status(400).json({ error: error.message });
    
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/wa-groups/:id', auth, adminOnly, async (req, res) => {
  try {
    const { wa_group_id, group_name } = req.body;
    const updateData = {};
    
    if (wa_group_id) {
      // Check duplicate if changing wa_group_id
      const { data: duplicate } = await supabase
        .from('wa_group_mappings')
        .select('id')
        .eq('wa_group_id', wa_group_id)
        .neq('id', req.params.id)
        .limit(1);
      if (duplicate && duplicate.length > 0)
        return res.status(400).json({ error: 'Group WA ini sudah terdaftar' });
      updateData.wa_group_id = wa_group_id;
    }
    
    if (group_name !== undefined) updateData.group_name = group_name;
    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ error: 'Tidak ada yang diupdate' });
    
    const { data, error } = await supabase
      .from('wa_group_mappings')
      .update(updateData)
      .eq('id', req.params.id)
      .select().single();
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/wa-groups/:id', auth, adminOnly, async (req, res) => {
  try {
    const { error } = await supabase
      .from('wa_group_mappings')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
  try {
    const { nama, no_wa, role, is_active, employee_id, password, job, email } = req.body;
    const { id } = req.params;
    
    const updateData = {};
    if (nama !== undefined) updateData.nama = nama;
    if (no_wa !== undefined) updateData.no_wa = no_wa;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (job !== undefined) updateData.job = job;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email sudah terdaftar untuk pengguna lain' });
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: `Karyawan dengan ID ${id} tidak ditemukan di database` });
    }

    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
  const { error } = await supabase
    .from('users').update({ is_active: false }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ─── HELPER: ambil data rekap per client ──────────────────────────────────────
async function getRekapClient(client, awal, akhir) {
  // Share Lokasi: sebagai pengirim
  const { data: shareLokasiSend } = await supabase
    .from('share_lokasi').select('*, rumah_sakit(nama_rs)')
    .eq('user_id', client.id)
    .gte('waktu_share', awal).lte('waktu_share', akhir + 'T23:59:59Z')
    .order('waktu_share');

  // Share Lokasi: sebagai yang ditag
  const { data: shareLokasiTagRaw } = await supabase
    .from('tag_share_lokasi')
    .select('share_lokasi_id, share_lokasi(*, rumah_sakit(nama_rs))')
    .eq('tagged_user_id', client.id);
  const shareLokasiTagged = (shareLokasiTagRaw || [])
    .map(t => t.share_lokasi).filter(sl => {
      if (!sl) return false;
      const w = sl.waktu_share;
      return w >= awal && w <= akhir + 'T23:59:59Z';
    });

  // Gabung & deduplicate berdasarkan id
  const shareMap = new Map();
  [...(shareLokasiSend || []), ...shareLokasiTagged].forEach(sl => { if (sl) shareMap.set(sl.id, sl); });
  const shareLokasi = Array.from(shareMap.values()).sort((a, b) => new Date(a.waktu_share) - new Date(b.waktu_share));

  // Lembur: sebagai pengirim
  const { data: lemburSend } = await supabase
    .from('lembur').select('*, rumah_sakit(nama_rs)')
    .eq('user_id', client.id).eq('status', 'submitted')
    .gte('waktu_foto', awal).lte('waktu_foto', akhir + 'T23:59:59Z')
    .order('waktu_foto');

  // Lembur: sebagai yang ditag
  const { data: lemburTagRaw } = await supabase
    .from('tag_lembur')
    .select('lembur_id, lembur(*, rumah_sakit(nama_rs))')
    .eq('tagged_user_id', client.id);
  const lemburTagged = (lemburTagRaw || [])
    .map(t => t.lembur).filter(l => {
      if (!l || l.status !== 'submitted') return false;
      const w = l.waktu_foto;
      return w >= awal && w <= akhir + 'T23:59:59Z';
    });

  // Gabung & deduplicate
  const lemburMap = new Map();
  [...(lemburSend || []), ...lemburTagged].forEach(l => { if (l) lemburMap.set(l.id, l); });
  const lembur = Array.from(lemburMap.values()).sort((a, b) => new Date(a.waktu_foto) - new Date(b.waktu_foto));

  // Standby: hanya milik sendiri
  const { data: standby } = await supabase
    .from('standby').select('*')
    .eq('user_id', client.id)
    .gte('tanggal', awal).lte('tanggal', akhir)
    .order('tanggal');

  const totalShare   = shareLokasi.reduce((s, r) => s + parseFloat(r.harga || 0), 0);
  const totalLembur  = lembur.reduce((s, r) => s + parseFloat(r.total_harga || 0), 0);
  const totalStandby = (standby || []).reduce((s, r) => s + parseFloat(r.harga || 0), 0);

  return {
    shareLokasi,
    lembur,
    standby: standby || [],
    total: { share: totalShare, lembur: totalLembur, standby: totalStandby, grand: totalShare + totalLembur + totalStandby }
  };
}

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
      const data = await getRekapClient(client, awal, akhir);
      rekap.push({ client, ...data });
    }
    res.json({ bulan, rekap });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── REKAP XLSX ───────────────────────────────────────────────────────────────
router.post('/rekap/xlsx', auth, adminOnly, async (req, res) => {
  try {
    const { bulan, rekapData } = req.body;
    if (!bulan || !rekapData) return res.status(400).json({ error: 'Parameter bulan dan rekapData wajib' });
    
    const awal      = `${bulan}-01`;
    const namaBulan = new Date(awal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tunjangan App'; workbook.created = new Date();
    const C_SHARE='FF4361EE',C_LEMBUR='FFFF8C00',C_STANDBY='FF2DC653',C_TOTAL='FF1A1A2E',C_WHITE='FFFFFFFF',C_ALT='FFF8F9FF';
    const hStyle=(color)=>({font:{bold:true,color:{argb:C_WHITE},size:10},fill:{type:'pattern',pattern:'solid',fgColor:{argb:color}},alignment:{horizontal:'center',vertical:'middle',wrapText:true},border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}});
    const dStyle=(alt=false)=>({font:{size:10},fill:{type:'pattern',pattern:'solid',fgColor:{argb:alt?C_ALT:C_WHITE}},alignment:{vertical:'middle',wrapText:true},border:{top:{style:'hair'},bottom:{style:'hair'},left:{style:'hair'},right:{style:'hair'}}});
    const rStyle=(alt=false)=>({...dStyle(alt),numFmt:'"Rp"#,##0',alignment:{horizontal:'right',vertical:'middle'}});

    for (const item of rekapData) {
      const { client, shareLokasi, lembur, standby, total } = item;
      const sheetName = client.nama.replace(/[:\\\/\?\*\[\]]/g,'').substring(0,31);
      const sheet = workbook.addWorksheet(sheetName);
      let r=1;
      sheet.mergeCells(`A${r}:F${r}`);
      const tc=sheet.getCell(`A${r}`);
      tc.value=`REKAP TUNJANGAN — ${client.nama.toUpperCase()} — ${namaBulan.toUpperCase()}${client.job?' ('+client.job.toUpperCase()+')':''}`;
      tc.font={bold:true,size:12,color:{argb:C_TOTAL}};tc.alignment={horizontal:'center',vertical:'middle'};tc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE8F0FE'}};
      sheet.getRow(r).height=28;r+=2;

      // Share Lokasi
      sheet.mergeCells(`A${r}:F${r}`);Object.assign(sheet.getCell(`A${r}`),{value:'SHARE LOKASI',font:{bold:true,size:11,color:{argb:C_WHITE}},fill:{type:'pattern',pattern:'solid',fgColor:{argb:C_SHARE}},alignment:{horizontal:'left',vertical:'middle'}});sheet.getRow(r).height=22;r++;
      ['No','Nama','Tanggal','Jam','Lokasi RS','Nilai (Rp)'].forEach((h,i)=>{const c=sheet.getCell(r,i+1);c.value=h;Object.assign(c,hStyle(C_SHARE));});[4,18,26,14,28,16].forEach((w,i)=>{sheet.getColumn(i+1).width=w;});sheet.getRow(r).height=18;r++;
      shareLokasi.forEach((sl,idx)=>{const alt=idx%2===1,w=new Date(sl.waktu_share);const tgl=w.toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'});const jam=w.toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'});[idx+1,client.nama,tgl,jam,sl.rumah_sakit?.nama_rs||'-',parseFloat(sl.harga||0)].forEach((v,i)=>{const c=sheet.getCell(r,i+1);c.value=v;Object.assign(c,i===5?rStyle(alt):dStyle(alt));});sheet.getRow(r).height=16;r++;});
      if(!shareLokasi.length){sheet.mergeCells(`A${r}:F${r}`);sheet.getCell(`A${r}`).value='Tidak ada data';sheet.getCell(`A${r}`).font={italic:true,color:{argb:'FF888888'},size:10};sheet.getCell(`A${r}`).alignment={horizontal:'center'};r++;}
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?'TOTAL SHARE LOKASI':total.share;c.font={bold:true,size:10,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_SHARE}};c.alignment={horizontal:'right'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=18;r+=2;

      // Lembur
      sheet.mergeCells(`A${r}:F${r}`);Object.assign(sheet.getCell(`A${r}`),{value:'LEMBUR',font:{bold:true,size:11,color:{argb:C_WHITE}},fill:{type:'pattern',pattern:'solid',fgColor:{argb:C_LEMBUR}},alignment:{horizontal:'left',vertical:'middle'}});sheet.getRow(r).height=22;r++;
      ['No','Nama','Waktu Foto','Lokasi RS','Keterangan','Total (Rp)'].forEach((h,i)=>{const c=sheet.getCell(r,i+1);c.value=h;Object.assign(c,hStyle(C_LEMBUR));});sheet.getRow(r).height=18;r++;
      lembur.forEach((l,idx)=>{const alt=idx%2===1;[idx+1,client.nama,formatWaktu(l.waktu_foto),l.rumah_sakit?.nama_rs||'-',l.keterangan||'-',parseFloat(l.total_harga||0)].forEach((v,i)=>{const c=sheet.getCell(r,i+1);c.value=v;Object.assign(c,i===5?rStyle(alt):dStyle(alt));});sheet.getRow(r).height=16;r++;});
      if(!lembur.length){sheet.mergeCells(`A${r}:F${r}`);sheet.getCell(`A${r}`).value='Tidak ada data';sheet.getCell(`A${r}`).font={italic:true,color:{argb:'FF888888'},size:10};sheet.getCell(`A${r}`).alignment={horizontal:'center'};r++;}
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?'TOTAL LEMBUR':total.lembur;c.font={bold:true,size:10,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_LEMBUR}};c.alignment={horizontal:'right'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=18;r+=2;

      // Standby
      sheet.mergeCells(`A${r}:F${r}`);Object.assign(sheet.getCell(`A${r}`),{value:'STANDBY',font:{bold:true,size:11,color:{argb:C_WHITE}},fill:{type:'pattern',pattern:'solid',fgColor:{argb:C_STANDBY}},alignment:{horizontal:'left',vertical:'middle'}});sheet.getRow(r).height=22;r++;
      ['No','Nama','Tanggal','Jenis','Keterangan','Tunjangan (Rp)'].forEach((h,i)=>{const c=sheet.getCell(r,i+1);c.value=h;Object.assign(c,hStyle(C_STANDBY));});sheet.getRow(r).height=18;r++;
      standby.forEach((s,idx)=>{const alt=idx%2===1;const jenis=s.jenis_standby==='hari_raya'?`Hari Raya${s.nama_hari_raya?` (${s.nama_hari_raya})`:''}`:'Hari Minggu';[idx+1,client.nama,formatTanggal(s.tanggal),jenis,'-',parseFloat(s.harga||0)].forEach((v,i)=>{const c=sheet.getCell(r,i+1);c.value=v;Object.assign(c,i===5?rStyle(alt):dStyle(alt));});sheet.getRow(r).height=16;r++;});
      if(!standby.length){sheet.mergeCells(`A${r}:F${r}`);sheet.getCell(`A${r}`).value='Tidak ada data';sheet.getCell(`A${r}`).font={italic:true,color:{argb:'FF888888'},size:10};sheet.getCell(`A${r}`).alignment={horizontal:'center'};r++;}
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?'TOTAL STANDBY':total.standby;c.font={bold:true,size:10,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_STANDBY}};c.alignment={horizontal:'right'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=18;r+=2;

      // Grand Total
      sheet.mergeCells(`A${r}:E${r}`);['A','F'].forEach((col,i)=>{const c=sheet.getCell(`${col}${r}`);c.value=i===0?`GRAND TOTAL — ${client.nama.toUpperCase()}`:total.grand;c.font={bold:true,size:12,color:{argb:C_WHITE}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C_TOTAL}};c.alignment={horizontal:'right',vertical:'middle'};if(i===1)c.numFmt='"Rp"#,##0';});sheet.getRow(r).height=26;
    }
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="Rekap_Tunjangan_${bulan}.xlsx"`);
    await workbook.xlsx.write(res);res.end();
  } catch (err) { console.error('Error generate XLSX:', err); res.status(500).json({ error: err.message }); }
});
// ─── RS CONFIG & SYNC ─────────────────────────────────────────────────────────
router.get('/rs-config', auth, adminOnly, async (req, res) => {
  const { data: urlData } = await supabase
    .from('config').select('value').eq('key', 'google_sheets_url').single();
  const { data: syncData } = await supabase
    .from('config').select('value').eq('key', 'last_rs_sync').single();
  res.json({
    url: urlData?.value || '',
    last_sync: syncData?.value || null,
  });
});
 
router.post('/rs-sync', auth, adminOnly, async (req, res) => {
  try {
    const { url } = req.body;
    const { syncRumahSakit } = require('../services/google-sheets.service');
    const result = await syncRumahSakit(url || null);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/config-upsert
router.post('/config-upsert', auth, adminOnly, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key wajib diisi' });
    
    // Check if exists
    const { data: existing } = await supabase.from('config').select('key').eq('key', key).single();
    
    let result;
    if (existing) {
      result = await supabase.from('config').update({ value: String(value) }).eq('key', key);
    } else {
      result = await supabase.from('config').insert({ key, value: String(value) });
    }
    
    if (result.error) return res.status(400).json({ error: result.error.message });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;