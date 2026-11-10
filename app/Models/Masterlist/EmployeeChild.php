<?php
// app/Models/Masterlist/EmployeeChild.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeChild extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_children';

    protected $primaryKey = 'CHILD_ID';

    public $timestamps = false;

    protected $fillable = [
        'EMPLOYID',
        'CHILD_NAME',
        'CHILD_AGE',
        'CHILD_STILL_IN_SCHOOL',
        'CHILD_OCCUPATION',
        'CHILD_BIRTHDATE',
    ];
}