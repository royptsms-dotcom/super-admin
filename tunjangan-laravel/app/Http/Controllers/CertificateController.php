<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Dompdf\Dompdf;
use Dompdf\Options;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $query = Certificate::query();
        
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('hospital_name', 'like', "%{$search}%")
                  ->orWhere('instrument_name', 'like', "%{$search}%")
                  ->orWhere('certificate_number', 'like', "%{$search}%");
            });
        }
        
        $certificates = $query->latest()->paginate(10)->withQueryString();
        return view('certificates.index', compact('certificates'));
    }

    public function create()
    {
        $year = date('Y');
        $month = date('n');
        
        // Roman Month Converter
        $romanMonths = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'];
        $romanMonth = $romanMonths[$month];

        // Fetch shared data from Setting
        $masterData = \App\Models\Setting::where('key', 'master_data')->first()?->value;
        $masterData = $masterData ? json_decode($masterData, true) : [];

        // We will pass the Roman Month and Year to JavaScript to build the ID
        $meta = [
            'roman_month' => $romanMonth,
            'year' => $year,
        ];

        return view('certificates.create', compact('masterData', 'meta'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'certificate_number' => 'required',
            'serial_number' => 'required',
            'pt_name' => 'required',
            'instrument_name' => 'required',
            'hospital_name' => 'required',
            'technician_name' => 'required',
            'supervisor_name' => 'required',
            'calibration_date' => 'required|date',
            'result' => 'required',
        ]);

        $calibrationDate = Carbon::parse($request->calibration_date);
        $expiryDate = $calibrationDate->copy()->addYear();

        $certificate = Certificate::create([
            'certificate_number' => $request->certificate_number,
            'serial_number' => $request->serial_number,
            'pt_name' => $request->pt_name,
            'instrument_name' => $request->instrument_name,
            'hospital_name' => $request->hospital_name,
            'technician_name' => $request->technician_name,
            'supervisor_name' => $request->supervisor_name,
            'calibration_date' => $calibrationDate,
            'expiry_date' => $expiryDate,
            'result' => $request->result,
        ]);

        return redirect()->route('certificates.index')->with('success', 'Sertifikat berhasil dibuat.');
    }

    public function getCount(Request $request)
    {
        // Cari sertifikat terakhir untuk kombinasi SN dan RS ini
        $latestCert = Certificate::where('serial_number', $request->sn)
                            ->where('hospital_name', $request->hospital)
                            ->orderBy('id', 'desc')
                            ->first();

        $nextSequence = 1;
        
        if ($latestCert && $latestCert->certificate_number) {
            // Ambil bagian pertama dari "005/SMS-CC/..." yaitu "005"
            $parts = explode('/', $latestCert->certificate_number);
            if (count($parts) > 0 && is_numeric($parts[0])) {
                $nextSequence = (int)$parts[0] + 1;
            } else {
                // Fallback jika formatnya diubah tapi tidak berupa angka di depan
                $count = Certificate::where('serial_number', $request->sn)
                                    ->where('hospital_name', $request->hospital)
                                    ->count();
                $nextSequence = $count + 1;
            }
        }
                            
        return response()->json(['count' => $nextSequence]);
    }

    public function destroy(Certificate $certificate)
    {
        $certificate->delete();
        return back()->with('success', 'Sertifikat berhasil dihapus.');
    }

    public function download(Certificate $certificate)
    {
        $fontDir = storage_path('fonts');
        if (!is_dir($fontDir)) mkdir($fontDir, 0755, true);

        $options = new Options();
        $options->set('fontDir', $fontDir);
        $options->set('fontCache', $fontDir);
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('chroot', base_path());

        $dompdf = new Dompdf($options);
        $html = view('certificates.pdf', compact('certificate'))->render();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $safeName = str_replace(['/', '\\'], '-', $certificate->certificate_number);
        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $safeName . '.pdf"',
        ]);
    }
}
