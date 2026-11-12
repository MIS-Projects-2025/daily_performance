<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Package types now come from qdn_new_db.package_list (DISTINCT package_type),
// so dp_daily stores the package type name instead of an id into dp_package_type.
// Existing rows keep their package type: the name is copied across first.
return new class extends Migration
{
    public function getConnection(): ?string
    {
        return config('dp.connection');
    }

    public function up(): void
    {
        $db = DB::connection($this->getConnection());
        $schema = Schema::connection($this->getConnection());

        $schema->table('dp_daily', function (Blueprint $t) {
            $t->string('package_type', 45)->nullable()->after('line_code');
        });

        if ($schema->hasTable('dp_package_type') && $schema->hasColumn('dp_daily', 'package_type_id')) {
            $db->statement('UPDATE dp_daily d JOIN dp_package_type p ON p.id = d.package_type_id SET d.package_type = p.code');
        }

        $schema->table('dp_daily', function (Blueprint $t) {
            $t->dropUnique('dp_daily_date_line_pkg_unique');
        });
        if ($schema->hasColumn('dp_daily', 'package_type_id')) {
            $schema->table('dp_daily', function (Blueprint $t) {
                $t->dropConstrainedForeignId('package_type_id');
            });
        }
        $schema->table('dp_daily', function (Blueprint $t) {
            $t->unique(['entry_date', 'line_code', 'package_type'], 'dp_daily_date_line_pkgname_unique');
            $t->index('package_type');
        });

        $schema->dropIfExists('dp_package_type');
    }

    public function down(): void
    {
        $db = DB::connection($this->getConnection());
        $schema = Schema::connection($this->getConnection());

        $schema->create('dp_package_type', function (Blueprint $t) {
            $t->id();
            $t->string('code', 40)->unique();
            $t->string('name', 100)->nullable();
            $t->string('line_code', 10)->nullable();
            $t->smallInteger('sort_order')->default(0);
            $t->boolean('active')->default(true);
        });
        $db->statement('INSERT INTO dp_package_type (code, name) SELECT DISTINCT package_type, package_type FROM dp_daily WHERE package_type IS NOT NULL');

        $schema->table('dp_daily', function (Blueprint $t) {
            $t->dropUnique('dp_daily_date_line_pkgname_unique');
            $t->dropIndex(['package_type']);
            $t->foreignId('package_type_id')->nullable()->after('line_code')->constrained('dp_package_type');
        });
        $db->statement('UPDATE dp_daily d JOIN dp_package_type p ON p.code = d.package_type SET d.package_type_id = p.id');
        $schema->table('dp_daily', function (Blueprint $t) {
            $t->dropColumn('package_type');
            $t->unique(['entry_date', 'line_code', 'package_type_id'], 'dp_daily_date_line_pkg_unique');
        });
    }
};
