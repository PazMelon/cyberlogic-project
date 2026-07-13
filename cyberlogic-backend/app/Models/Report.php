<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reportable_id',
        'reportable_type',
        'reportable_title',
        'content_owner_id',
        'moderator_id',
        'reason',
        'details',
        'status',
        'action_taken',
    ];

    /**
     * Get the owning reportable model.
     */
    public function reportable()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who reported.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the owner of the reported content.
     */
    public function contentOwner()
    {
        return $this->belongsTo(User::class, 'content_owner_id');
    }

    /**
     * Get the moderator who handled the report.
     */
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }
}
