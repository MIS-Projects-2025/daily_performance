# Daily Performance module for your Laravel template

Unzip this into the root of your project. The folders line up with yours (`app`, `config`, `database`, `resources`, `routes`).

## Files

**New files** (nothing of yours is overwritten):

- `config/dp.php`: which DB connection and calendar table to use, and the attainment colour thresholds.
- `database/migrations/2026_11_10_000001_create_daily_performance_tables.php`: creates `dp_line` (the factories, seeded with F1, F2, F3), `dp_daily` and `dp_action`.
- `database/migrations/2026_11_10_000002_add_package_type_to_daily_performance.php`: adds `dp_package_type` (seeded from dp.xlsx: QFN/DFN, LGA/LQFP, BGA/QFP, EMGA, OLGA, TSOT, TSOC, MSOP, SOT-23, RM, RN, RS, RU, RW) and a `package_type_id` on `dp_daily`. Each factory's day is then one row per package type.
- `app/Models/DailyPerformance/DpLine.php`, `DpDaily.php`, `DpAction.php`, `DpPackageType.php`
- `app/Http/Controllers/DailyPerformance/DailyPerformanceController.php`
- `app/Http/Requests/DailyPerformance/SaveDayRequest.php`
- `resources/js/Pages/DailyPerformance/Dashboard.jsx` and `Entry.jsx`
- `resources/js/Components/DailyPerformance/Bits.jsx`: small shared pieces (attainment pill, delta, panel).
- `resources/js/lib/dp.js`: number and date formatting, chart colours.
- `database/sample_data.sql` (optional): the 7 and 8 Nov rows from dp.xlsx.

**Changed files**, each a copy of yours with a few lines added. Merge them by hand if you've edited yours since:

- `routes/general.php`: one `use` line, plus a `daily-performance` route group inside your `AuthMiddleware` group.
- `resources/js/Components/sidebar/Navigation.jsx`: two sidebar links, "Performance Dashboard" and "Daily Entry".

## Steps

1. Copy the files in.
2. In `.env`, set the connection that holds `analog_calendar`. If that's your default `worksched` connection, you can skip this.
   ```
   DP_DB_CONNECTION=worksched
   DP_CALENDAR_TABLE=analog_calendar
   ```
3. Run both migrations. If you already ran the first one, only the second runs.
   ```
   php artisan migrate --path=database/migrations/2026_11_10_000001_create_daily_performance_tables.php
   php artisan migrate --path=database/migrations/2026_11_10_000002_add_package_type_to_daily_performance.php
   ```
   Optionally load `database/sample_data.sql` into the same database.
4. If you cache config or routes: `php artisan optimize:clear`.
5. Run `npm run build` (or `npm run dev`). No new npm packages are needed: it uses `chart.js`, `react-chartjs-2`, `lucide-react` and `sonner`, which are already in your template.
6. Open `/{APP_NAME}/daily-performance` for the dashboard and `/{APP_NAME}/daily-performance/entry` for the form.

## Routes (all behind AuthMiddleware)

| Method | URL | Name |
|---|---|---|
| GET | `daily-performance` | `dp.dashboard` |
| GET | `daily-performance/entry?date=YYYY-MM-DD&factory=F1` | `dp.entry` |
| POST | `daily-performance/entry` | `dp.save` |
| DELETE | `daily-performance/entry` | `dp.delete` |
| PATCH | `daily-performance/actions/{action}` | `dp.action.status` |

## How it behaves

- **Who entered it.** Every save records `emp_id` and `emp_name` from your Authify session, in `entered_by_id` and `entered_by`.
- **Deltas.** Commit − capacity and outs − commit are MySQL generated columns, so they can't drift from the inputs.
- **Entry per factory.** Pick the date, then a factory tab (F1, F2, F3). Each tab shows whether that factory is already entered for the date. Add one row per package type with Capacity, WIP, Commit and Outs, plus its own remarks, gap analysis and actions. Save stores that factory only. Removing a package row and saving deletes it. "Delete F2" removes that factory for the date.
- **Package types.** The list lives in `dp_package_type`. Add, rename or deactivate types there. Set `line_code` on a type to offer it only for that factory; NULL offers it everywhere.
- **Older rows.** Rows saved before package types existed (including the sample data) show as "Unassigned". The form asks for a package type the next time that factory and date is saved.
- **Number input.** Numbers can be typed with commas ("5,360,000").
- **Actions.** Each action has its own Who, When (`WW702` or a date) and Status (Open, Ongoing, Done, Sustain). Dated actions still Open or Ongoing after their date show as overdue. Status can also be changed from the dashboard's action tracker.
- **Dashboard filters.** Filter by work week, date range, or year/quarter/month from `analog_calendar`, plus factory toggles and a package type multi-select. The filters live in the URL, so a filtered view can be bookmarked or shared.
- **Package view.** A "By package type" table totals the period per package, biggest miss first. The daily sheet groups by date, then factory, with one row per package and factory and day totals. The action tracker shows each action's package.
- **Theme.** The pages follow your light/dark toggle and use your shadcn colour tokens. Buttons use your green primary.

## Tested

I tested this in a scratch Laravel 12 + Inertia + React install with your app, config, resources and routes folders and your AuthMiddleware, on MariaDB. Login worked through an Authify session row. I checked the migration, the dashboard in all three filter modes, line toggles, saving a day with actions, the invalid-number check, changing a status, dark mode and phone width.

## Still to confirm

- **Work week from a date.** `analog_calendar` has no date column, so the form pre-selects the WW of the most recent earlier entry and the user can change it. If the table has a date or a week start/end column, the controller can pick the WW automatically.
- **Who can enter data.** Anyone who passes AuthMiddleware can enter data. If entry should be limited to certain people, wrap the POST, DELETE and PATCH routes in your `AdminMiddleware`, or in a new middleware based on job level.
