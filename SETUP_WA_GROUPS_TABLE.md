# Cara Membuat Tabel wa_group_mappings di Supabase

## Langkah 1: Buka Supabase Dashboard
1. Pergi ke https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project yang sesuai

## Langkah 2: Buka SQL Editor
1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik **"New Query"** atau **"+ New"**

## Langkah 3: Copy & Paste SQL Script

Buka file `/migrations/create-wa-group-mappings.sql` dan copy seluruh isinya.

Paste ke SQL Editor di Supabase, kemudian klik **"RUN"** atau tekan `Ctrl+Enter`

## Atau Manual via Supabase UI

Jika ingin membuat via UI:

1. Klik **"Table Editor"** di sidebar
2. Klik **"+ New Table"**
3. Nama table: `wa_group_mappings`
4. Toggle "Enable RLS" → **ON**
5. Klik **"Create Table"**

### Tambah Kolom:
- **id** - UUID (Primary Key) - `gen_random_uuid()`
- **job_id** - UUID - Foreign Key ke `jobs(id)` - Required
- **wa_group_id** - Text - Unique - Required
- **group_name** - Text - Optional
- **created_at** - Timestamp - `now()` - Timezone: "Asia/Jakarta"
- **updated_at** - Timestamp - `now()` - Timezone: "Asia/Jakarta"

### Enable RLS Policies:

Di tab **"RLS Policies"**, tambah policies:

#### Policy 1: SELECT
```
Role: authenticated
Using expression: auth.jwt() ->> 'role' = 'admin'
```

#### Policy 2: INSERT
```
Role: authenticated
With check: auth.jwt() ->> 'role' = 'admin'
```

#### Policy 3: UPDATE
```
Role: authenticated
Using expression: auth.jwt() ->> 'role' = 'admin'
```

#### Policy 4: DELETE
```
Role: authenticated
Using expression: auth.jwt() ->> 'role' = 'admin'
```

## Verifikasi di Aplikasi

1. Refresh admin dashboard
2. Klik **"Grup WA"** di sidebar
3. Seharusnya error message hilang
4. Jika masih ada error, cek:
   - Browser Console (`F12` → Console tab)
   - Backend logs
   - Supabase RLS policies

## Troubleshooting

### Error: "Could not find the table 'public.wa_group_mappings'"
**Solusi**: Jalankan SQL script di Supabase SQL Editor

### Error: "Permission denied"
**Solusi**: Pastikan RLS policies sudah benar dan token admin valid

### Tabel kosong tapi tidak error
**Solusi**: Normal! Database masih kosong. Coba tambah grup WA pertama dengan klik "+ Tambahkan Grup"

## Testing

Coba tambah grup WA baru:
1. Klik "+ Tambahkan Grup"
2. Pilih job
3. Masukkan WA Group ID Anda (misal: `120363043556880620@g.us`)
4. Klik "Simpan Grup"
5. Seharusnya muncul di tabel
