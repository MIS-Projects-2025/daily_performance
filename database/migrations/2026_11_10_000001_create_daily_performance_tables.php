<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Creates dp_line, dp_daily, dp_action. analog_calendar is only read, never changed.
return new class extends Migration
{
    public function getConnection(): ?string
    {
        return config('dp.connection');
    }

    public function up(): void
    {
        $schema = Schema::connection($this->getConnection());

        $schema->create('dp_line', function (Blueprint $t) {
            $t->string('code', 10)->primary();          // F1, F2, F3 ...
            $t->string('name', 60)->nullable();
            $t->smallInteger('sort_order')->default(0);
            $t->boolean('active')->default(true);
        });

        DB::connection($this->getConnection())->table('dp_line')->insert([
            ['code' => 'F1', 'name' => 'F1', 'sort_order' => 1, 'active' => 1],
            ['code' => 'F2', 'name' => 'F2', 'sort_order' => 2, 'active' => 1],
            ['code' => 'F3', 'name' => 'F3', 'sort_order' => 3, 'active' => 1],
        ]);

        // One row per date per line (the F1/F2/F3 rows of each daily block in dp.xlsx)
        $schema->create('dp_daily', function (Blueprint $t) {
            $t->id();
            $t->date('entry_date');
            $t->integer('cal_workweek');                // analog_calendar.cal_workweek, e.g. 701
            $t->string('line_code', 10);
            $t->bigInteger('capacity')->nullable();
            $t->bigInteger('wip')->nullable();
            $t->bigInteger('commit_qty')->nullable();
            $t->bigInteger('commit_capacity_delta')->storedAs('commit_qty - capacity');
            $t->text('capacity_remarks')->nullable();   // notes beside the delta: open capacity, constraints
            $t->bigInteger('outs')->nullable();
            $t->bigInteger('outs_commit_delta')->storedAs('outs - commit_qty');
            $t->text('gap_analysis')->nullable();
            $t->string('entered_by_id', 30)->nullable();
            $t->string('entered_by', 100)->nullable();
            $t->timestamps();

            $t->unique(['entry_date', 'line_code']);
            $t->index('cal_workweek');
            $t->foreign('line_code')->references('code')->on('dp_line');
        });

        // ACTIONS / WHO / WHEN / STATUS: one row per action item
        $schema->create('dp_action', function (Blueprint $t) {
            $t->id();
            $t->foreignId('daily_id')->constrained('dp_daily')->cascadeOnDelete();
            $t->text('action_text');
            $t->string('owner', 100)->nullable();       // WHO
            $t->string('when_text', 30)->nullable();    // WHEN as typed: WW702 or 2026-11-08
            $t->date('due_date')->nullable();
            $t->integer('due_ww')->nullable();
            $t->enum('status', ['Open', 'Ongoing', 'Done', 'Sustain'])->default('Open');
            $t->string('status_note', 255)->nullable();
            $t->smallInteger('sort_order')->default(0);
            $t->timestamps();

            $t->index('status');
        });
    }

    public function down(): void
    {
        $schema = Schema::connection($this->getConnection());
        $schema->dropIfExists('dp_action');
        $schema->dropIfExists('dp_daily');
        $schema->dropIfExists('dp_line');
    }
};
