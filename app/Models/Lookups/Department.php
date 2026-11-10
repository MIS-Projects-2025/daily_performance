<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'department';

    protected $fillable = ['dep_name'];

    public $timestamps = false;
}