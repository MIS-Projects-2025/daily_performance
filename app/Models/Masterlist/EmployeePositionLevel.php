<?php
// app/Models/Masterlist/EmployeePositionLevel.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeePositionLevel extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_position_level';
    protected $fillable = ['employid', 'position_level_id'];
    public $timestamps = false;

    public function positionLevel()
    {
        return $this->belongsTo(\App\Models\Lookups\PositionLevel::class, 'position_level_id');
    }
}