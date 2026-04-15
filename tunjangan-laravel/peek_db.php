<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
print_r($tables);

foreach($tables as $t) {
    if ($t->name == 'hospitals' || $t->name == 'rumah_sakit' || $t->name == 'locations') {
        echo "\nIsi Tabel " . $t->name . ":\n";
        print_r(DB::table($t->name)->limit(5)->get());
    }
}
