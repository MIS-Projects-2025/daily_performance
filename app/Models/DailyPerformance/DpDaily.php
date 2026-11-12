<?php

namespace App\Models\DailyPerformance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DpDaily extends Model
{
    protected $table = 'dp_daily';

    protected $fillable = [
        'entry_date', 'cal_workweek', 'line_code', 'package_type', 'capacity', 'wip', 'commit_qty',
        'capacity_remarks', 'outs', 'gap_analysis', 'entered_by_id', 'entered_by',
    ];

    protected $casts = [
        'entry_date' => 'date:Y-m-d',
        'cal_workweek' => 'integer',
        'capacity' => 'integer',
        'wip' => 'integer',
        'commit_qty' => 'integer',
        'commit_capacity_delta' => 'integer',
        'outs' => 'integer',
        'outs_commit_delta' => 'integer',
    ];

    public function getConnectionName()
    {
        return config('dp.connection');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(DpAction::class, 'daily_id')->orderBy('sort_order')->orderBy('id');
    }

}
