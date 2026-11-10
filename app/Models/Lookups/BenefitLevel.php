<?php
// app/Models/Lookups/BenefitLevel.php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class BenefitLevel extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'benefit_level';

    protected $fillable = ['benefit_name'];

    public $timestamps = false;
}