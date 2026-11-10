<?php
// app/Models/Masterlist/EmployeeBagid.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeBagid extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_bagid';
    protected $primaryKey = 'EMPLOYID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'EMPLOYID',
        'BANK_ACCT_NO',
        'PAG_IBIG_NO',
        'PHILHEALTH_NO',
        'SSS_NO',
        'TIN_NO',
    ];
}