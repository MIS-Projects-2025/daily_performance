<?php
// app/Models/Masterlist/EmployeeHealthDependent.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeHealthDependent extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_health_dependents';

    protected $fillable = [
        'employid',
        'health_insurance_id',
        'employee_status',
        'relationship',
        'source_key',
        'name',
        'birthdate',
        'age',
        'sort_order',
    ];

    protected $casts = [
        'birthdate' => 'date',
    ];
}