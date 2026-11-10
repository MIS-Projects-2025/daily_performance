<?php
// app/Models/Masterlist/EmployeeSpouse.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeSpouse extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_spouse';
    protected $primaryKey = 'SPOUSE_ID';

    public $timestamps = false;

    protected $fillable = [
        'EMPLOYID',
        'SPOUSE_NAME',
        'SPOUSE_OCCUPATION',
        'SPOUSE_AGE',
        'SPOUSE_BIRTHDATE',
    ];
}