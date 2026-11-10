<?php
// app/Models/Masterlist/EmployeeParent.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeParent extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_parents';

    protected $primaryKey = 'PARENT_ID';

    public $timestamps = false;

    protected $fillable = [
        'EMPLOYID',
        'FATHERS_NAME', 'FATHER_OCCUPATION', 'FATHER_AGE', 'FATHER_BIRTHDATE',
        'MOTHERS_NAME', 'MOTHER_OCCUPATION', 'MOTHER_AGE', 'MOTHER_BIRTHDATE',
    ];
}