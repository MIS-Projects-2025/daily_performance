<?php
// app/Models/Masterlist/EmployeeJobTitle.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeJobTitle extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_job_title';
    protected $fillable = ['employid', 'job_title_id'];
    public $timestamps = false;
}