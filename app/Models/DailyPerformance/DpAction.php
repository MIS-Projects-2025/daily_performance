<?php

namespace App\Models\DailyPerformance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DpAction extends Model
{
    public const STATUSES = ['Open', 'Ongoing', 'Done', 'Sustain'];

    protected $table = 'dp_action';

    protected $fillable = [
        'daily_id', 'action_text', 'owner', 'when_text', 'due_date', 'due_ww', 'status', 'status_note', 'sort_order',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'due_ww' => 'integer',
    ];

    public function getConnectionName()
    {
        return config('dp.connection');
    }

    public function daily(): BelongsTo
    {
        return $this->belongsTo(DpDaily::class, 'daily_id');
    }

    // "WW702" / "702" -> due_ww ; "2026-11-08" (or any parseable date) -> due_date
    public static function parseWhen(?string $value): array
    {
        $t = trim((string) $value);
        if ($t === '') {
            return ['when_text' => null, 'due_date' => null, 'due_ww' => null];
        }
        if (preg_match('/^(?:ww)?\s*(\d{3,6})$/i', $t, $m)) {
            return ['when_text' => $t, 'due_date' => null, 'due_ww' => (int) $m[1]];
        }
        try {
            $d = \Carbon\Carbon::parse($t);
            return ['when_text' => $t, 'due_date' => $d->toDateString(), 'due_ww' => null];
        } catch (\Throwable $e) {
            return ['when_text' => $t, 'due_date' => null, 'due_ww' => null];
        }
    }
}
