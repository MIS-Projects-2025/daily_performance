<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'shift';

    protected $primaryKey = 'shift_id';

    protected $fillable = ['shift_name'];

    public $timestamps = false;
}