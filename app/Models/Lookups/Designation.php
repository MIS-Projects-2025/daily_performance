<?php
// app/Models/Lookups/Designation.php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Designation extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'designation';

    protected $fillable = ['designation_name'];

    public $timestamps = false;
}