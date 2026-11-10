<?php
// app/Models/Masterlist/EmployeeShuttle.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeShuttle extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_shuttle';
    protected $fillable = ['employid', 'shuttle_id'];
    public $timestamps = false;

    public function shuttle()
    {
        return $this->belongsTo(\App\Models\Lookups\Shuttle::class, 'shuttle_id');
    }
}