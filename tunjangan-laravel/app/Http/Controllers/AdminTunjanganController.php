<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ShareLokasi;
use App\Models\RumahSakit;
use App\Models\WaGroupMapping;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class AdminTunjanganController extends Controller
{
    public function karyawan()
    {
        $users = User::orderBy('employee_id')->get();
        $lastUser = User::orderByRaw('CAST(employee_id AS INTEGER) DESC')->first();
        $nextNum = $lastUser && is_numeric($lastUser->employee_id) ? intval($lastUser->employee_id) + 1 : 1;
        $nextId = sprintf("%03d", $nextNum);

        return view('admin.karyawan', compact('users', 'nextId'));
    }

    public function printKaryawan($id)
    {
        $user = User::findOrFail($id);
        return view('admin.print-nametag', compact('user'));
    }

    public function rekap(Request $request)
    {
        $bulan = $request->get('bulan', date('Y-m'));
        
        $shares = ShareLokasi::with('user', 'rumahSakit')
                  ->where('waktu_share', 'like', $bulan . '%')
                  ->orderBy('waktu_share', 'desc')
                  ->get();

        $lemburs = \App\Models\Lembur::with('user')
                    ->where('waktu_mulai', 'like', $bulan . '%')
                    ->where('status', 'submitted')
                    ->orderBy('waktu_mulai', 'desc')
                    ->get();

        // Grouping Data per User untuk Summary
        $usersGroups = User::whereHas('shareLokasi', function($q) use ($bulan){
            $q->where('waktu_share', 'like', $bulan . '%');
        })->orWhereHas('lembur', function($q) use ($bulan){
            $q->where('waktu_mulai', 'like', $bulan . '%')->where('status', 'submitted');
        })->get();

        $rekapData = $usersGroups->map(function($user) use ($shares, $lemburs) {
            $userShares = $shares->where('user_id', $user->id);
            $userLemburs = $lemburs->where('user_id', $user->id);
            
            return [
                'user' => $user,
                'total_share' => $userShares->count(),
                'total_lembur' => $userLemburs->count(),
                'total_biaya' => $userShares->sum('harga'),
                'details_share' => $userShares,
                'details_lembur' => $userLemburs
            ];
        });

        return view('admin.rekap', compact('rekapData', 'bulan'));
    }

    public function scanBarcode()
    {
        $mappings = WaGroupMapping::all();
        return view('admin.scan-barcode', compact('mappings'));
    }

    public function wagroup()
    {
        $mappings = WaGroupMapping::all();
        $jobs = User::whereNotNull('job')->where('job', '!=', '')->distinct()->orderBy('job')->pluck('job');
        return view('admin.wagroup', compact('mappings', 'jobs'));
    }

    public function masterLokasi()
    {
        $sheetUrl = Setting::where('key', 'map_google_sheet_url')->first()?->value;
        return view('admin.master-lokasi', compact('sheetUrl'));
    }

    public function masterLokasiStore(Request $request)
    {
        $request->validate(['sheet_url' => 'required|url']);
        Setting::updateOrCreate(['key' => 'map_google_sheet_url'], ['value' => $request->sheet_url]);
        return back()->with('success', 'Link Master Lokasi berhasil disimpan.');
    }

    public function masterSertifikat()
    {
        // Re-use logic from SettingController
        $sheetUrl = Setting::where('key', 'google_sheet_url')->first()?->value;
        $masterData = Setting::where('key', 'master_data')->first()?->value;
        $masterData = $masterData ? json_decode($masterData, true) : null;
        
        return view('settings.index', compact('sheetUrl', 'masterData'));
    }

    public function syncLokasi()
    {
        $sheetUrl = Setting::where('key', 'map_google_sheet_url')->first()?->value;
        if (!$sheetUrl) return back()->with('error', 'Link Google Sheet belum diatur.');

        try {
            $response = \Illuminate\Support\Facades\Http::get($sheetUrl);
            if ($response->failed()) throw new \Exception("Gagal mengambil data dari Google Sheet.");

            $rows = explode("\n", $response->body());
            $count = 0;

            // Clear old data for syncing if desired, or just update matching names. We will UpdateOrCreate.
            foreach ($rows as $index => $row) {
                if ($index === 0) continue; // Skip header
                $columns = str_getcsv($row);
                
                if (count($columns) >= 2) {
                    $namaRs = trim($columns[0]);
                    $kodeRs = trim($columns[1]);

                    if (!empty($namaRs)) {
                        RumahSakit::updateOrCreate(
                            ['nama_rs' => $namaRs],
                            ['kode_rs' => $kodeRs]
                        );
                        $count++;
                    }
                }
            }

            return back()->with('success', "Data Rumah Sakit berhasil disinkronisasi ($count baris).");

        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function storeKaryawan(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|unique:users,employee_id',
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required'
        ]);

        User::create([
            'employee_id' => $request->employee_id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'no_wa' => $request->no_wa,
            'job' => $request->job,
            'role' => $request->role ?? 'user'
        ]);

        return back()->with('success', 'Karyawan baru berhasil ditambahkan.');
    }

    public function destroyKaryawan($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return back()->with('success', 'Data Karyawan berhasil dihapus.');
    }

    public function updateKaryawan(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'employee_id' => "required|unique:users,employee_id,{$id}",
            'name' => 'required',
            'email' => "required|email|unique:users,email,{$id}",
        ]);

        $data = [
            'employee_id' => $request->employee_id,
            'name' => $request->name,
            'email' => $request->email,
            'no_wa' => $request->no_wa,
            'job' => $request->job,
            'role' => $request->role,
        ];

        if ($request->filled('password')) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        $user->update($data);

        return back()->with('success', 'Data Karyawan berhasil diperbarui.');
    }

    public function storeWagroup(Request $request)
    {
        $request->validate([
            'job_name' => 'required',
            'wa_group_id' => 'required'
        ]);
        
        // Menggunakan updateOrCreate agar jika job sudah ada, datanya diperbarui.
        // Tidak ada unique pada wa_group_id, sehingga 1 grup bisa dipakai banyak job.
        WaGroupMapping::updateOrCreate(
            ['job_name' => $request->job_name],
            [
                'wa_group_id' => $request->wa_group_id,
                'group_name' => $request->group_name
            ]
        );

        return back()->with('success', 'Berhasil update mapping WA Grup.');
    }

    public function destroyWagroup($id)
    {
        WaGroupMapping::findOrFail($id)->delete();
        return back()->with('success', 'Mapping WA Grup terhapus.');
    }

    public function startBot()
    {
        $nodeScript = base_path('wa-bot/index.js');
        // Script to run Node in background
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            pclose(popen("start /B cmd /C \"cd " . base_path('wa-bot') . " && node index.js\"", "r"));
        } else {
            exec("cd " . base_path('wa-bot') . " && node index.js > /dev/null 2>&1 &");
        }
        return response()->json(['success' => true]);
    }
}
