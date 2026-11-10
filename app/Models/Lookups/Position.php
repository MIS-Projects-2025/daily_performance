<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'position';

    public $timestamps = false;

    protected $fillable = ['emp_position_name'];
}