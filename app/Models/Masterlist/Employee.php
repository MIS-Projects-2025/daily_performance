<?php
// app/Models/Masterlist/Employee.php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_details';

    protected $primaryKey = 'employid';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'employid',
        'firstname',
        'middlename',
        'lastname',
        'nickname',
        'birthday',
        'place_of_birth',
        'emp_sex',
        'email',
        'contact_no',
        'civil_status',
        'height',
        'weight',
        'blood_type',
        'educational_attainment',
        'accstatus',
        'biometric_status',
        'created_at',
        'religion',
        'photo',
    ];

    protected $casts = [
        'birthday' => 'date',
        'created_at' => 'datetime',
    ];

    public function departments()
    {
        return $this->hasMany(EmployeeDepartment::class, 'employid', 'employid');
    }

    public function jobLevels()
    {
        return $this->hasMany(EmployeeJobLevel::class, 'employid', 'employid');
    }

    public function employmentDetail()
    {
        return $this->hasOne(EmployeeEmploymentDetail::class, 'employid', 'employid')->latestOfMany('id');
    }

    public function currentBenefitLevel()
    {
        return $this->hasOne(EmployeeBenefitLevel::class, 'employid', 'employid');
    }

    public function currentRateCode()
    {
        return $this->hasOne(EmployeeRateCode::class, 'employid', 'employid');
    }

    public function currentDesignation()
    {
        return $this->hasOne(EmployeeDesignation::class, 'employid', 'employid');
    }

    public function currentCompany()
    {
        return $this->hasOne(EmployeeCompany::class, 'employid', 'employid');
    }

    public function currentInsurance()
    {
        return $this->hasOne(EmployeeInsurance::class, 'employid', 'employid');
    }

    public function currentHealthInsurance()
    {
        return $this->hasOne(EmployeeHealthInsurance::class, 'employid', 'employid');
    }

    public function currentDepartment()
    {
        return $this->hasOne(EmployeeDepartment::class, 'employid', 'employid');
    }

    public function currentPosition()
    {
        return $this->hasOne(EmployeePosition::class, 'employid', 'employid');
    }

    public function currentJobLevel()
    {
        return $this->hasOne(EmployeeJobLevel::class, 'employid', 'employid');
    }

    public function currentStatus()
    {
        return $this->hasOne(EmployeeStatus::class, 'employid', 'employid');
    }

    public function currentClass()
    {
        return $this->hasOne(EmployeeClass::class, 'employid', 'employid');
    }
    public function scopeActive($query)
    {
        return $query->where('accstatus', 1);
    }
        public function currentTeam()
    {
        return $this->hasOne(EmployeeTeam::class, 'employid', 'employid');
    }

    public function currentShift()
    {
        return $this->hasOne(EmployeeShift::class, 'employid', 'employid');
    }

    public function currentStation()
    {
        return $this->hasOne(EmployeeStation::class, 'employid', 'employid');
    }

    public function currentProductionLine()
    {
        return $this->hasOne(EmployeeProductionLine::class, 'employid', 'employid');
    }

    // public function approver()
    // {
    //     return $this->hasOne(EmployeeApprover::class, 'employid', 'employid');
    // }

    public function currentPositionLevel()
    {
        return $this->hasOne(\App\Models\Masterlist\EmployeePositionLevel::class, 'employid', 'employid');
    }

    public function bagid()
    {
        return $this->hasOne(EmployeeBagid::class, 'EMPLOYID', 'employid');
    }

    public function currentShuttle()
    {
        return $this->hasOne(EmployeeShuttle::class, 'employid', 'employid');
    }

    public function currentFactory()
    {
        return $this->hasOne(EmployeeFactory::class, 'EMPLOYID', 'employid');
    }

    public function currentCategory()
    {
        return $this->hasOne(EmployeeCategory::class, 'EMPLOYID', 'employid');
    }
    public function currentIdlCategory()
    {
        return $this->hasOne(EmployeeIdlCategory::class, 'EMPLOYID', 'employid');
    }
    public function address()
    {
        return $this->hasOne(\App\Models\Masterlist\EmployeeAddress::class, 'EMPLOYID', 'employid');
    }

    public function education()
    {
        return $this->hasMany(\App\Models\Masterlist\EmployeeEducation::class, 'EMPLOYID', 'employid');
    }

    public function emergencyContactInfo()
    {
        return $this->hasOne(\App\Models\Masterlist\EmployeeEmergencyContact::class, 'EMPLOYID', 'employid');
    }

    public function parentInfo()
    {
        return $this->hasOne(\App\Models\Masterlist\EmployeeParent::class, 'EMPLOYID', 'employid');
    }

    public function spouseInfo()
    {
        return $this->hasOne(\App\Models\Masterlist\EmployeeSpouse::class, 'EMPLOYID', 'employid');
    }

    // public function children()
    // {
    //     return $this->hasMany(\App\Models\Masterlist\EmployeeChild::class, 'EMPLOYID', 'employid');
    // }

    public function siblings()
    {
        return $this->hasMany(\App\Models\Masterlist\EmployeeSibling::class, 'employid', 'employid');
    }
    public function approver()
    {
        return $this->hasOne(EmployeeApprover::class, 'employid', 'employid');
    }

    public function parents()
    {
        return $this->hasOne(EmployeeParent::class, 'EMPLOYID', 'employid');
    }

    public function spouse()
    {
        return $this->hasOne(EmployeeSpouse::class, 'EMPLOYID', 'employid');
    }

    public function children()
    {
        return $this->hasMany(EmployeeChild::class, 'EMPLOYID', 'employid');
    }
}