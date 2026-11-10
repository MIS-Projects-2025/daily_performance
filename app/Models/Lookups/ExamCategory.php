<?php

namespace App\Models\Lookups;

use Illuminate\Database\Eloquent\Model;

class ExamCategory extends Model
{
    protected $fillable = ['name', 'code'];

    public function exams()
    {
        return $this->hasMany(\App\Models\Exam::class, 'exam_category_id');
    }
}