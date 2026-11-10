<?php

namespace App\Models\Masterlist;

use App\Models\Lookups\Factory;
use Illuminate\Database\Eloquent\Model;

class EmployeeFactory extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_factory';

    protected $fillable = ['EMPLOYID', 'factory_id'];

    public $timestamps = false;

    public function factory()
    {
        return $this->belongsTo(Factory::class, 'factory_id');
    }
}