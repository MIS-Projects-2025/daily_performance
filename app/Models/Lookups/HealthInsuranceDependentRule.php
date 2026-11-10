<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class HealthInsuranceDependentRule extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'health_insurance_dependent_rule';
    public $timestamps = false;

    protected $fillable = [
        'health_insurance_id',
        'employee_status',
        'relationship',
        'max_age',
        'max_count',
        'eldest_first',
        'parent_type',
        'parent_fallback',
        'school_max_age',
        'unemployed_only',
    ];

    protected $casts = [
        'eldest_first'    => 'boolean',
        'parent_fallback' => 'boolean',
        'unemployed_only' => 'boolean',
    ];
}