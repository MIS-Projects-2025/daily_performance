<?php

namespace App\Models\Masterlist;

use App\Models\Lookups\IdlCategory;
use Illuminate\Database\Eloquent\Model;

class EmployeeIdlCategory extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_idl_category';

    protected $fillable = ['EMPLOYID', 'idl_category_id'];

    public $timestamps = false;

    public function idlCategory()
    {
        return $this->belongsTo(IdlCategory::class, 'idl_category_id');
    }
}