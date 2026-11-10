<?php
// app/Models/Lookups/RmbrdRmtype.php
namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class RmbrdRmtype extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'rmbrd_rmtype';
    protected $fillable = ['rmbrd_rmtype_name'];
    public $timestamps = false;
}