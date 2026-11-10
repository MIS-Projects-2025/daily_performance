<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class RecruitmentApplicationSync extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'recruitment_application_syncs';
    public $timestamps = false;

    protected $fillable = ['application_id', 'employid', 'synced_at'];
}