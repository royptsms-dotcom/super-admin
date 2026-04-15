<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'certificate_number',
        'serial_number',
        'pt_name',
        'instrument_name',
        'hospital_name',
        'technician_name',
        'supervisor_name',
        'calibration_date',
        'expiry_date',
        'result',
        'file_path',
    ];

    protected $casts = [
        'calibration_date' => 'date',
        'expiry_date' => 'date',
    ];
}
