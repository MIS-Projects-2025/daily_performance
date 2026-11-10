<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    protected $connection = 'masterlist';

    protected $fillable = ['station_name'];

    public $timestamps = false;
}