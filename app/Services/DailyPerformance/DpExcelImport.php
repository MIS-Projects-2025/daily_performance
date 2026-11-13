<?php

namespace App\Services\DailyPerformance;

use App\Models\DailyPerformance\DpAction;
use App\Models\DailyPerformance\DpDaily;
use App\Models\DailyPerformance\DpLine;
use App\Models\DailyPerformance\PackageTypes;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Excel (.xls / .xlsx) import for daily performance entries.
 *
 * One spreadsheet row = one date + factory + package type. To give a package
 * several actions, repeat the row with the same Date / Factory / Package Type
 * and fill only the action columns (the numbers can be repeated or left blank).
 */
class DpExcelImport
{
    // Template columns. Keys are internal names; values are the header text.
    public const COLUMNS = [
        'date' => 'Date',
        'ww' => 'WW',
        'factory' => 'Factory',
        'package_type' => 'Package Type',
        'capacity' => 'Capacity',
        'wip' => 'WIP',
        'commit_qty' => 'Commit',
        'outs' => 'Outs',
        'capacity_remarks' => 'Commit to Capacity Remarks',
        'gap_analysis' => 'Outs to Commit Remarks',
        'action_text' => 'Action',
        'owner' => 'Who',
        'when_text' => 'When',
        'status' => 'Status',
        'status_note' => 'Status Note',
    ];

    // Other header spellings people are likely to use
    private const ALIASES = [
        'entry date' => 'date', 'work week' => 'ww', 'workweek' => 'ww', 'cal_workweek' => 'ww',
        'line' => 'factory', 'line_code' => 'factory', 'package' => 'package_type', 'package_type' => 'package_type',
        'commit qty' => 'commit_qty', 'commit_qty' => 'commit_qty', 'remarks' => 'capacity_remarks',
        'gap' => 'gap_analysis', 'gap analysis' => 'gap_analysis', 'capacity remarks' => 'capacity_remarks',
    ];

    private const NUMBERS = ['capacity', 'wip', 'commit_qty', 'outs'];
    private const TEXTS = ['capacity_remarks', 'gap_analysis'];
    public const MAX_ROWS = 5000;

    // ------------------------------------------------------------------ parse

    /** @return array{groups: array, errors: array, rowCount: int, sheet: string} */
    public function parse(string $path): array
    {
        @set_time_limit(120);
        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $reader->setReadEmptyCells(false);

        // Load only the sheet we need, and only the first rows and columns.
        // Big tracker files often carry other sheets, formatting down to row 1,048,576,
        // or heavy formulas; reading all of that is what makes an upload hang.
        $names = $reader->listWorksheetNames($path);
        $sheetName = in_array('Entries', $names, true) ? 'Entries' : ($names[0] ?? null);
        if ($sheetName !== null) $reader->setLoadSheetsOnly([$sheetName]);
        $reader->setReadFilter(new class(self::MAX_ROWS + 12) implements IReadFilter {
            public function __construct(private int $maxRow) {}
            public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
            {
                return $row <= $this->maxRow && \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($columnAddress) <= 52; // A..AZ
            }
        });
        $book = $reader->load($path);
        $sheet = $book->getActiveSheet();
        $raw = $this->readCells($sheet);

        $errors = [];
        [$headerIdx, $map] = $this->findHeader($raw);
        if ($headerIdx === null) {
            return ['groups' => [], 'errors' => [['row' => null, 'message' => 'No header row found. The sheet needs at least Date, Factory and Package Type columns. Download the template to see the layout.']], 'rowCount' => 0, 'sheet' => $sheet->getTitle()];
        }

        $factories = DpLine::where('active', 1)->pluck('code')->mapWithKeys(fn ($c) => [mb_strtolower($c) => $c])->all();
        $packages = collect(PackageTypes::names())->mapWithKeys(fn ($n) => [mb_strtolower($n) => $n])->all();
        $weeks = DB::connection(config('dp.ref_connection'))->table(config('dp.calendar_table'))->distinct()->pluck('cal_workweek')->map(fn ($w) => (int) $w)->flip()->all();
        $statuses = collect(DpAction::STATUSES)->mapWithKeys(fn ($s) => [mb_strtolower($s) => $s])->all();

        $groups = [];
        $rowCount = 0;
        foreach (array_filter($raw, fn ($k) => $k > $headerIdx, ARRAY_FILTER_USE_KEY) as $i => $cells) {
            $excelRow = $i + 1;
            $v = [];
            foreach ($map as $col => $key) {
                $cell = $cells[$col] ?? null;
                $v[$key] = is_string($cell) ? trim($cell) : $cell;
            }
            if (collect($v)->filter(fn ($x) => $x !== null && $x !== '')->isEmpty()) {
                continue; // blank row
            }
            if (++$rowCount > self::MAX_ROWS) {
                $errors[] = ['row' => $excelRow, 'message' => 'Too many rows. Import at most ' . self::MAX_ROWS . ' rows at a time.'];
                break;
            }

            $rowErrors = [];
            $date = $this->parseDate($v['date'] ?? null);
            if (!$date) $rowErrors[] = 'Date is missing or not a date';

            $factory = $factories[mb_strtolower((string) ($v['factory'] ?? ''))] ?? null;
            if (!$factory) $rowErrors[] = blank($v['factory'] ?? null) ? 'Factory is missing' : "Factory \"{$v['factory']}\" is not one of " . implode(', ', array_values($factories));

            $package = $packages[mb_strtolower((string) ($v['package_type'] ?? ''))] ?? null;
            if (!$package) $rowErrors[] = blank($v['package_type'] ?? null) ? 'Package Type is missing' : "Package Type \"{$v['package_type']}\" is not in " . config('dp.package_table');

            $ww = null;
            if (filled($v['ww'] ?? null)) {
                $ww = (int) preg_replace('/\D/', '', (string) $v['ww']);
                if (!isset($weeks[$ww])) $rowErrors[] = "WW \"{$v['ww']}\" is not in " . config('dp.calendar_table');
            }

            $nums = [];
            foreach (self::NUMBERS as $k) {
                $n = $this->parseNumber($v[$k] ?? null);
                if ($n === false) $rowErrors[] = self::COLUMNS[$k] . " \"{$v[$k]}\" is not a whole number";
                else $nums[$k] = $n;
            }

            $action = null;
            if (filled($v['action_text'] ?? null)) {
                $status = $statuses[mb_strtolower((string) ($v['status'] ?? ''))] ?? (blank($v['status'] ?? null) ? 'Open' : null);
                if (!$status) $rowErrors[] = "Status \"{$v['status']}\" must be one of " . implode(', ', DpAction::STATUSES);
                $when = $v['when_text'] ?? null;
                if (is_numeric($when) && $when > 20000 && $when < 80000) { // a date cell
                    $when = ExcelDate::excelToDateTimeObject($when)->format('Y-m-d');
                }
                $action = [
                    'action_text' => (string) $v['action_text'],
                    'owner' => filled($v['owner'] ?? null) ? (string) $v['owner'] : null,
                    'when_text' => filled($when) ? mb_substr((string) $when, 0, 30) : null,
                    'status' => $status ?? 'Open',
                    'status_note' => filled($v['status_note'] ?? null) ? mb_substr((string) $v['status_note'], 0, 255) : null,
                ];
            }

            if ($rowErrors) {
                foreach ($rowErrors as $m) $errors[] = ['row' => $excelRow, 'message' => $m];
                continue;
            }

            $key = "{$date}|{$factory}|{$package}";
            $g = $groups[$key] ?? [
                'entry_date' => $date, 'line_code' => $factory, 'package_type' => $package, 'cal_workweek' => null,
                'capacity' => null, 'wip' => null, 'commit_qty' => null, 'outs' => null,
                'capacity_remarks' => null, 'gap_analysis' => null, 'actions' => [], 'rows' => [],
            ];
            $g['rows'][] = $excelRow;

            // The same date/factory/package on several rows must not disagree
            foreach (['cal_workweek' => $ww] + $nums as $k => $val) {
                if ($val === null) continue;
                if ($g[$k] !== null && $g[$k] !== $val) {
                    $errors[] = ['row' => $excelRow, 'message' => ($k === 'cal_workweek' ? 'WW' : self::COLUMNS[$k]) . " differs from row {$g['rows'][0]} for {$factory} {$package} on {$date}"];
                }
                $g[$k] ??= $val;
            }
            foreach (self::TEXTS as $k) {
                if (filled($v[$k] ?? null)) {
                    $g[$k] = $g[$k] === null ? (string) $v[$k] : ($g[$k] === (string) $v[$k] ? $g[$k] : $g[$k] . "\n" . $v[$k]);
                }
            }
            if ($action) $g['actions'][] = $action;
            $groups[$key] = $g;
        }

        if (!$rowCount && !$errors) {
            $errors[] = ['row' => null, 'message' => 'The sheet has a header row but no data under it.'];
        }

        // Fill a missing WW from another row on the same date, or from what is already saved
        $byDateWw = [];
        foreach ($groups as $g) if ($g['cal_workweek']) $byDateWw[$g['entry_date']] ??= $g['cal_workweek'];
        foreach ($groups as $k => $g) {
            if ($g['cal_workweek']) continue;
            $ww = $byDateWw[$g['entry_date']] ?? DpDaily::whereDate('entry_date', $g['entry_date'])->value('cal_workweek');
            if ($ww) {
                $groups[$k]['cal_workweek'] = (int) $ww;
            } else {
                $errors[] = ['row' => $g['rows'][0], 'message' => "WW is missing for {$g['entry_date']} and nothing is saved for that date yet"];
            }
        }

        // Mark what is new and what updates saved data
        foreach ($groups as $k => $g) {
            $groups[$k]['exists'] = DpDaily::whereDate('entry_date', $g['entry_date'])
                ->where('line_code', $g['line_code'])->where('package_type', $g['package_type'])->exists();
        }

        ksort($groups);
        usort($errors, fn ($a, $b) => ($a['row'] ?? 0) <=> ($b['row'] ?? 0));

        return ['groups' => array_values($groups), 'errors' => $errors, 'rowCount' => $rowCount, 'sheet' => $sheet->getTitle()];
    }

    /**
     * Cell values as rows of [colIndex => value], 0-based like toArray().
     * Formulas are not recalculated: the value Excel last saved is used, which is
     * what the user sees and avoids slow or failing recalculation on the server.
     */
    private function readCells(Worksheet $sheet): array
    {
        $raw = [];
        foreach ($sheet->getCellCollection()->getCoordinates() as $coord) {
            $cell = $sheet->getCell($coord);
            $v = $cell->getValue();
            if ($cell->isFormula()) $v = $cell->getOldCalculatedValue();
            if ($v instanceof \PhpOffice\PhpSpreadsheet\RichText\RichText) $v = $v->getPlainText();
            if ($v === null || $v === '') continue;
            $raw[$cell->getRow() - 1][\PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($cell->getColumn()) - 1] = $v;
        }
        ksort($raw);
        foreach ($raw as &$r) ksort($r);
        return $raw;
    }

    private function findHeader(array $raw): array
    {
        $known = collect(self::COLUMNS)->mapWithKeys(fn ($label, $key) => [mb_strtolower($label) => $key])->all() + self::ALIASES;
        foreach (array_slice($raw, 0, 10, true) as $i => $cells) {
            $map = [];
            foreach ($cells as $col => $cell) {
                $h = mb_strtolower(trim(preg_replace('/\s+/', ' ', (string) $cell)));
                if (isset($known[$h]) && !in_array($known[$h], $map, true)) $map[$col] = $known[$h];
            }
            if (in_array('date', $map, true) && in_array('factory', $map, true) && in_array('package_type', $map, true)) {
                return [$i, $map];
            }
        }
        return [null, []];
    }

    private function parseDate($v): ?string
    {
        if ($v === null || $v === '') return null;
        try {
            if (is_numeric($v)) return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $v))->toDateString();
            if ($v instanceof \DateTimeInterface) return Carbon::instance($v)->toDateString();
            foreach (['Y-m-d', 'm/d/Y', 'n/j/Y', 'm/d/y', 'd-M-Y', 'd-M-y', 'M d Y', 'M d, Y', 'F j, Y'] as $fmt) {
                $d = \DateTime::createFromFormat('!' . $fmt, (string) $v);
                if ($d && $d->format($fmt) == $v) return $d->format('Y-m-d');
            }
            return Carbon::parse((string) $v)->toDateString();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /** @return int|null|false  false = not a number */
    private function parseNumber($v)
    {
        if ($v === null || $v === '') return null;
        if (is_int($v)) return $v;
        if (is_float($v)) return (int) round($v);
        $s = str_replace([',', ' '], '', (string) $v);
        if (preg_match('/^-?\d+(\.\d+)?$/', $s)) return (int) round((float) $s);
        return false;
    }

    // ------------------------------------------------------------------ save

    /**
     * Saves parsed groups. Blank cells keep what is already saved, so a file with
     * only Outs filled in updates Outs without wiping Capacity or Commit.
     * Actions are matched on their text: a known action is updated, a new one added.
     */
    public function commit(array $groups, array $emp): array
    {
        $created = 0;
        $updated = 0;
        $actions = 0;

        DB::connection(config('dp.connection'))->transaction(function () use ($groups, $emp, &$created, &$updated, &$actions) {
            foreach ($groups as $g) {
                $daily = DpDaily::whereDate('entry_date', $g['entry_date'])
                    ->where('line_code', $g['line_code'])->where('package_type', $g['package_type'])->first();
                $isNew = !$daily;
                $daily ??= new DpDaily(['entry_date' => $g['entry_date'], 'line_code' => $g['line_code'], 'package_type' => $g['package_type']]);

                $fill = ['cal_workweek' => $g['cal_workweek'], 'entered_by_id' => $emp['emp_id'] ?? null, 'entered_by' => $emp['emp_name'] ?? null];
                foreach ([...self::NUMBERS, ...self::TEXTS] as $k) {
                    if ($g[$k] !== null) $fill[$k] = $g[$k];
                }
                $daily->fill($fill)->save();
                $isNew ? $created++ : $updated++;

                $existing = DpAction::where('daily_id', $daily->id)->get()->keyBy(fn ($a) => mb_strtolower(trim($a->action_text)));
                $order = $existing->count();
                foreach ($g['actions'] as $a) {
                    $values = [
                        'action_text' => $a['action_text'],
                        'owner' => $a['owner'],
                        ...DpAction::parseWhen($a['when_text']),
                        'status' => $a['status'],
                        'status_note' => $a['status_note'],
                    ];
                    if ($found = $existing->get(mb_strtolower(trim($a['action_text'])))) {
                        $found->update($values);
                    } else {
                        DpAction::create([...$values, 'daily_id' => $daily->id, 'sort_order' => $order++]);
                    }
                    $actions++;
                }

                // Keep every factory on that date in the same work week
                DpDaily::whereDate('entry_date', $g['entry_date'])->update(['cal_workweek' => $g['cal_workweek']]);
            }
        });

        return compact('created', 'updated', 'actions');
    }

    // ------------------------------------------------------------------ template

    public function template(): Spreadsheet
    {
        $book = new Spreadsheet();
        $ws = $book->getActiveSheet()->setTitle('Entries');
        $cols = array_values(self::COLUMNS);
        $ws->fromArray($cols, null, 'A1');

        $lastCol = chr(ord('A') + count($cols) - 1);
        $ws->getStyle("A1:{$lastCol}1")->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $ws->getStyle("A1:{$lastCol}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1E7B3C');
        $ws->freezePane('A2');
        foreach (range('A', $lastCol) as $c) {
            $ws->getColumnDimension($c)->setWidth(in_array($c, ['I', 'J', 'K'], true) ? 40 : 14);
        }

        // Example rows (from dp.xlsx). Delete them before importing your own data.
        $pk = PackageTypes::names();
        $p1 = $pk[0] ?? 'PACKAGE';
        $p2 = $pk[1] ?? $p1;
        $ex = [
            ['2026-11-07', 701, 'F1', $p1, 5360000, 9410238, 3970258, 3843811, '720K open capacity', null, null, null, null, null, null],
            ['2026-11-07', 701, 'F3', $p2, 3928000, 7568721, 2808181, 2698672, '240K EMGA capacity constraint', '320K capacity loss on 12 machines: 5 hrs DT, depleted carrier tape', 'Complete approval of remaining secondary materials', 'Realyn', 'WW702', 'Ongoing', '5 item codes approved'],
            ['2026-11-07', 701, 'F3', $p2, null, null, null, null, null, null, 'VTRX042: adjust vacuum pressure and purge on time', 'EE Technician', '2026-11-08', 'Done', 'Machines are running'],
        ];
        foreach ($ex as $i => $row) {
            $row[0] = ExcelDate::stringToExcel($row[0]); // real Excel dates, not text
            $ex[$i] = $row;
        }
        $ws->fromArray($ex, null, 'A2', true);
        $ws->getStyle('A2:A1000')->getNumberFormat()->setFormatCode('yyyy-mm-dd');
        $ws->getStyle('E2:H1000')->getNumberFormat()->setFormatCode('#,##0');
        $ws->getStyle("A2:{$lastCol}4")->getFont()->setItalic(true)->getColor()->setRGB('7A7A7A');

        // Lists sheet feeds the drop-downs
        $lists = $book->createSheet()->setTitle('Lists');
        $factories = DpLine::where('active', 1)->orderBy('sort_order')->pluck('code')->all();
        $lists->setCellValue('A1', 'Factory')->setCellValue('B1', 'Package Type')->setCellValue('C1', 'Status');
        foreach ($factories as $i => $f) $lists->setCellValue('A' . ($i + 2), $f);
        foreach ($pk as $i => $p) $lists->setCellValueExplicit('B' . ($i + 2), $p, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
        foreach (DpAction::STATUSES as $i => $s) $lists->setCellValue('C' . ($i + 2), $s);
        $lists->getStyle('A1:C1')->getFont()->setBold(true);
        foreach (['A' => 10, 'B' => 24, 'C' => 12] as $c => $w) $lists->getColumnDimension($c)->setWidth($w);

        $this->dropdown($ws, 'C2:C1000', 'Lists!$A$2:$A$' . (count($factories) + 1));
        if ($pk) $this->dropdown($ws, 'D2:D1000', 'Lists!$B$2:$B$' . (count($pk) + 1));
        $this->dropdown($ws, 'N2:N1000', 'Lists!$C$2:$C$' . (count(DpAction::STATUSES) + 1));

        // Short instructions
        $help = $book->createSheet()->setTitle('How to');
        $lines = [
            'How to fill the Entries sheet',
            '',
            '1. One row per date + factory + package type.',
            '2. Date as yyyy-mm-dd (or any Excel date). WW like 701 or WW701; leave it blank to use the WW already saved for that date.',
            '3. Factory and Package Type must match the drop-downs (Lists sheet).',
            '4. Capacity, WIP, Commit, Outs: whole numbers. Commit - capacity and outs - commit are calculated, no need to enter them.',
            '5. Blank cells do not overwrite saved values, so you can import Outs later on its own.',
            '6. More than one action for a package: repeat the row with the same Date, Factory and Package Type and fill only the action columns.',
            '7. Status: Open, Ongoing, Done or Sustain (Open if blank). When: WW702 or a date.',
            '8. Delete the grey example rows before importing.',
        ];
        foreach ($lines as $i => $l) $help->setCellValue('A' . ($i + 1), $l);
        $help->getStyle('A1')->getFont()->setBold(true)->setSize(13);
        $help->getColumnDimension('A')->setWidth(120);

        $book->setActiveSheetIndex(0);
        return $book;
    }

    private function dropdown($ws, string $range, string $source): void
    {
        $dv = new DataValidation();
        $dv->setType(DataValidation::TYPE_LIST)->setAllowBlank(true)->setShowDropDown(true)
            ->setShowErrorMessage(true)->setErrorTitle('Not in the list')->setError('Pick a value from the drop-down.')
            ->setFormula1($source);
        $ws->setDataValidation($range, $dv);
    }
}
