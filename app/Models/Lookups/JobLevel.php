<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class JobLevel extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'job_level';

    public $timestamps = false;

    protected $fillable = [
        'emp_job_level_name',
    ];
}