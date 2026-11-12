<?php

namespace App\Services\DailyPerformance;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

/**
 * Excel export in the tracker layout, one row per date + factory + package type:
 *   Date | WW | FACTORY | Package Type | CAPACITY | WIP | COMMIT | COMMIT TO CAPACITY DELTA |
 *   Commit to Capacity Remarks | OUTS | OUTS TO COMMIT DELTA | Outs to Commit Remarks | ACTIONS | WHO | WHEN | STATUS
 *
 * The two delta columns are Excel formulas, as in the original sheet.
 */
class DpExcelExport
{
    private const HEADERS = [
        'A' => 'Date', 'B' => 'WW', 'C' => 'FACTORY', 'D' => 'Package Type', 'E' => 'CAPACITY', 'F' => 'WIP',
        'G' => 'COMMIT', 'H' => 'COMMIT TO CAPACITY DELTA', 'I' => 'Commit to Capacity Remarks', 'J' => 'OUTS', 'K' => 'OUTS TO COMMIT DELTA',
        'L' => 'Outs to Commit Remarks', 'M' => 'ACTIONS', 'N' => 'WHO', 'O' => 'WHEN', 'P' => 'STATUS',
    ];
    private const WIDTHS = [
        'A' => 11, 'B' => 9, 'C' => 10, 'D' => 13, 'E' => 13, 'F' => 13, 'G' => 13, 'H' => 14, 'I' => 42,
        'J' => 13, 'K' => 14, 'L' => 60, 'M' => 60, 'N' => 16, 'O' => 12, 'P' => 28,
    ];
    private const ACCOUNTING = '_(* #,##0_);_(* \(#,##0\);_(* "-"??_);_(@_)';

    /**
     * @param Collection $rows    dp_daily rows (with package_type)
     * @param Collection $actions action arrays with daily_id, sort_order
     */
    public function build(Collection $rows, Collection $actions): Spreadsheet
    {
        $book = new Spreadsheet();
        $book->getDefaultStyle()->getFont()->setName('Aptos Narrow')->setSize(11);
        $ws = $book->getActiveSheet()->setTitle('Daily Performance');

        foreach (self::HEADERS as $col => $label) {
            if ($label !== null) $ws->setCellValue("{$col}1", $label);
        }
        $ws->getStyle('A1:P1')->getFont()->setBold(true);
        $ws->getStyle('A1:P1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
        foreach (self::WIDTHS as $col => $w) $ws->getColumnDimension($col)->setWidth($w);
        $ws->freezePane('A2');

        $actionsByDaily = $actions->groupBy('daily_id')->map(fn ($g) => $g->sortBy([['sort_order', 'asc'], ['id', 'asc']])->values());

        $r = 2;
        foreach ($rows as $row) {
            $ws->setCellValue("A{$r}", ExcelDate::PHPToExcel(Carbon::parse($this->dateOf($row))));
            $ws->setCellValue("B{$r}", 'WW' . $row->cal_workweek);
            $ws->setCellValue("C{$r}", $row->line_code);
            $ws->setCellValue("D{$r}", $row->package_type ?? 'Unassigned');
            $this->num($ws, "E{$r}", $row->capacity);
            $this->num($ws, "F{$r}", $row->wip);
            $this->num($ws, "G{$r}", $row->commit_qty);
            $ws->setCellValue("H{$r}", "=G{$r}-E{$r}");
            $ws->setCellValue("I{$r}", $row->capacity_remarks);
            $this->num($ws, "J{$r}", $row->outs);
            $ws->setCellValue("K{$r}", $row->outs === null ? null : "=J{$r}-G{$r}");
            $ws->setCellValue("L{$r}", $row->gap_analysis);

            // Actions: one block per action, WHO / WHEN / STATUS padded so they line up
            $M = $N = $O = $P = [];
            foreach ($actionsByDaily->get($row->id, collect()) as $a) {
                $text = trim($a['action_text']);
                $lines = substr_count($text, "\n") + 1;
                $pad = fn ($v) => (string) $v . str_repeat("\n", $lines - 1);
                $M[] = $text;
                $N[] = $pad($a['owner'] ?? '');
                $O[] = $pad($a['when_text'] ?? ($a['due_date'] ?? ''));
                $P[] = $pad(trim($a['status'] . (!empty($a['status_note']) ? ' - ' . $a['status_note'] : '')));
            }
            $ws->setCellValue("M{$r}", $M ? implode("\n\n", $M) : null);
            $ws->setCellValue("N{$r}", $N ? implode("\n\n", $N) : null);
            $ws->setCellValue("O{$r}", $O ? implode("\n\n", $O) : null);
            $ws->setCellValue("P{$r}", $P ? implode("\n\n", $P) : null);
            $r++;
        }

        $last = max(1, $r - 1);
        $all = "A1:P{$last}";
        $ws->getStyle($all)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $ws->getStyle($all)->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
        $ws->getStyle('A1:P1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        if ($last >= 2) {
            $ws->getStyle("A2:A{$last}")->getNumberFormat()->setFormatCode('mm-dd-yy');
            $ws->getStyle("B2:B{$last}")->getFont()->setBold(true);
            $ws->getStyle("B2:K{$last}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $ws->getStyle("E2:H{$last}")->getNumberFormat()->setFormatCode(self::ACCOUNTING);
            $ws->getStyle("J2:K{$last}")->getNumberFormat()->setFormatCode(self::ACCOUNTING);
            $ws->getStyle("I2:I{$last}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setWrapText(true);
            $ws->getStyle("L2:P{$last}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setWrapText(true);
            $ws->setAutoFilter("A1:P{$last}");
        }

        return $book;
    }

    private function dateOf($row): string
    {
        $d = $row->getAttributes()['entry_date'] ?? $row->entry_date;
        return Carbon::parse($d)->toDateString();
    }

    private function num($ws, string $cell, $v): void
    {
        if ($v !== null) $ws->setCellValue($cell, (int) $v);
    }
}
