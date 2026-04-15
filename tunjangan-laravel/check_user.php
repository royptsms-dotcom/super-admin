<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'admin@gmail.com')->first();
if ($user) {
    $user->password = \Illuminate\Support\Facades\Hash::make('admin123');
    $user->save();
    echo "SUCCESS: PW Admin direset ke admin123\n";
} else {
    echo "Admin not found\n";
}
