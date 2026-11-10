<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class JobLevelPageAccess extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'job_level_page_access';
    protected $fillable = ['job_level_id', 'page_key'];
}