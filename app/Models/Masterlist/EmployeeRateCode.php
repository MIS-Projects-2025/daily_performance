<?php
// app/Models/Masterlist/EmployeeRateCode.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeRateCode extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_rate_code';

    protected $primaryKey = 'employid';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = ['employid', 'rate_code_id'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employid', 'employid');
    }

    public function rateCode()
    {
        return $this->belongsTo(\App\Models\Lookups\RateCode::class, 'rate_code_id', 'id');
    }
}