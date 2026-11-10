<?php
// app/Models/Masterlist/EmployeeCompany.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeCompany extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_company';
    protected $fillable = ['employid', 'company_id'];
    public $timestamps = false;

    public function company()
    {
        return $this->belongsTo(\App\Models\Lookups\Company::class, 'company_id', 'id');
    }
}