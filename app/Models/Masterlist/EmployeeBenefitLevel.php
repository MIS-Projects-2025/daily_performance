<?php
// app/Models/Masterlist/EmployeeBenefitLevel.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeBenefitLevel extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_benefit_level';

    protected $primaryKey = 'employid';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = ['employid', 'benefit_level_id'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employid', 'employid');
    }

    public function benefitLevel()
    {
        return $this->belongsTo(\App\Models\Lookups\BenefitLevel::class, 'benefit_level_id', 'id');
    }
}