<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class IdlCategory extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'idl_category';

    protected $fillable = ['idl_category_name'];

    public $timestamps = false;
}