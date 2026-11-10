<?php
// app/Models/Lookups/HealthInsurance.php
namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class HealthInsurance extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'health_insurance';
    protected $fillable = ['enrollee', 'health_insurance_type', 'dd_limit', 'rmbrd_rmtype_id'];

    public function rmbrdRmtype()
    {
        return $this->belongsTo(RmbrdRmtype::class);
    }

    public function classes()
    {
        return $this->belongsToMany(
            ClassLookup::class,
            'health_insurance_class',
            'health_insurance_id',
            'class_id'
        );
    }

    public function benefitLevels()
    {
        return $this->belongsToMany(
            BenefitLevel::class,
            'health_insurance_benefit_level',
            'health_insurance_id',
            'benefit_level_id'
        );
    }
        public function jobLevels()
    {
        return $this->belongsToMany(
            JobLevel::class,
            'health_insurance_job_level',
            'health_insurance_id',
            'job_level_id'
        );
    }

    public function positions()
    {
        return $this->belongsToMany(
            Position::class,
            'health_insurance_position',
            'health_insurance_id',
            'position_id'
        );
    }
        public function dependentRules()
    {
        return $this->hasMany(HealthInsuranceDependentRule::class, 'health_insurance_id');
    }
    public function dependentLimits()
{
    return $this->hasMany(HealthInsuranceDependentLimit::class);
}
}