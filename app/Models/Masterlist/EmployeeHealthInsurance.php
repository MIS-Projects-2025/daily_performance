<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeHealthInsurance extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_health_insurance';
    protected $fillable = ['employid', 'health_insurance_id'];
    public $timestamps = false;

    public function healthInsurance()
    {
        return $this->belongsTo(\App\Models\Lookups\HealthInsurance::class, 'health_insurance_id');
    }
}