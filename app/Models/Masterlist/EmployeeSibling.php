<?php
// app/Models/Masterlist/EmployeeSibling.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeSibling extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_siblings';

    protected $primaryKey = 'sibling_id';

    public $timestamps = false;

    protected $fillable = [
        'employid',
        'sibling_name',
        'sibling_age',
        'sibling_occupation',
        'sibling_birthdate',
    ];
}