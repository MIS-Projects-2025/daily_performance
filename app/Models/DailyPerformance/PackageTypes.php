<?php

namespace App\Models\DailyPerformance;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// Package types = "ALL" + DISTINCT package_type from qdn_new_db.package_list (see config/dp.php)
class PackageTypes
{
    // Extra choice shown first, for a factory-total row that covers all packages
    public const ALL = 'ALL';

    public static function names(): array
    {
        $list = Cache::remember('dp.package_types', 600, function () {
            $col = config('dp.package_column');
            return DB::connection(config('dp.ref_connection'))
                ->table(config('dp.package_table'))
                ->whereNotNull($col)->where($col, '<>', '')
                ->distinct()->orderBy($col)
                ->pluck($col)
                ->map(fn ($v) => trim($v))->unique()->values()->all();
        });

        return [self::ALL, ...array_values(array_filter($list, fn ($n) => strcasecmp($n, self::ALL) !== 0))];
    }

    // Shape used by the pages: [{ id, code }] where id is the name itself
    public static function options(): array
    {
        return array_map(fn ($n) => ['id' => $n, 'code' => $n], static::names());
    }
}

