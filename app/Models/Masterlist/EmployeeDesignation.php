<?php
// app/Models/Masterlist/EmployeeDesignation.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeDesignation extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_designation';

    protected $primaryKey = 'employid';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = ['employid', 'designation_id'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employid', 'employid');
    }

    public function designation()
    {
        return $this->belongsTo(\App\Models\Lookups\Designation::class, 'designation_id', 'id');
    }
}