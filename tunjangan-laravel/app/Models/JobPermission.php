<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobPermission extends Model
{
    use HasFactory;

    protected $fillable = ['job', 'permissions'];

    protected $casts = [
        'permissions' => 'array',
    ];

    /**
     * Mutator for job to always save as uppercase
     */
    protected function job(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => strtoupper($value),
        );
    }
}
