<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShareLokasi extends Model
{
    protected $table = 'share_lokasi';
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rumahSakit()
    {
        return $this->belongsTo(RumahSakit::class, 'rs_id');
    }

    public function tags()
    {
        return $this->hasMany(TagShareLokasi::class, 'share_lokasi_id');
    }
}
