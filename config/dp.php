<?php

// Daily Performance module settings
return [
    // DB connection (from config/database.php) where the dp_* tables live.
    'connection' => env('DP_DB_CONNECTION', env('DB_CONNECTION', 'mysql')),

    // Work-week calendar table: id, cal_year, cal_quarter, cal_month, cal_workweek.
    // It lives in another database on the same MySQL server, so it is named as
    // database.table. The DB user of the connection above needs SELECT on it.
    'calendar_table' => env('DP_CALENDAR_TABLE', 'qdn_new_db.analog_calendar'),

    // Package types: the DISTINCT values of this column in this table
    'package_table' => env('DP_PACKAGE_TABLE', 'qdn_new_db.package_list'),
    'package_column' => env('DP_PACKAGE_COLUMN', 'package_type'),

    // Outs-to-commit attainment colours on the dashboard (percent)
    'attainment' => [
        'good' => 100,   // >= good  -> green
        'watch' => 95,   // >= watch -> amber, below -> red
    ],
];
