<?php

namespace App\Http\Controllers;

use App\Models\Standby;
use App\Models\WaGroupMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class StandbyController extends Controller
{
    public function statusHariIni(Request $request)
    {
        $user = $request->user();
        $today = Carbon::now()->toDateString();
        
        $standby = Standby::where('user_id', $user->id)
                          ->where('tanggal', $today)
                          ->first();

        if (!$standby) {
            return response()->json(['error' => 'Belum ada standby'], 404);
        }
                          
        return response()->json($standby);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $today = Carbon::now()->toDateString();

        // Validasi double
        $exists = Standby::where('user_id', $user->id)
                         ->where('tanggal', $today)
                         ->exists();
        
        if ($exists) {
            return response()->json(['error' => 'Kamu sudah apply standby untuk hari ini'], 400);
        }

        $hariIni = Carbon::now()->dayOfWeek; // 0=Sunday
        $jenis = ($hariIni === 0) ? 'minggu' : 'hari_raya';

        $standby = Standby::create([
            'user_id' => $user->id,
            'tanggal' => $today,
            'jenis_standby' => $jenis,
            'status_wa' => 'pending'
        ]);

        // --- FORWARD WHATSAPP ---
        $sessionId = 'report_bot';
        try {
            $resCheck = Http::timeout(1)->get("http://localhost:3001/api/wa/qr/user_{$user->id}");
            if ($resCheck->json('status') === 'connected') {
                $sessionId = "user_{$user->id}";
            }
        } catch (\Exception $e) {}
        
        // Ambil Mapping Grup berdasar Jabatan
        $mapping = WaGroupMapping::where('job_name', $user->job)->first();
        $targetGroup = $mapping ? $mapping->wa_group_id : '628000000000-0000@g.us';

        $jenisLabel = $jenis === 'minggu' ? 'HARI MINGGU' : 'HARI RAYA / LIBUR';
        $waktuFormatted = Carbon::now()->timezone('Asia/Jakarta')->format('l, d F Y H:i');
        
        $text = "🟢 *APPLY STANDBY (MOBILE)*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Nama:* {$user->name}\n📅 *Jenis:* {$jenisLabel}\n🕐 *Waktu:* {$waktuFormatted}\n📌 *Status:* AKTIF\n━━━━━━━━━━━━━━━━━━━━";

        try {
            $resWa = Http::timeout(5)->post('http://127.0.0.1:3001/api/wa/send', [
                'sessionId' => $sessionId,
                'to' => $targetGroup,
                'text' => $text
            ]);

            if ($resWa->successful()) {
                $standby->update(['status_wa' => 'sent']);
            }
        } catch (\Exception $e) {
            \Log::error("WA Standby Error: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Standby berhasil diapply!'
        ]);
    }
}
