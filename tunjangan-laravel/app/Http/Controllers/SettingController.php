<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SettingController extends Controller
{
    public function index()
    {
        $sheetUrl = Setting::where('key', 'google_sheet_url')->first()?->value;
        $masterData = Setting::where('key', 'master_data')->first()?->value;
        $masterData = $masterData ? json_decode($masterData, true) : null;

        return view('settings.index', compact('sheetUrl', 'masterData'));
    }

    public function update(Request $request)
    {
        Setting::updateOrCreate(['key' => 'google_sheet_url'], ['value' => $request->sheet_url]);
        return back()->with('success', 'Link Google Sheet berhasil disimpan.');
    }

    public function sync()
    {
        $sheetUrl = Setting::where('key', 'google_sheet_url')->first()?->value;
        if (!$sheetUrl) return back()->with('error', 'Link Google Sheet belum diatur.');

        try {
            // Kita coba ambil format CSV (Google Sheet Publish to Web as CSV)
            $response = Http::get($sheetUrl);
            if ($response->failed()) throw new \Exception("Gagal mengambil data dari Google Sheet.");

            $rows = explode("\n", $response->body());
            $allRows = [];
            $rsCount = 0;

            foreach ($rows as $index => $row) {
                if ($index === 0) continue; // Skip header
                $columns = str_getcsv($row);
                
                if (count($columns) >= 7) {
                    $allRows[] = [
                        'pt' => trim($columns[0] ?? ''),
                        'hospital' => trim($columns[1] ?? ''),
                        'instrument' => trim($columns[2] ?? ''),
                        'sn' => trim($columns[3] ?? ''),
                        'jenis_alat' => trim($columns[4] ?? ''),
                        'tech' => trim($columns[5] ?? ''),
                        'manager' => trim($columns[6] ?? ''),
                        'nickname_rs' => trim($columns[7] ?? ''),
                        'code_rs' => trim($columns[8] ?? ''),
                    ];

                    // Masukkan ke Master Lokasi / Rumah Sakit secara otomatis juga agar tidak perlu dobel input
                    $rsName = trim($columns[1] ?? ''); // LOKASI
                    $rsCode = trim($columns[8] ?? ''); // CODE RS
                    
                    if (!empty($rsName)) {
                        $rs = \App\Models\RumahSakit::firstOrCreate(
                            ['nama_rs' => $rsName]
                        );
                        if (!empty($rsCode) && $rs->kode_rs !== $rsCode) {
                            $rs->update(['kode_rs' => $rsCode]);
                        }
                        $rsCount++;
                    }
                }
            }

            Setting::updateOrCreate(['key' => 'master_data'], ['value' => json_encode($allRows)]);
            return back()->with('success', 'Data Master berhasil diupdate (' . count($allRows) . ' baris). Master Lokasi unik RS otomatis tersinkron.');

        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
}
