<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $row) {
            $row->id();
            $row->string('certificate_number')->unique();
            $row->string('pt_name');
            $row->string('instrument_name');
            $row->string('hospital_name');
            $row->string('technician_name');
            $row->string('supervisor_name');
            $row->date('calibration_date');
            $row->date('expiry_date');
            $row->string('file_path')->nullable();
            $row->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
