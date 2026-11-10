<?php
// app\Models\Masterlist\EmployeeApprover.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeApprover extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_approver';

    protected $primaryKey = 'employid';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = ['employid', 'approver1', 'approver2', 'approver3'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employid', 'employid');
    }

    public function approver1Employee()
    {
        return $this->belongsTo(Employee::class, 'approver1', 'employid');
    }

    public function approver2Employee()
    {
        return $this->belongsTo(Employee::class, 'approver2', 'employid');
    }

    public function approver3Employee()
    {
        return $this->belongsTo(Employee::class, 'approver3', 'employid');
    }
}