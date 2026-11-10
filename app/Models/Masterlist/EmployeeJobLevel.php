<?php
// app/Models/Masterlist/EmployeeJobLevel.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeJobLevel extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_job_level';
    protected $fillable = ['employid', 'job_level_id'];
    public $timestamps = false;

    public function jobLevel()
    {
        return $this->belongsTo(\App\Models\Lookups\JobLevel::class, 'job_level_id');
    }
}