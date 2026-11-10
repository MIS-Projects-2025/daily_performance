<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $connection = 'masterlist';

    protected $table = 'team';

    protected $fillable = ['team_name'];

    public $timestamps = false;
}