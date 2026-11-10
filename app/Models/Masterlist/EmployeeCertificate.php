<?php
// app/Models/Masterlist/EmployeeCertificate.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeCertificate extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_certificate';
    protected $fillable = ['employid', 'certificate_id'];
    public $timestamps = false;

    public function certification()
    {
        return $this->belongsTo(\App\Models\Lookups\Certification::class, 'certificate_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employid', 'employid');
    }
}