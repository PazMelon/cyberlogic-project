<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CyberboardCardComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_id',
        'user_id',
        'content',
    ];

    public function card(): BelongsTo
    {
        return $this->belongsTo(CyberboardCard::class, 'card_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
