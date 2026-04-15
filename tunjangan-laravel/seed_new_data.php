<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

try {
    // 1. Bersihkan tabel users
    DB::table('users')->delete();
    echo "Tabel Users dikosongkan.\n";

    // 2. Tambah Data Baru (JOSS)
    $pass = Hash::make('123456');

    User::create([
        'employee_id' => '001',
        'name'        => 'Admin Utama',
        'email'       => 'admin@gmail.com',
        'password'    => $pass,
        'role'        => 'admin',
        'job'         => 'OPERATOR'
    ]);

    User::create([
        'employee_id' => '002',
        'name'        => 'devis',
        'email'       => 'devis@gmail.com',
        'password'    => $pass,
        'role'        => 'user',
        'job'         => 'TEKNISI'
    ]);

    User::create([
        'employee_id' => '003',
        'name'        => 'wahid',
        'email'       => 'wahid@gmail.com',
        'password'    => $pass,
        'role'        => 'user',
        'job'         => 'TEKNISI'
    ]);

    echo "Data Baru Berhasil Masuk (002 SEKARANG DEVIS).\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
