<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lembur extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'rs_id', 'foto_url', 'latitude', 'longitude',
        'waktu_mulai', 'waktu_selesai', 'keterangan', 
        'tagged_user_ids', 'wa_group_id', 'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rumahSakit()
    {
        return $this->belongsTo(RumahSakit::class, 'rs_id');
    }
}
