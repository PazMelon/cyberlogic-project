<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CyberboardCardActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'card_id',
        'user_id',
        'action',
        'description',
        'changes',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
        ];
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(CyberboardBoard::class, 'board_id');
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(CyberboardCard::class, 'card_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
