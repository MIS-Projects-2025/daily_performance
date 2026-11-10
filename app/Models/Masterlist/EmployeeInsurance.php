<?php
// app/Models/Masterlist/EmployeeInsurance.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeInsurance extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_insurance';

    public $timestamps = false;

    protected $fillable = ['employid', 'insurance_id'];

    public function lifeInsurance()
    {
        return $this->belongsTo(\App\Models\Lookups\LifeInsurance::class, 'insurance_id', 'id');
    }
}