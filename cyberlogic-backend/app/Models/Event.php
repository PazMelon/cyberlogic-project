<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Event extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'date',
        'start_time',
        'end_time',
        'location',
        'type',
        'image',
        'capacity',
        'sections',
        'status',
        'event_mode',
        'attendance_capacity',
        'registration_start',
        'registration_end',
        'attendance_start',
        'attendance_end',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'datetime:Y-m-d',
            'capacity' => 'integer',
            'attendance_capacity' => 'integer',
            'sections' => 'array',
        ];
    }

    /**
     * Get the registrations for this event.
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    /**
     * Get the users registered for this event.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_registrations');
    }

    /**
     * Get the attendance records for this event.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(EventAttendance::class);
    }

    /**
     * Get the users who attended this event.
     */
    public function attendedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_attendances');
    }
}
