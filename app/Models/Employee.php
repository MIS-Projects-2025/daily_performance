<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model implements AuthenticatableContract
{
    use Authenticatable;

    protected $connection = 'masterlist';
    protected $table = 'login';
    protected $primaryKey = 'EMPLOYID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'EMPLOYID',
        'EMPNAME',
        'USERNAME',
        'PASSWRD',
        'ACCSTATUS',
        'ROLE',
    ];

    protected $hidden = [
        'PASSWRD',
    ];

    // Tell Laravel which column holds the password
    public function getAuthPassword()
    {
        return $this->PASSWRD;
    }

    public function getAuthPasswordName()
    {
        return 'PASSWRD';
    }

    // Table has no remember_token column — disable that feature safely
    public function getRememberTokenName()
    {
        return '';
    }

    public function details()
    {
        return $this->hasOne(\App\Models\Masterlist\Employee::class, 'employid', 'EMPLOYID');
    }
}