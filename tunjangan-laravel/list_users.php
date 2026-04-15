<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::all();
echo "Total Users: " . $users->count() . "\n";
echo "--------------------------------------------------\n";
foreach ($users as $u) {
    echo "ID: " . $u->employee_id . " | Email: " . $u->email . " | Role: " . $u->role . "\n";
    // Cek apakah password ter-hash (biasanya mulai dengan $2y$)
    $isHashed = (strpos($u->password, '$2y$') === 0 || strpos($u->password, '$2a$') === 0);
    echo "Password Hashed: " . ($isHashed ? 'YES' : 'NO (PLANTEXT!!)') . "\n";
    echo "--------------------------------------------------\n";
}
