<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Shuttle extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'shuttles';

    protected $fillable = ['shuttle_name'];

    public $timestamps = false;
}