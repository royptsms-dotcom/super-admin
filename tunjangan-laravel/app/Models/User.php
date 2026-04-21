<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'name',
        'email',
        'password',
        'no_wa',
        'job',
        'wa_group_id',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function shareLokasi()
    {
        return $this->hasMany(ShareLokasi::class);
    }

    public function lembur()
    {
        return $this->hasMany(Lembur::class);
    }

    public function standby()
    {
        return $this->hasMany(Standby::class);
    }

    public function appNotifications()
    {
        return $this->hasMany(AppNotification::class);
    }

    /**
     * Mutator for job to always save as uppercase
     */
    protected function job(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => strtoupper($value),
        );
    }

    /**
     * Mutator for role to always save as uppercase
     */
    protected function role(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => strtoupper($value),
        );
    }

    /**
     * Check if user has permission for a specific route
     */
    public function hasPermission($route)
    {
        // 1. Super Admin (role admin tanpa job spesifik) punya akses semua
        if ($this->role === 'admin' && empty($this->job)) {
            return true;
        }

        // 2. Jika tidak punya job, cek role admin saja
        if (empty($this->job)) {
            return $this->role === 'admin';
        }

        // 3. Cek Permission berdasarkan Job di tabel baru
        $permission = \App\Models\JobPermission::whereRaw('UPPER(job) = ?', [strtoupper($this->job)])->first();
        
        if (!$permission) {
            // Default: Admin boleh masuk, User biasa tidak
            return $this->role === 'admin';
        }

        $allowedList = is_array($permission->permissions) ? $permission->permissions : [];
        
        // Aliases / Related Permissions
        // Jika punya akses rekap, otomatis punya akses import (karena berada di menu yang sama)
        if ($route === 'admin.absensi.import' && in_array('admin.absensi.rekap', $allowedList)) {
            return true;
        }

        // Kebalikannya: Jika hanya punya akses 'Terima Laporan', boleh buka menu 'Rekap Absensi' (hanya untuk lihat hasil)
        if ($route === 'admin.absensi.rekap' && in_array('admin.absensi.export', $allowedList)) {
            return true;
        }

        // Cek apakah route ada di list yang diizinkan
        return in_array($route, $allowedList);
    }
}
