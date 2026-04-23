<?php
namespace App\Http\Controllers;

use App\Models\RumahSakit;
use App\Models\ShareLokasi;
use App\Models\WaGroupMapping;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ShareLokasiController extends Controller
{
    public function create()
    {
        $rumahSakit = RumahSakit::where('is_active', true)->get();
        
        // Auto-Generate Dummy Data RS jika tabel masih kosong perdana
        if ($rumahSakit->isEmpty()) {
            RumahSakit::create(['nama_rs' => 'RSUP Test Demo', 'harga_share_lokasi' => 150000]);
            RumahSakit::create(['nama_rs' => 'RSUD Jakarta', 'harga_share_lokasi' => 200000]);
            $rumahSakit = RumahSakit::where('is_active', true)->get();
        }

        return view('share-lokasi.create', compact('rumahSakit'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'rs_id' => 'required',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $rs = RumahSakit::find($request->rs_id);

        // Simulasi Auth ID (jika login belum sempurna, kita set default ke 1)
        $userId = auth()->id() ?? 1;
        $user = User::find($userId);
        
        // Buat data sementara agar tidak error saat testing jika tabel users kosong
        if (!$user) {
            $user = User::create([
                'name' => 'Demo Karyawan',
                'email' => 'demo@example.com',
                'password' => bcrypt('password'),
                'job' => 'Teknisi',
                'no_wa' => '628123456789'
            ]);
            $userId = $user->id;
        }

        $share = ShareLokasi::create([
            'user_id' => $userId, 
            'rs_id' => $rs->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'keterangan' => $request->keterangan,
            'harga' => $rs->harga_share_lokasi ?? 0,
            'status_wa' => 'pending',
        ]);

        // Cari grup WA berdasar job user
        $groupId = null;
        if ($user->job) {
             // Contoh kita hardcode fallback jika belum di set:
             $mapping = WaGroupMapping::where('job_name', $user->job)->first();
             if ($mapping) {
                 $groupId = $mapping->wa_group_id;
             }
        }

        // Panggil Node.js Microservice untuk kirim Multi-Session WA
        // Nama Sesi kita buat dinamis sesuai ID user (Misal: user_1)
        $sessionId = 'user_' . $userId;
        $fallbackGroup = '628000000000-0000@g.us'; // Dummy group kalo mapping kosong

        $targetGroup = $groupId ? $groupId : $fallbackGroup;
        
        $waktu = \Carbon\Carbon::now()->timezone('Asia/Jakarta')->format('l, d F Y H:i:s');
        $mapsUrl = "https://maps.google.com/?q={$request->latitude},{$request->longitude}";
        $text = "📍 *SHARE LOKASI*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Nama:* {$user->name}\n🏥 *Lokasi RS:* {$rs->nama_rs}\n🕐 *Waktu:* {$waktu}\n📝 *Keterangan:* ".($request->keterangan ?? '-')."\n━━━━━━━━━━━━━━━━━━━━\n🗺️ *Maps:* {$mapsUrl}";

        try {
            $response = Http::timeout(5)->post('http://127.0.0.1:3001/api/wa/send', [
                'sessionId' => $sessionId,
                'to' => $targetGroup,
                'text' => $text
            ]);

            if ($response->successful()) {
                $share->update(['status_wa' => 'sent']);
            } else {
                // Berarti bot belum scan QR atau eror
                $share->update(['status_wa' => 'failed_auth']);
            }
        } catch (\Exception $e) {
            $share->update(['status_wa' => 'failed_server']);
        }

        return redirect()->back()->with('success', 'Sip! Lokasi berhasil dilaporkan. (Status WA: ' . $share->status_wa . ')');
    }

    public function apiStore(Request $request)
    {
        \Log::info('MASUK API STORE', $request->all());
        $request->validate([
            'rs_id' => 'required',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $user = $request->user();
        $rs = RumahSakit::find($request->rs_id);

        if (!$rs) return response()->json(['error' => 'Data RS tidak ditemukan'], 404);

        // 1. SIMPAN LAPORAN UTAMA (SENDER)
        $share = ShareLokasi::create([
            'user_id' => $user->id,
            'rs_id' => $rs->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'keterangan' => $request->keterangan,
            'harga' => $rs->harga_share_lokasi ?? 0,
            'status_wa' => 'pending',
        ]);

        // 2. SIMPAN LAPORAN DUPLIKAT UNTUK REKAN YANG DITAG (MODUL KERJA BARENG)
        if ($request->has('tagged_user_ids') && is_array($request->tagged_user_ids)) {
            foreach ($request->tagged_user_ids as $taggedId) {
                // Simpan record share_lokasi buat si rekan
                ShareLokasi::create([
                    'user_id' => $taggedId,
                    'rs_id' => $rs->id,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'keterangan' => $request->keterangan . " (Bersama: " . $user->name . ")",
                    'harga' => $rs->harga_share_lokasi ?? 0,
                    'status_wa' => 'auto-tagged', // Ditandai auto agar tidak bingung
                ]);

                // Simpan juga ke tabel tag_share_lokasi (opsional untuk audit)
                \DB::table('tag_share_lokasi')->insert([
                    'share_lokasi_id' => $share->id,
                    'tagged_user_id' => $taggedId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. LOGIC WA (SMART SESSION)
        $sessionId = 'report_bot';
        try {
            $resCheck = Http::timeout(1)->get("http://localhost:3001/api/wa/qr/user_{$user->id}");
            if ($resCheck->json('status') === 'connected') {
                $sessionId = "user_{$user->id}";
            }
        } catch (\Exception $e) {}

        // 4. LOGIC TARGET GROUP (PRIORITASKAN HP)
        $targetGroup = $request->wa_group_id;

        // Jika HP tidak kirim ID Grup (belum scan), baru cari di mapping jabatan
        if (!$targetGroup || strlen($targetGroup) < 5) {
            $mapping = WaGroupMapping::where('job_name', $user->job)->first();
            $targetGroup = $mapping ? $mapping->wa_group_id : '628000000000-0000@g.us';
        }

        $waktu = \Carbon\Carbon::now()->timezone('Asia/Jakarta')->format('l, d F Y H:i:s');
        $mapsUrl = "https://maps.google.com/?q={$request->latitude},{$request->longitude}";
        
        $tagText = "";
        if ($request->has('tagged_user_ids')) {
            $names = User::whereIn('id', $request->tagged_user_ids)->pluck('name')->toArray();
            if (count($names) > 0) $tagText = "\n👥 *Bersama:* " . implode(", ", $names);
        }

        $text = ($rs->nama_rs ?? 'Lokasi') . "\n" . ($request->keterangan ?? '') . ($tagText ? " " . $tagText : "");

        try {
            $resWa = Http::timeout(5)->post('http://127.0.0.1:3001/api/wa/send', [
                'sessionId' => $sessionId,
                'to' => $targetGroup,
                'text' => $text,
                'location' => [
                    'latitude' => (float) $request->latitude,
                    'longitude' => (float) $request->longitude
                ]
            ]);
            
            if ($resWa->successful()) {
                $share->update(['status_wa' => 'sent']);
            } else {
                \Log::error("WA Send Failed: " . $resWa->body());
                $share->update(['status_wa' => 'failed_auth']);
            }
        } catch (\Exception $e) {
            \Log::error("WA Server Error: " . $e->getMessage());
            $share->update(['status_wa' => 'failed_server']);
            return response()->json(['error' => 'Gagal sistem: ' . $e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'message' => 'Laporan lokasi berhasil dikirim!']);
    }
}
