<?php

namespace App\Models\DailyPerformance;

use Illuminate\Database\Eloquent\Model;

class DpLine extends Model
{
    protected $table = 'dp_line';
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['code', 'name', 'sort_order', 'active'];

    public function getConnectionName()
    {
        return config('dp.connection');
    }
}
