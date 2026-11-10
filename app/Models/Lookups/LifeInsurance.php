<?php
// app/Models/Lookups/LifeInsurance.php
namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class LifeInsurance extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'life_insurance';
    protected $fillable = ['life_insurance_type', 'amount_of_insurance'];

    public function classes()
    {
        return $this->belongsToMany(
            ClassLookup::class,
            'life_insurance_class',
            'life_insurance_id',
            'class_id'
        );
    }

    public function benefitLevels()
    {
        return $this->belongsToMany(
            BenefitLevel::class,
            'life_insurance_benefit_level',
            'life_insurance_id',
            'benefit_level_id'
        );
    }
}