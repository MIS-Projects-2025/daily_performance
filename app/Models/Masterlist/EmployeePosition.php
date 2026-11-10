<?php
// app/Models/Masterlist/EmployeePosition.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeePosition extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_position';
    protected $fillable = ['employid', 'empposition_id'];
    public $timestamps = false;

    public function position()
    {
        return $this->belongsTo(\App\Models\Lookups\Position::class, 'empposition_id');
    }
}