<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeAddress extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_addresses';

    protected $primaryKey = 'EMPLOYID';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'EMPLOYID',
        'HOUSE_NO',
        'STREET',
        'ADDRESS_LINE_2',
        'REGION_CODE',
        'REGION_NAME',
        'PROVINCE_CODE',
        'PROVINCE_NAME',
        'CITY_CODE',
        'CITY_NAME',
        'BARANGAY_CODE',
        'BARANGAY_NAME',
        'ZIP_CODE',
        'PERMA_HOUSE_NO',
        'PERMA_STREET',
        'PERMA_ADDRESS_LINE_2',
        'PERMA_REGION_CODE',
        'PERMA_REGION_NAME',
        'PERMA_PROVINCE_CODE',
        'PERMA_PROVINCE_NAME',
        'PERMA_CITY_CODE',
        'PERMA_CITY_NAME',
        'PERMA_BARANGAY_CODE',
        'PERMA_BARANGAY_NAME',
        'PERMA_ZIP_CODE',
    ];
}