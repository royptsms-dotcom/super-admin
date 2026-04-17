<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Session;
use App\Models\Employee;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function index()
    {
        $attendanceData = Session::get('attendanceData');
        $selectedMonth = Session::get('selectedMonth');
        return view('admin.absensi.rekap', compact('attendanceData', 'selectedMonth'));
    }


    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required',
            'month_year' => 'required'
        ]);

        $settingsPath = storage_path('app/attendance_settings.json'); // Renamed to avoid overlap
        $settings = file_exists($settingsPath) ? json_decode(file_get_contents($settingsPath), true) : ['check_in_limit' => '08:00', 'check_out_limit' => '17:00'];
        
        $checkInLimit = $settings['check_in_limit'];
        $checkOutLimit = $settings['check_out_limit'];

        $file = $request->file('file');
        
        try {
            $filePath = $file->getRealPath();
            $spreadsheet = null;
            
            // List all potential readers
            $readers = ['Xlsx', 'Xls', 'Csv', 'Html', 'Xml'];

            foreach ($readers as $type) {
                try {
                    $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReader($type);
                    
                    if ($type == 'Csv') {
                        // Detect delimiter for CSV files
                        $handle = fopen($filePath, 'r');
                        $firstLine = fgets($handle);
                        fclose($handle);
                        
                        $delimiters = [",", "\t", ";", "|"];
                        $bestDelimiter = ",";
                        $maxCount = 0;
                        foreach ($delimiters as $d) {
                            $count = substr_count($firstLine, $d);
                            if ($count > $maxCount) {
                                $maxCount = $count;
                                $bestDelimiter = $d;
                            }
                        }
                        $reader->setDelimiter($bestDelimiter);
                    }
                    
                    if ($reader->canRead($filePath)) {
                        $reader->setReadDataOnly(true);
                        $spreadsheet = $reader->load($filePath);
                        break; 
                    }
                } catch (\Exception $e) { continue; }
            }

            if (!$spreadsheet) {
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
            }

            // Read all sheets
            $data = [];
            foreach ($spreadsheet->getAllSheets() as $sheet) {
                $data[] = $sheet->toArray();
            }
        } catch (\Exception $e) {
            return redirect()->route('admin.absensi.rekap')->with('error', 'File tidak bisa dibaca: ' . $e->getMessage());
        }

        $selectedMonthYear = $request->month_year; 
        $attendanceData = [];
        $totalRecordsFound = 0;

        foreach ($data as $rows) {
            if (count($rows) <= 1) continue; 

            // DETEKSI KOLOM OTOMATIS
            $colName = -1;
            $colId = -1;
            $colTime = -1;
            $colDept = -1;

            for ($h = 0; $h < min(15, count($rows)); $h++) {
                if (!is_array($rows[$h])) continue;
                foreach ($rows[$h] as $idx => $cell) {
                    if (is_null($cell)) continue;
                    $cellLower = strtolower(trim($cell));
                    
                    if ($cellLower === 'id' || $cellLower === 'pin' || $cellLower === 'nik' || $cellLower === 'nip' || 
                        $cellLower === 'no.id' || $cellLower === 'no id' || $cellLower === 'userid' || $cellLower === 'no. id' ||
                        $cellLower === 'karyawan id' || $cellLower === 'id karyawan' || $cellLower === 'no. pin') {
                        $colId = $idx;
                    } 
                    elseif ($colId == -1 && ($cellLower === 'no.' || $cellLower === 'no' || str_contains($cellLower, 'id') || str_contains($cellLower, 'pin'))) {
                        if (!str_contains($cellLower, 'lokasi') && !str_contains($cellLower, 'device')) {
                            $colId = $idx;
                        }
                    }

                    if ($colName == -1 && (str_contains($cellLower, 'nama') || $cellLower === 'name')) {
                        $colName = $idx;
                    }

                    if ($colTime == -1 && (str_contains($cellLower, 'waktu') || str_contains($cellLower, 'jam') || str_contains($cellLower, 'tanggal') || str_contains($cellLower, 'time') || str_contains($cellLower, 'date') || str_contains($cellLower, 'tgl'))) {
                        $colTime = $idx;
                    }

                    if ($colDept == -1 && (str_contains($cellLower, 'dept') || str_contains($cellLower, 'departemen') || str_contains($cellLower, 'bagian'))) {
                        $colDept = $idx;
                    }
                }
                
                if ($colId != -1 && $colName != -1 && $colTime != -1) {
                    $startRow = $h + 1;
                    break;
                }
            }

            if ($colName == -1) $colName = 1;
            if ($colId == -1) $colId = 2; 
            if ($colTime == -1) $colTime = 3;
            if ($colDept == -1) $colDept = 0;

            $startRow = isset($startRow) ? $startRow : 0;

            $emptyCounter = 0;
            for ($i = $startRow; $i < count($rows); $i++) {
                $name = $rows[$i][$colName] ?? null; 
                $id = $rows[$i][$colId] ?? null;
                $dateTimeStr = $rows[$i][$colTime] ?? null; 

                if (is_null($name) && is_null($dateTimeStr)) {
                    $emptyCounter++;
                    if ($emptyCounter > 30) break; 
                    continue;
                }
                $emptyCounter = 0;

                if (strtolower(trim($name)) == 'nama' || strtolower(trim($name)) == 'nama karyawan' || str_contains(strtolower($name), 'tanggal')) continue;

                try {
                    $dateObj = null;
                    if (is_numeric($dateTimeStr)) {
                        $dateObj = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateTimeStr);
                    } else {
                        try {
                            if (str_contains($dateTimeStr, '/')) {
                                $dateObj = Carbon::createFromFormat('d/m/Y H:i:s', $dateTimeStr);
                            } else {
                                $dateObj = Carbon::parse($dateTimeStr);
                            }
                        } catch (\Exception $e) {
                            try {
                                if (str_contains($dateTimeStr, '/')) {
                                    $dateObj = Carbon::createFromFormat('d/m/Y H:i', $dateTimeStr);
                                } else {
                                    $dateObj = Carbon::parse($dateTimeStr);
                                }
                            } catch (\Exception $e) {
                                try {
                                    $dateObj = Carbon::parse($dateTimeStr);
                                } catch (\Exception $e) { continue; }
                            }
                        }
                    }

                    if (!$dateObj) continue;

                    $recordMonthYear = $dateObj->format('Y-m');
                    if ($recordMonthYear !== $selectedMonthYear) continue;

                    $totalRecordsFound++;
                    $dateKey = $dateObj->format('Y-m-d');
                    
                    $name = ucwords(strtolower(trim($name ?? '')));
                    if (empty($name)) continue;

                    $id = trim($id ?? '');
                    if ($id === '' || $id === '-') {
                        foreach ($attendanceData as $keyAttempt => $existing) {
                            if ($existing['name'] === $name && !empty($existing['id']) && $existing['id'] !== '-') {
                                $id = $existing['id'];
                                break;
                            }
                        }
                        
                        if (empty($id) || $id === '-') {
                            foreach ($rows[$i] as $idx => $val) {
                                if ($idx !== $colTime && !empty($val) && is_numeric($val) && strlen($val) < 15) {
                                    $id = trim($val);
                                    break;
                                }
                            }
                        }
                    }
                    
                    $dept = trim($rows[$i][$colDept] ?? '-'); 
                    $key = $name . '_' . $id;

                    if (!isset($attendanceData[$key])) {
                        if (!empty($id)) {
                            Employee::updateOrCreate(
                                ['employee_id' => $id],
                                ['name' => $name, 'department' => $dept]
                            );
                        }

                        $attendanceData[$key] = [
                            'id' => $id,
                            'name' => $name,
                            'department' => $dept,
                            'present_days' => [], 
                            'present' => 0,
                            'late' => 0,
                            'out' => 0,
                        ];
                    }

                    $currentTime = $dateObj->format('H:i:s');
                    $isMorning = $currentTime < '12:00:00';
                    
                    if (!isset($attendanceData[$key]['present_days'][$dateKey])) {
                        $attendanceData[$key]['present_days'][$dateKey] = [
                            'first' => $isMorning ? $currentTime : '-',
                            'last' => !$isMorning ? $currentTime : '-'
                        ];
                        $attendanceData[$key]['present']++;
                    } else {
                        if ($isMorning) {
                            if ($attendanceData[$key]['present_days'][$dateKey]['first'] == '-' || $currentTime < $attendanceData[$key]['present_days'][$dateKey]['first']) {
                                $attendanceData[$key]['present_days'][$dateKey]['first'] = $currentTime;
                            }
                        } else {
                            if ($attendanceData[$key]['present_days'][$dateKey]['last'] == '-' || $currentTime > $attendanceData[$key]['present_days'][$dateKey]['last']) {
                                $attendanceData[$key]['present_days'][$dateKey]['last'] = $currentTime;
                            }
                        }
                    }

                } catch (\Exception $e) { continue; }
            }
        }


        if ($totalRecordsFound === 0) {
            return redirect()->route('admin.absensi.rekap')->with('error', "File terbaca, tapi tidak ada data yang cocok untuk bulan $selectedMonthYear.");
        }

        $finalData = collect($attendanceData)->map(function($item) use ($checkInLimit, $checkOutLimit) {
            foreach ($item['present_days'] as $day) {
                if ($day['first'] !== '-' && $day['first'] > $checkInLimit . ':00') {
                    $item['late']++;
                }
                if ($day['last'] !== '-' && $day['last'] >= $checkOutLimit . ':00') {
                    $item['out']++;
                }
            }
            return $item;
        })->sortBy('id')->values()->toArray();

        Session::put('attendanceData', $finalData);
        Session::put('selectedMonth', $selectedMonthYear);

        return redirect()->route('admin.absensi.rekap');
    }


    public function export(Request $request)
    {
        $dataEncoded = $request->query('data');
        if (!$dataEncoded) return redirect()->back();

        $attendanceData = unserialize(base64_decode($dataEncoded));
        
        return Excel::download(new class($attendanceData) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithMapping {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { return ['ID', 'NAMA KARYAWAN', 'HADIR', 'TERLAMBAT', 'PULANG']; }
            public function map($row): array
            {
                return [
                    $row['id'],
                    $row['name'],
                    $row['present'] . ' hari',
                    $row['late'],
                    $row['out']
                ];
            }
        }, 'rekap_absensi_' . date('Ymd_His') . '.xlsx');
    }

    public function exportDetail(Request $request)
    {
        $dataJson = $request->query('data');
        if (!$dataJson) return redirect()->back();

        $employee = json_decode(base64_decode($dataJson), true);
        
        $settingsPath = storage_path('app/attendance_settings.json');
        $settings = file_exists($settingsPath) ? json_decode(file_get_contents($settingsPath), true) : ['check_in_limit' => '08:00', 'check_out_limit' => '17:00'];

        return Excel::download(new class($employee, $settings) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithMapping {
            protected $employee;
            protected $settings;

            public function __construct($employee, $settings) { 
                $this->employee = $employee; 
                $this->settings = $settings;
            }
            
            public function collection() { 
                $days = $this->employee['present_days'];
                ksort($days);
                return collect($days)->map(function($times, $date) {
                    return array_merge(['date' => $date], $times);
                });
            }

            public function headings(): array { return ['TANGGAL', 'JAM MASUK', 'JAM PULANG', 'STATUS']; }
            public function map($row): array
            {
                $isSaturday = Carbon::parse($row['date'])->isSaturday();
                $limit = $isSaturday ? ($this->settings['saturday_in_limit'] ?? '08:00') : ($this->settings['check_in_limit'] ?? '08:00');
                
                $status = 'Tepat Waktu';
                if ($row['first'] == '-') {
                    $status = 'Tidak Absen Masuk';
                } elseif ($row['first'] > $limit . ':00') {
                    $status = 'Terlambat';
                }

                $tanggalTeks = $row['date'] . ($isSaturday ? ' (Sabtu)' : '');
                return [$tanggalTeks, $row['first'], $row['last'], $status];
            }
        }, 'detail_absensi_' . str_replace(' ', '_', $employee['name']) . '_' . date('Ymd') . '.xlsx');
    }
}
