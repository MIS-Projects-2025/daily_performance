<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeEmergencyContact extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_emergency_contact';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = true;

    protected $fillable = [
        'EMPLOYID',
        'CONTACT_NAME',
        'RELATIONSHIP',
        'CONTACT_NUMBER',
        'REGION_CODE',
        'REGION_NAME',
        'PROVINCE_CODE',
        'PROVINCE_NAME',
        'CITY_CODE',
        'CITY_NAME',
        'BARANGAY_CODE',
        'BARANGAY_NAME',
        'STREET',
        'ZIP_CODE',
    ];
}