<?php
// app/Models/Masterlist/EmployeeDepartment.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeDepartment extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_department';
    protected $fillable = ['employid', 'department_id'];
    public $timestamps = false;

    public function department()
    {
        return $this->belongsTo(\App\Models\Lookups\Department::class, 'department_id');
    }
}