<?php

namespace App\Models\Masterlist;

use App\Models\Lookups\Category;
use Illuminate\Database\Eloquent\Model;

class EmployeeCategory extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'employee_category';

    protected $fillable = ['EMPLOYID', 'category_id'];

    public $timestamps = false;

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}