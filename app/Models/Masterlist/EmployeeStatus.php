<?php
// app/Models/Masterlist/EmployeeStatus.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeStatus extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_status';
    protected $fillable = ['employid', 'empstatus_id'];
    public $timestamps = false;

    public function status()
    {
        return $this->belongsTo(\App\Models\Lookups\Status::class, 'empstatus_id');
    }
}