<?php

namespace App\Http\Controllers\DailyPerformance;

use App\Http\Controllers\Controller;
use App\Http\Requests\DailyPerformance\SaveDayRequest;
use App\Models\DailyPerformance\DpAction;
use App\Models\DailyPerformance\DpDaily;
use App\Models\DailyPerformance\DpLine;
use App\Models\DailyPerformance\PackageTypes;
use App\Services\DailyPerformance\DpExcelExport;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DailyPerformanceController extends Controller
{
    private function db()
    {
        return DB::connection(config('dp.connection'));
    }

    // One row per work week, even if analog_calendar holds one row per day.
    // Read through the qdn_new_db connection, which can be on another server,
    // so it is never joined in SQL with the dp_* tables.
    private function calendarWeeks()
    {
        return DB::connection(config('dp.ref_connection'))->table(config('dp.calendar_table'))
            ->selectRaw('cal_workweek, MIN(cal_year) AS cal_year, MIN(cal_quarter) AS cal_quarter, MIN(cal_month) AS cal_month')
            ->groupBy('cal_workweek')
            ->orderBy('cal_workweek');
    }

    private function lines()
    {
        return DpLine::where('active', 1)->orderBy('sort_order')->orderBy('code')->get(['code', 'name']);
    }

    // ---------------------------------------------------------------- dashboard

    // Shared by the dashboard and the Excel export: same filters, same rows
    private function filtered(Request $request): array
    {
        $f = $request->validate([
            'mode' => ['nullable', Rule::in(['ww', 'date', 'period'])],
            'ww' => ['nullable', 'integer'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'year' => ['nullable', 'string', 'max:45'],
            'quarter' => ['nullable', 'integer'],
            'month' => ['nullable', 'integer'],
            'lines' => ['nullable', 'array'],
            'lines.*' => ['string', 'max:10'],
            'packages' => ['nullable', 'array'],
            'packages.*' => ['string', 'max:45'],  // "__none__" = rows saved without a package type
        ]);

        $latest = DpDaily::orderByDesc('entry_date')->first(['entry_date', 'cal_workweek']);

        // First visit: open on the latest week that has data
        $mode = $f['mode'] ?? 'ww';
        if (!$request->hasAny(['mode', 'ww', 'from', 'to', 'year', 'quarter', 'month']) && $latest) {
            $f['ww'] = $latest->cal_workweek;
        }

        $cal = $this->calendarWeeks()->get()->keyBy(fn ($c) => (int) $c->cal_workweek);
        $q = DpDaily::query()
            ->from('dp_daily as d')
            ->select('d.*', 'd.package_type as package_code');

        if ($mode === 'ww' && !empty($f['ww'])) {
            $q->where('d.cal_workweek', $f['ww']);
        }
        if ($mode === 'date') {
            if (!empty($f['from'])) $q->where('d.entry_date', '>=', $f['from']);
            if (!empty($f['to'])) $q->where('d.entry_date', '<=', $f['to']);
        }
        if ($mode === 'period') {
            $weeks = $cal->filter(fn ($c) => (empty($f['year']) || (string) $c->cal_year === (string) $f['year'])
                && (empty($f['quarter']) || (int) $c->cal_quarter === (int) $f['quarter'])
                && (empty($f['month']) || (int) $c->cal_month === (int) $f['month']))->keys()->all();
            $q->whereIn('d.cal_workweek', $weeks ?: [-1]);
        }
        if (!empty($f['lines'])) {
            $q->whereIn('d.line_code', $f['lines']);
        }
        if (!empty($f['packages'])) {
            $names = $f['packages'];
            $q->where(function ($w) use ($names) {
                $w->whereIn('d.package_type', $names);
                if (in_array('__none__', $names, true)) $w->orWhereNull('d.package_type');
            });
        }

        $rows = $q->orderBy('d.entry_date')->orderBy('d.line_code')->orderBy('d.package_type')->get()
            ->each(function ($r) use ($cal) {
                $c = $cal->get((int) $r->cal_workweek);
                $r->setAttribute('cal_year', $c?->cal_year);
                $r->setAttribute('cal_quarter', $c?->cal_quarter);
                $r->setAttribute('cal_month', $c?->cal_month);
            });

        $actions = $rows->isEmpty() ? collect() : DpAction::query()
            ->from('dp_action as a')
            ->join('dp_daily as d', 'd.id', '=', 'a.daily_id')
            ->whereIn('a.daily_id', $rows->pluck('id'))
            ->orderByDesc('d.entry_date')->orderBy('a.sort_order')->orderBy('a.id')
            ->get(['a.*', 'd.entry_date', 'd.line_code', 'd.cal_workweek', 'd.package_type as package_code'])
            ->map(fn ($a) => [...$a->toArray(), 'entry_date' => Carbon::parse($a->getAttributes()['entry_date'])->toDateString()]);

        return [$rows, $actions, [...$f, 'mode' => $mode], $latest];
    }

    public function dashboard(Request $request)
    {
        [$rows, $actions, $filters, $latest] = $this->filtered($request);

        return Inertia::render('DailyPerformance/Dashboard', [
            'calendar' => $this->calendarWeeks()->get(),
            'lines' => $this->lines(),
            'packageTypes' => PackageTypes::options(),
            'hasUnassigned' => DpDaily::whereNull('package_type')->exists(),
            'rows' => $rows,
            'actions' => $actions,
            'latest' => $latest,
            'filters' => $filters,
            'thresholds' => config('dp.attainment'),
        ]);
    }

    // Excel export in the tracker layout (one row per date + factory), same filters as the dashboard
    public function export(Request $request, DpExcelExport $exporter)
    {
        [$rows, $actions, $f] = $this->filtered($request);

        $scope = match ($f['mode']) {
            'ww' => !empty($f['ww']) ? 'WW' . $f['ww'] : 'all-weeks',
            'date' => ($f['from'] ?? 'start') . '_to_' . ($f['to'] ?? 'today'),
            default => trim(($f['year'] ?? '') . (!empty($f['quarter']) ? '-Q' . $f['quarter'] : '') . (!empty($f['month']) ? '-M' . $f['month'] : ''), '-'),
        };
        $book = $exporter->build($rows, $actions);

        return response()->streamDownload(function () use ($book) {
            (new XlsxWriter($book))->save('php://output');
        }, "daily-performance-{$scope}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function updateActionStatus(Request $request, DpAction $action)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(DpAction::STATUSES)],
            'status_note' => ['nullable', 'string', 'max:255'],
        ]);
        $action->status = $data['status'];
        if ($request->filled('status_note')) {
            $action->status_note = $data['status_note'];
        }
        $action->save();

        return back()->with('success', 'Action marked ' . $data['status'] . '.');
    }

    // ---------------------------------------------------------------- entry form

    public function entry(Request $request)
    {
        $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'factory' => ['nullable', 'string', 'max:10'],
        ]);
        $date = $request->input('date', now()->toDateString());
        $lines = $this->lines();
        $factory = $lines->firstWhere('code', $request->input('factory'))?->code ?? $lines->first()?->code;

        $rows = DpDaily::with('actions')
            ->whereDate('entry_date', $date)->where('line_code', $factory)
            ->orderBy('package_type')
            ->get();

        $suggestedWw = DpDaily::whereDate('entry_date', $date)->value('cal_workweek')
            ?? DpDaily::whereDate('entry_date', '<=', $date)->orderByDesc('entry_date')->value('cal_workweek');

        // Which factories already have data for this date (shown on the factory tabs)
        $filled = DpDaily::whereDate('entry_date', $date)->groupBy('line_code')
            ->selectRaw('line_code, COUNT(*) AS n')->pluck('n', 'line_code');

        return Inertia::render('DailyPerformance/Entry', [
            'date' => $date,
            'factory' => $factory,
            'calendar' => $this->calendarWeeks()->get(),
            'lines' => $lines,
            'filled' => $filled,
            'packageTypes' => PackageTypes::options(),
            'rows' => $rows,
            'suggestedWw' => $suggestedWw,
        ]);
    }

    // Saves one factory for one date: one dp_daily row per package type.
    // Package rows removed from the form are deleted.
    public function saveDay(SaveDayRequest $request)
    {
        $data = $request->validated();
        $emp = session('emp_data', []);
        $factory = $data['line_code'];
        $saved = 0;

        DB::connection(config('dp.connection'))->transaction(function () use ($data, $emp, $factory, &$saved) {
            $keepIds = [];
            foreach ($data['rows'] as $r) {
                $daily = DpDaily::whereDate('entry_date', $data['entry_date'])
                    ->where('line_code', $factory)
                    ->when(
                        !empty($r['id']),
                        fn ($q) => $q->where('id', $r['id']),
                        fn ($q) => $q->where('package_type', $r['package_type'])
                    )->first()
                    ?? new DpDaily(['entry_date' => $data['entry_date'], 'line_code' => $factory]);

                $daily->fill([
                    'package_type' => $r['package_type'],
                    'cal_workweek' => $data['cal_workweek'],
                    'capacity' => $r['capacity'] ?? null,
                    'wip' => $r['wip'] ?? null,
                    'commit_qty' => $r['commit_qty'] ?? null,
                    'outs' => $r['outs'] ?? null,
                    'capacity_remarks' => filled($r['capacity_remarks'] ?? null) ? trim($r['capacity_remarks']) : null,
                    'gap_analysis' => filled($r['gap_analysis'] ?? null) ? trim($r['gap_analysis']) : null,
                    'entered_by_id' => $emp['emp_id'] ?? null,
                    'entered_by' => $emp['emp_name'] ?? null,
                ])->save();
                $keepIds[] = $daily->id;

                // Keep action ids stable: update sent ones, add new, delete removed
                $actions = collect($r['actions'] ?? [])->filter(fn ($a) => filled($a['action_text'] ?? null))->values();
                $keep = $actions->pluck('id')->filter()->all();
                DpAction::where('daily_id', $daily->id)->when($keep, fn ($q) => $q->whereNotIn('id', $keep))->delete();

                foreach ($actions as $i => $a) {
                    $values = [
                        'action_text' => trim($a['action_text']),
                        'owner' => filled($a['owner'] ?? null) ? trim($a['owner']) : null,
                        ...DpAction::parseWhen($a['when_text'] ?? null),
                        'status' => $a['status'] ?? 'Open',
                        'status_note' => filled($a['status_note'] ?? null) ? trim($a['status_note']) : null,
                        'sort_order' => $i,
                    ];
                    if (!empty($a['id'])) {
                        DpAction::where('id', $a['id'])->where('daily_id', $daily->id)->update($values);
                    } else {
                        DpAction::create([...$values, 'daily_id' => $daily->id]);
                    }
                }
                $saved++;
            }

            // Package rows taken off the form are removed (their actions cascade)
            DpDaily::whereDate('entry_date', $data['entry_date'])->where('line_code', $factory)
                ->when($keepIds, fn ($q) => $q->whereNotIn('id', $keepIds))
                ->delete();

            // Keep every factory on this date in the same work week
            DpDaily::whereDate('entry_date', $data['entry_date'])->update(['cal_workweek' => $data['cal_workweek']]);
        });

        return redirect()
            ->route('dp.entry', ['date' => $data['entry_date'], 'factory' => $factory])
            ->with('success', "Saved {$factory}: {$saved} package type" . ($saved === 1 ? '' : 's') . ' for ' . Carbon::parse($data['entry_date'])->format('M j, Y') . '.');
    }

    public function deleteDay(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'factory' => ['required', 'string', 'max:10'],
        ]);
        $n = DpDaily::whereDate('entry_date', $data['date'])->where('line_code', $data['factory'])->delete();

        return redirect()->route('dp.entry', ['date' => $data['date'], 'factory' => $data['factory']])
            ->with('success', "Deleted {$data['factory']} for this date ({$n} row" . ($n === 1 ? '' : 's') . ').');
    }
}