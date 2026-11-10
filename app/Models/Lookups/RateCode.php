<?php
// app/Models/Lookups/RateCode.php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class RateCode extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'rate_code';

    protected $fillable = ['rate_name'];

    public $timestamps = false;
}