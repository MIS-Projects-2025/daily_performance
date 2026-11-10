<?php
// app/Models/Masterlist/EmployeeClass.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeClass extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_class';
    protected $fillable = ['employid', 'empclass_id'];
    public $timestamps = false;

    public function classLookup()
    {
        return $this->belongsTo(\App\Models\Lookups\ClassLookup::class, 'empclass_id');
    }

}