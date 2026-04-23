<?php

namespace App\Http\Controllers;

use App\Models\Lembur;
use App\Models\RumahSakit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class LemburController extends Controller
{
    /**
     * TAHAP 1: Simpan Foto & Koordinat (Draft)
     */
    public function apiFoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image',
            'rs_id' => 'required',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $user = $request->user();
        
        // Simpan Foto ke Storage
        $path = $request->file('foto')->store('uploads/lembur', 'public');

        $lembur = Lembur::create([
            'user_id' => $user->id,
            'rs_id' => $request->rs_id,
            'foto_url' => $path,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'waktu_mulai' => $request->waktu_foto ? Carbon::parse($request->waktu_foto) : Carbon::now(),
            'status' => 'draft',
            'wa_group_id' => $request->wa_group_id // Disimpan jika ada kiriman dari Sistem 2
        ]);

        return response()->json([
            'success' => true,
            'lembur_id' => $lembur->id,
            'message' => 'Foto draft berhasil disimpan'
        ]);
    }

    /**
     * TAHAP 2: Final Submit & Forward ke WhatsApp
     */
    public function apiSubmit(Request $request)
    {
        \Log::info('MASUK API LEMBUR SUBMIT', $request->all());

        $request->validate([
            'lembur_id' => 'required',
            'keterangan' => 'required',
        ]);

        $user = $request->user();
        $lembur = Lembur::findOrFail($request->lembur_id);
        $rs = RumahSakit::find($lembur->rs_id);

        // 1. UPDATE LAPORAN UTAMA (SENDER)
        $lembur->update([
            'waktu_selesai' => Carbon::now(),
            'keterangan' => $request->keterangan,
            'tagged_user_ids' => json_encode($request->tagged_user_ids),
            'status' => 'submitted'
        ]);

        // 2. SIMPAN LAPORAN DUPLIKAT UNTUK REKAN (MODUL KERJA BARENG)
        if ($request->has('tagged_user_ids') && is_array($request->tagged_user_ids)) {
            foreach ($request->tagged_user_ids as $taggedId) {
                Lembur::create([
                    'user_id' => $taggedId,
                    'rs_id' => $lembur->rs_id,
                    'foto_url' => $lembur->foto_url,
                    'latitude' => $lembur->latitude,
                    'longitude' => $lembur->longitude,
                    'waktu_mulai' => $lembur->waktu_mulai,
                    'waktu_selesai' => Carbon::now(),
                    'keterangan' => $request->keterangan . " (Bersama: " . $user->name . ")",
                    'status' => 'submitted'
                ]);
            }
        }

        // 3. PROSES FORWARD WHATSAPP (SMART SESSION)
        $sessionId = 'report_bot';
        try {
            $resCheck = Http::timeout(1)->get("http://localhost:3001/api/wa/qr/user_{$user->id}");
            if ($resCheck->json('status') === 'connected') {
                $sessionId = "user_{$user->id}";
            }
        } catch (\Exception $e) {}

        $targetGroup = $request->wa_group_id ?? $lembur->wa_group_id; 

        // 4. LOGIC TARGET GROUP (PRIORITASKAN HP)
        if (!$targetGroup || strlen($targetGroup) < 5) {
            $mapping = \App\Models\WaGroupMapping::where('job_name', $user->job)->first();
            $targetGroup = $mapping ? $mapping->wa_group_id : '628000000000-0000@g.us';
        }

        $waktuStr = Carbon::parse($lembur->waktu_mulai)->timezone('Asia/Jakarta')->format('l, d F Y H:i');
        $mapsUrl = "https://maps.google.com/?q={$lembur->latitude},{$lembur->longitude}";
        
        $tagText = "";
        if ($request->has('tagged_user_ids') && is_array($request->tagged_user_ids)) {
            $names = User::whereIn('id', $request->tagged_user_ids)->pluck('name')->toArray();
            if (count($names) > 0) $tagText = "\n👥 *Bersama:* " . implode(", ", $names);
        }

        try {
            // Konstruksi URL Foto (Agar Bot bisa download fotonya)
            $imageUrl = $lembur->foto_url ? url('storage/' . $lembur->foto_url) : null;

            // Data untuk Watermark (Sesuai permintaan: Lokasi, Koordinat, Waktu, Note)
            $watermark = [
                'location' => $rs->nama_rs ?? 'Unknown RS',
                'lat'      => $lembur->latitude,
                'lng'      => $lembur->longitude,
                'time'     => Carbon::parse($lembur->waktu_mulai)->timezone('Asia/Jakarta')->format('d/m/Y H:i'),
                'note'     => "Captured by GPS Map Camera"
            ];

            // Pesan Caption (Tanpa Nama RS di awal teks pesan karena sudah ada di foto)
            $caption = "👤 *Nama:* {$user->name}{$tagText}\n📝 *Ket:* {$request->keterangan}";

            // Kirim ke Microservice Node.js
            $resWa = Http::timeout(10)->post('http://127.0.0.1:3001/api/wa/send', [
                'sessionId' => $sessionId,
                'to'        => $targetGroup,
                'text'      => $caption,
                'imageUrl'  => $imageUrl,
                'watermark' => $watermark
            ]);
            
            if (!$resWa->successful()) {
                \Log::error("WA Lembur Failed: " . $resWa->body());
            }
        } catch (\Exception $e) {
            \Log::error("WA Lembur Error: " . $e->getMessage());
            return response()->json(['error' => 'Gagal sistem WA: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan lembur berhasil dikirim!'
        ]);
    }
}
