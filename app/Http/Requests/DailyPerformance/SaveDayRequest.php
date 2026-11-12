<?php

namespace App\Http\Requests\DailyPerformance;

use App\Models\DailyPerformance\DpAction;
use App\Models\DailyPerformance\PackageTypes;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveDayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // AuthMiddleware already guards the route group
    }

    // The form sends "5,360,000"; strip commas before validating
    protected function prepareForValidation(): void
    {
        $rows = collect($this->input('rows', []))->map(function ($l) {
            foreach (['capacity', 'wip', 'commit_qty', 'outs'] as $k) {
                $v = isset($l[$k]) ? str_replace([',', ' '], '', (string) $l[$k]) : '';
                $l[$k] = $v === '' ? null : $v;
            }
            return $l;
        })->all();

        $this->merge(['rows' => $rows]);
    }

    public function rules(): array
    {
        $conn = config('dp.connection');

        return [
            'entry_date' => ['required', 'date_format:Y-m-d'],
            'cal_workweek' => ['required', 'integer', Rule::exists($conn . '.' . config('dp.calendar_table'), 'cal_workweek')],
            'line_code' => ['required', 'string', Rule::exists($conn . '.dp_line', 'code')],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.id' => ['nullable', 'integer'],
            'rows.*.package_type' => ['required', 'string', 'max:45', 'distinct', Rule::in(PackageTypes::names())],
            'rows.*.capacity' => ['nullable', 'integer', 'min:0'],
            'rows.*.wip' => ['nullable', 'integer', 'min:0'],
            'rows.*.commit_qty' => ['nullable', 'integer', 'min:0'],
            'rows.*.outs' => ['nullable', 'integer', 'min:0'],
            'rows.*.capacity_remarks' => ['nullable', 'string', 'max:5000'],
            'rows.*.gap_analysis' => ['nullable', 'string', 'max:10000'],
            'rows.*.actions' => ['nullable', 'array'],
            'rows.*.actions.*.id' => ['nullable', 'integer'],
            'rows.*.actions.*.action_text' => ['nullable', 'string', 'max:5000'],
            'rows.*.actions.*.owner' => ['nullable', 'string', 'max:100'],
            'rows.*.actions.*.when_text' => ['nullable', 'string', 'max:30'],
            'rows.*.actions.*.status' => ['nullable', Rule::in(DpAction::STATUSES)],
            'rows.*.actions.*.status_note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'cal_workweek.required' => 'Pick the work week.',
            'cal_workweek.exists' => 'That work week is not in analog_calendar.',
            'rows.min' => 'Add at least one package type.',
            'rows.required' => 'Add at least one package type.',
            'rows.*.package_type.required' => 'Pick a package type for every row.',
            'rows.*.package_type.distinct' => 'Each package type can only appear once per factory and day.',
            'rows.*.package_type.in' => 'That package type is not in qdn_new_db.package_list.',
            'rows.*.*.integer' => 'Numbers only (commas are fine).',
            'rows.*.*.min' => 'Must be zero or more.',
        ];
    }
}
