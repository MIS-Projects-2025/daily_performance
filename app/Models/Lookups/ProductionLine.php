<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class ProductionLine extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'prod_lines';

    protected $fillable = ['pl_name'];

    public $timestamps = false;
}