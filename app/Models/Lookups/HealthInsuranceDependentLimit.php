<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class HealthInsuranceDependentLimit extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'health_insurance_dependent_limit';
    public $timestamps = false;

    protected $fillable = [
        'health_insurance_id',
        'employee_status',
        'max_dependents',
        'parent_fill',
    ];
}