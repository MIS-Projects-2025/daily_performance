<?php
// app/Models/Masterlist/EmployeeShift.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeShift extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_shift';
    protected $fillable = ['employid', 'shift_id'];
    public $timestamps = false;

    public function shift()
    {
        return $this->belongsTo(\App\Models\Lookups\Shift::class, 'shift_id');
    }
}