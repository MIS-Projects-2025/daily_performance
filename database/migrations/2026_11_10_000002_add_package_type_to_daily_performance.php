<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Adds package types: each factory's daily entry now has one row per package type.
// Existing rows are kept with no package type and show as "Unassigned".
return new class extends Migration
{
    public function getConnection(): ?string
    {
        return config('dp.connection');
    }

    public function up(): void
    {
        $schema = Schema::connection($this->getConnection());

        $schema->create('dp_package_type', function (Blueprint $t) {
            $t->id();
            $t->string('code', 40)->unique();            // e.g. QFN/DFN, RM, SOT-23
            $t->string('name', 100)->nullable();
            $t->string('line_code', 10)->nullable();     // limit to one factory; NULL = all factories
            $t->smallInteger('sort_order')->default(0);
            $t->boolean('active')->default(true);
        });

        // Starting list taken from dp.xlsx. Edit freely in the table.
        $types = ['QFN/DFN', 'LGA/LQFP', 'BGA/QFP', 'EMGA', 'OLGA', 'TSOT', 'TSOC', 'MSOP', 'SOT-23', 'RM', 'RN', 'RS', 'RU', 'RW'];
        DB::connection($this->getConnection())->table('dp_package_type')->insert(
            collect($types)->map(fn ($c, $i) => ['code' => $c, 'name' => $c, 'sort_order' => $i + 1, 'active' => 1])->all()
        );

        // Keep the factory foreign key indexed once the old unique key is dropped
        $hasIdx = DB::connection($this->getConnection())->selectOne(
            "SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'dp_daily' AND index_name = 'dp_daily_line_code_idx'"
        )->n > 0;

        $schema->table('dp_daily', function (Blueprint $t) use ($hasIdx) {
            $t->foreignId('package_type_id')->nullable()->after('line_code')->constrained('dp_package_type');
            if (!$hasIdx) {
                $t->index('line_code', 'dp_daily_line_code_idx');
            }
        });
        $schema->table('dp_daily', function (Blueprint $t) {
            $t->dropUnique(['entry_date', 'line_code']);
            $t->unique(['entry_date', 'line_code', 'package_type_id'], 'dp_daily_date_line_pkg_unique');
        });
    }

    public function down(): void
    {
        $schema = Schema::connection($this->getConnection());
        $schema->table('dp_daily', function (Blueprint $t) {
            $t->dropUnique('dp_daily_date_line_pkg_unique');
            $t->dropConstrainedForeignId('package_type_id');
        });
        $schema->table('dp_daily', function (Blueprint $t) {
            $t->unique(['entry_date', 'line_code']);
            // dp_daily_line_code_idx stays: MySQL needs it for the factory foreign key
        });
        $schema->dropIfExists('dp_package_type');
    }
};
