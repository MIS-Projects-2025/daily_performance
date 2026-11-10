<?php
// app/Models/Masterlist/EmployeeTeam.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeTeam extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_team';
    protected $fillable = ['employid', 'team_id'];
    public $timestamps = false;

    public function team()
    {
        return $this->belongsTo(\App\Models\Lookups\Team::class, 'team_id');
    }
}