<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TagShareLokasi extends Model
{
    protected $table = 'tag_share_lokasi';
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'tagged_user_id');
    }
}
