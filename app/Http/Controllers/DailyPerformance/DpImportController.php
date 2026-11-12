<?php

namespace App\Http\Controllers\DailyPerformance;

use App\Http\Controllers\Controller;
use App\Services\DailyPerformance\DpExcelImport;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// Import daily performance entries from .xls / .xlsx: upload -> check & preview -> confirm
class DpImportController extends Controller
{
    private const SESSION_KEY = 'dp_import';

    public function __construct(private DpExcelImport $importer) {}

    public function page(Request $request)
    {
        if ($request->boolean('clear')) {
            session()->forget(self::SESSION_KEY);
            return redirect()->route('dp.import');
        }

        $p = session(self::SESSION_KEY);

        return Inertia::render('DailyPerformance/Import', [
            'preview' => $p ? [
                'token' => $p['token'],
                'filename' => $p['filename'],
                'sheet' => $p['sheet'],
                'rowCount' => $p['rowCount'],
                'groups' => $p['groups'],
                'errors' => $p['errors'],
            ] : null,
            'columns' => array_values(DpExcelImport::COLUMNS),
            'maxRows' => DpExcelImport::MAX_ROWS,
        ]);
    }

    public function template()
    {
        $book = $this->importer->template();

        return response()->streamDownload(function () use ($book) {
            (new Xlsx($book))->save('php://output');
        }, 'daily-performance-import-template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'max:5120']], [
            'file.required' => 'Choose an Excel file first.',
            'file.max' => 'The file is larger than 5 MB.',
        ]);
        $file = $request->file('file');
        if (!in_array(strtolower($file->getClientOriginalExtension()), ['xls', 'xlsx'], true)) {
            return back()->withErrors(['file' => 'Upload an .xls or .xlsx file.']);
        }

        try {
            $result = $this->importer->parse($file->getRealPath());
        } catch (\Throwable $e) {
            report($e);
            return back()->withErrors(['file' => 'Could not read this file as Excel. Save it as .xlsx and try again.']);
        }

        session([self::SESSION_KEY => [
            'token' => (string) Str::uuid(),
            'filename' => $file->getClientOriginalName(),
            ...$result,
        ]]);

        return redirect()->route('dp.import');
    }

    public function commit(Request $request)
    {
        $p = session(self::SESSION_KEY);
        if (!$p || $request->input('token') !== $p['token']) {
            return redirect()->route('dp.import')->with('error', 'That preview has expired. Upload the file again.');
        }
        if (!empty($p['errors']) || empty($p['groups'])) {
            return redirect()->route('dp.import')->with('error', 'Fix the problems listed, then upload the file again.');
        }

        $r = $this->importer->commit($p['groups'], session('emp_data', []));
        session()->forget(self::SESSION_KEY);

        $dates = collect($p['groups'])->pluck('entry_date')->unique()->sort()->values();

        return redirect()->route('dp.dashboard', [
            'mode' => 'date', 'from' => $dates->first(), 'to' => $dates->last(),
        ])->with('success', "Imported {$p['filename']}: {$r['created']} new, {$r['updated']} updated, {$r['actions']} action(s).");
    }
}
