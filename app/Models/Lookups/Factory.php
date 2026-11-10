<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Factory extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'factory';

    protected $fillable = ['factory_name'];

    public $timestamps = false;
}