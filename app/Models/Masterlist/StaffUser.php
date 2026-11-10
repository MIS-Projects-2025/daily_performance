<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class StaffUser extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'staff_users';
    protected $fillable = ['employid'];
}