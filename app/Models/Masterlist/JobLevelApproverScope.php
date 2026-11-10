<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class JobLevelApproverScope extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'job_level_approver_scope';
    protected $fillable = ['job_level_id', 'approver_column'];
}