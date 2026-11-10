<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'category';

    protected $fillable = ['category_name'];

    public $timestamps = false;
}