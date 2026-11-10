<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeEducation extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_education';

    public $timestamps = false;

    protected $fillable = [
        'EMPLOYID',
        'level',
        'course',
        'year_level',
        'honor',
    ];
}