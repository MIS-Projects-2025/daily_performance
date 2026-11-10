<?php
// app/Models/Masterlist/EmployeeEmploymentDetail.php
namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class EmployeeEmploymentDetail extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_employement_details'; // note: matches DB typo "employement"
    protected $fillable = ['employid', 'date_hired', 'date_reg', 'service_length'];
    public $timestamps = false;

    protected $casts = [
        'date_hired' => 'date',
        'date_reg' => 'date',
    ];
}