<?php
// app/Models/Lookups/Certification.php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Certification extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'certification';
    protected $fillable = ['certificate_name'];
    public $timestamps = false;
}