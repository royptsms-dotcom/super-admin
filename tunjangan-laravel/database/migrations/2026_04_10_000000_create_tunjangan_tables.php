<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambahan fitur untuk Karyawan (pada tabel bawaan users)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('user');
            }
            if (!Schema::hasColumn('users', 'job')) {
                $table->string('job')->nullable();
            }
            if (!Schema::hasColumn('users', 'no_wa')) {
                $table->string('no_wa')->nullable();
            }
        });

        Schema::create('rumah_sakit', function (Blueprint $table) {
            $table->id();
            $table->string('nama_rs');
            $table->decimal('harga_share_lokasi', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('share_lokasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('rs_id')->nullable()->constrained('rumah_sakit')->onDelete('set null');
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
            $table->text('keterangan')->nullable();
            $table->decimal('harga', 12, 2)->default(0);
            $table->string('status_wa')->default('pending');
            $table->timestamp('waktu_share')->useCurrent();
            $table->timestamps();
        });

        Schema::create('tag_share_lokasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('share_lokasi_id')->constrained('share_lokasi')->onDelete('cascade');
            $table->foreignId('tagged_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('wa_group_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('job_name')->unique(); // contoh: 'Cleaning Service'
            $table->string('wa_group_id');
            $table->string('group_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_group_mappings');
        Schema::dropIfExists('tag_share_lokasi');
        Schema::dropIfExists('share_lokasi');
        Schema::dropIfExists('rumah_sakit');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'job', 'no_wa']);
        });
    }
};
