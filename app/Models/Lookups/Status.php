<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'status';

    protected $fillable = ['status_name'];

    public $timestamps = false;
}