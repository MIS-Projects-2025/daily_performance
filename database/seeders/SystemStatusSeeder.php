<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemStatusSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('system_status')->insert([
            'status' => 'online',
            'message' => 'System is currently online and operating normally.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
