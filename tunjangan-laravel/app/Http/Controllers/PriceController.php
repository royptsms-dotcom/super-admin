<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RumahSakit;
use App\Models\Setting;

class PriceController extends Controller
{
    public function index()
    {
        $rumahSakit = RumahSakit::orderBy('nama_rs')->get();
        
        // General Prices
        $prices = [
            'harga_lembur_per_jam' => Setting::where('key', 'harga_lembur_per_jam')->first()?->value ?? 0,
            'max_nominal_lembur' => Setting::where('key', 'max_nominal_lembur')->first()?->value ?? 0,
            'harga_standby_minggu' => Setting::where('key', 'harga_standby_minggu')->first()?->value ?? 0,
            'harga_standby_biasa' => Setting::where('key', 'harga_standby_biasa')->first()?->value ?? 0,
        ];

        return view('admin.harga', compact('rumahSakit', 'prices'));
    }

    public function updateRS(Request $request)
    {
        $prices = $request->input('rs_prices', []);

        foreach ($prices as $id => $price) {
            RumahSakit::where('id', $id)->update(['harga_share_lokasi' => $price]);
        }

        return back()->with('success', 'Harga per Rumah Sakit berhasil diperbarui.');
    }

    public function updateGeneral(Request $request)
    {
        $data = $request->only([
            'harga_lembur_per_jam',
            'max_nominal_lembur',
            'harga_standby_minggu',
            'harga_standby_biasa'
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return back()->with('success', 'Harga umum berhasil diperbarui.');
    }
}
