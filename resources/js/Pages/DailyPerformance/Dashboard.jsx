import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, PencilLine } from "lucide-react";
import {
    Chart as ChartJS,
    BarController,
    BarElement,
    CategoryScale,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from "chart.js";
import { Chart, Line } from "react-chartjs-2";
import { ThemeContext } from "@/Components/ThemeContext";
import { cn } from "@/lib/utils";
import { AttainmentPill, Delta, Label, Panel, inputCls, statusTone } from "@/Components/DailyPerformance/Bits";
import {
    byDate,
    chartColors,
    dateLabel,
    full,
    lineColor,
    longDate,
    OPEN_STATUSES,
    pct,
    short,
    STATUSES,
    sum,
    today,
    ww,
} from "@/lib/dp";

ChartJS.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

const Tile = ({ label, value, children, title }) => (
    <div className="flex min-w-0 flex-col gap-1 bg-card px-4 py-3.5" title={title}>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl font-medium tracking-tight tabular-nums">{value}</span>
        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{children}</span>
    </div>
);

export default function Dashboard({ calendar, lines, packageTypes, hasUnassigned, rows, actions, filters, thresholds, latest }) {
    const { flash } = usePage().props;
    const { theme } = useContext(ThemeContext);
    const [statusView, setStatusView] = useState("open");
    const days = useMemo(() => byDate(rows), [rows]);
    const activeLines = filters.lines?.length ? filters.lines : lines.map((l) => l.code);
    const lineIndex = (code) => lines.findIndex((l) => l.code === code);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // ----- filters: every change is a GET with the new query string
    const apply = (patch) => {
        const next = { ...filters, ...patch };
        Object.keys(next).forEach((k) => (next[k] === "" || next[k] == null) && delete next[k]);
        router.get(route("dp.dashboard"), next, { preserveState: true, preserveScroll: true, replace: true });
    };
    const setMode = (mode) => {
        const latestCal = calendar.find((c) => c.cal_workweek === latest?.cal_workweek);
        const end = latest?.entry_date ? String(latest.entry_date).slice(0, 10) : today();
        const start = new Date(new Date(end + "T00:00:00").getTime() - 6 * 864e5);
        const defaults = {
            ww: { ww: filters.ww ?? latest?.cal_workweek },
            date: { from: filters.from ?? new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 10), to: filters.to ?? end },
            period: { year: filters.year ?? latestCal?.cal_year, quarter: filters.quarter ?? latestCal?.cal_quarter },
        }[mode];
        apply({ mode, ...defaults });
    };
    const toggleLine = (code) => {
        const on = activeLines.includes(code);
        const next = on ? activeLines.filter((c) => c !== code) : [...activeLines, code];
        if (!next.length) return; // keep at least one line
        apply({ lines: next.length === lines.length ? null : lines.map((l) => l.code).filter((c) => next.includes(c)) });
    };

    // Package type filter (multi-select). "__none__" = rows saved without a package type
    const pkgOptions = [...packageTypes.map((p) => ({ id: String(p.id), code: p.code })), ...(hasUnassigned ? [{ id: "__none__", code: "Unassigned" }] : [])];
    const activePkgs = (filters.packages || []).map(String);
    const togglePkg = (id) => {
        const next = activePkgs.includes(id) ? activePkgs.filter((x) => x !== id) : [...activePkgs, id];
        apply({ packages: next.length ? next : null });
    };
    const pkgLabel = !activePkgs.length
        ? "All package types"
        : activePkgs.length <= 2
          ? activePkgs.map((id) => pkgOptions.find((o) => o.id === id)?.code).join(", ")
          : `${activePkgs.length} package types`;
    const pkgOf = (r) => r.package_code || "Unassigned";

    const years = [...new Set(calendar.map((c) => c.cal_year))];
    const inYear = calendar.filter((c) => c.cal_year === filters.year);
    const quarters = [...new Set(inYear.map((c) => c.cal_quarter))];
    const months = [...new Set(inYear.filter((c) => !filters.quarter || String(c.cal_quarter) === String(filters.quarter)).map((c) => c.cal_month))];

    const scope =
        filters.mode === "ww"
            ? filters.ww
                ? ww(filters.ww)
                : "All weeks"
            : filters.mode === "date"
              ? filters.from && filters.from === filters.to
                  ? longDate(filters.from)
                  : `${filters.from ? dateLabel(filters.from) : "start"} to ${filters.to ? dateLabel(filters.to) : "today"}`
              : `${filters.year ?? ""}${filters.quarter ? " Q" + filters.quarter : ""}${filters.month ? " · Month " + filters.month : ""}`;

    // ----- KPIs
    const kpi = useMemo(() => {
        if (!rows.length) return null;
        const withOuts = rows.filter((r) => r.outs != null);
        const cap = sum(rows, "capacity");
        const com = sum(rows, "commit_qty");
        const outs = sum(withOuts, "outs");
        const comOuts = sum(withOuts, "commit_qty");
        const last = days[days.length - 1];
        const open = actions.filter((a) => OPEN_STATUSES.includes(a.status));
        return {
            cap,
            com,
            outs,
            att: pct(outs, comOuts),
            delta: outs - comOuts,
            wip: sum(last[1], "wip"),
            wipDate: last[0],
            lineDays: withOuts.length,
            open: open.length,
            overdue: open.filter((a) => a.due_date && String(a.due_date).slice(0, 10) < today()).length,
        };
    }, [rows, actions, days]);

    // ----- by package type for the whole period, worst miss first
    const byPkg = useMemo(() => {
        const m = new Map();
        for (const r of rows) {
            const k = pkgOf(r);
            if (!m.has(k)) m.set(k, []);
            m.get(k).push(r);
        }
        return [...m.entries()]
            .map(([code, rs]) => {
                const wo = rs.filter((r) => r.outs != null);
                return {
                    code,
                    factories: [...new Set(rs.map((r) => r.line_code))].join(", "),
                    cap: sum(rs, "capacity"),
                    com: sum(rs, "commit_qty"),
                    outs: wo.length ? sum(wo, "outs") : null,
                    delta: wo.length ? sum(wo, "outs") - sum(wo, "commit_qty") : null,
                    att: wo.length ? pct(sum(wo, "outs"), sum(wo, "commit_qty")) : null,
                };
            })
            .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));
    }, [rows]);

    // ----- charts
    const c = chartColors(theme);
    const labels = days.map(([d]) => dateLabel(d));
    const base = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: c.surface,
                titleColor: c.ink,
                bodyColor: c.ink,
                footerColor: c.muted,
                borderColor: c.axis,
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true,
            },
        },
        scales: {
            x: { grid: { display: false }, border: { color: c.axis }, ticks: { color: c.muted } },
            y: { grid: { color: c.grid }, border: { display: false }, ticks: { color: c.muted } },
        },
    };
    const bar = { borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: "bottom", maxBarThickness: 36, categoryPercentage: 0.6, barPercentage: 0.92, order: 2 };
    const dailyData = {
        labels,
        datasets: [
            { type: "bar", label: "Commit", data: days.map(([, r]) => sum(r, "commit_qty")), backgroundColor: c.commit, ...bar },
            {
                type: "bar",
                label: "Outs",
                data: days.map(([, r]) => (r.some((x) => x.outs != null) ? sum(r, "outs") : null)),
                backgroundColor: c.outs,
                ...bar,
            },
            {
                type: "line",
                label: "Capacity",
                data: days.map(([, r]) => sum(r, "capacity")),
                borderColor: c.cap,
                borderWidth: 2,
                borderDash: [5, 4],
                pointRadius: 4,
                pointBackgroundColor: c.cap,
                pointBorderColor: c.surface,
                pointBorderWidth: 2,
                order: 1,
            },
        ],
    };
    const dailyOptions = {
        ...base,
        scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: true, ticks: { ...base.scales.y.ticks, callback: (v) => short(v) } } },
        plugins: {
            ...base.plugins,
            tooltip: {
                ...base.plugins.tooltip,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${full(ctx.raw)}`,
                    footer: (items) => {
                        const com = items.find((i) => i.dataset.label === "Commit")?.raw;
                        const outs = items.find((i) => i.dataset.label === "Outs")?.raw;
                        return outs != null && com ? `Attainment ${pct(outs, com)}%  ·  Δ ${outs - com > 0 ? "+" : ""}${full(outs - com)}` : "";
                    },
                },
            },
        },
    };

    const lineSets = activeLines.map((code) => {
        const color = lineColor(lineIndex(code), theme);
        return {
            label: code,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBorderColor: c.surface,
            pointBorderWidth: 2,
            spanGaps: true,
            data: days.map(([, r]) => {
                const xs = r.filter((y) => y.line_code === code && y.outs != null);
                return xs.length ? pct(sum(xs, "outs"), sum(xs, "commit_qty")) : null;
            }),
        };
    });
    const vals = lineSets.flatMap((s) => s.data).filter((v) => v != null);
    const attData = {
        labels,
        datasets: [
            ...lineSets,
            { label: "Target", data: labels.map(() => thresholds.good), borderColor: c.muted, borderDash: [3, 3], borderWidth: 1, pointRadius: 0, pointHoverRadius: 0 },
        ],
    };
    const attOptions = {
        ...base,
        scales: {
            ...base.scales,
            y: {
                ...base.scales.y,
                suggestedMin: Math.floor(Math.min(90, ...vals) / 5) * 5,
                suggestedMax: Math.ceil(Math.max(105, ...vals) / 5) * 5,
                ticks: { ...base.scales.y.ticks, callback: (v) => v + "%" },
            },
        },
        plugins: {
            ...base.plugins,
            tooltip: { ...base.plugins.tooltip, filter: (i) => i.dataset.label !== "Target", callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` } },
        },
    };

    const changeStatus = (a, status) =>
        router.patch(route("dp.action.status", a.id), { status }, { preserveScroll: true, preserveState: true });

    const shownActions = statusView === "open" ? actions.filter((a) => OPEN_STATUSES.includes(a.status)) : actions;
    const th = "whitespace-nowrap border-b px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
    const td = "border-b px-2 py-2 align-top";
    const tdn = cn(td, "text-right font-mono tabular-nums");
    const tdtxt = cn(td, "min-w-[220px] max-w-[420px] whitespace-pre-line text-muted-foreground");


    const TotalRow = ({ label, rs, strong }) => {
        const wo = rs.filter((r) => r.outs != null);
        const cap = sum(rs, "capacity");
        const com = sum(rs, "commit_qty");
        const outs = sum(wo, "outs");
        const comOuts = sum(wo, "commit_qty");
        return (
            <tr className={cn("font-semibold", strong ? "bg-muted/30" : "text-muted-foreground")}>
                <td className={td} colSpan={2}>{label}</td>
                <td className={tdn}>{full(cap)}</td>
                <td className={tdn}>{full(sum(rs, "wip"))}</td>
                <td className={tdn}>{full(com)}</td>
                <td className={tdn}><Delta value={com - cap} /></td>
                <td className={td} />
                <td className={tdn}>{wo.length ? full(outs) : ""}</td>
                <td className={tdn}>{wo.length > 0 && <Delta value={outs - comOuts} />}</td>
                <td className={cn(td, "text-right")}>{wo.length > 0 && <AttainmentPill value={pct(outs, comOuts)} thresholds={thresholds} />}</td>
                <td className={td} />
            </tr>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Daily Performance" />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">Daily performance</h1>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm text-muted-foreground">{scope}</span>
                <a href={route("dp.export", filters)} className="btn btn-sm ml-auto" title="Download the filtered data in the tracker layout">
                    <Download className="h-4 w-4" /> Export to Excel
                </a>
                <Link href={route("dp.entry")} className="btn btn-sm border-0 bg-primary text-primary-foreground hover:bg-primary/90">
                    <PencilLine className="h-4 w-4" /> Enter data
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-end gap-x-5 gap-y-3">
                <div className="flex flex-col gap-1">
                    <Label>View by</Label>
                    <div className="inline-flex overflow-hidden rounded-md border border-input">
                        {[
                            ["ww", "Work week"],
                            ["date", "Date"],
                            ["period", "Month / Quarter"],
                        ].map(([m, l]) => (
                            <button
                                key={m}
                                type="button"
                                aria-pressed={filters.mode === m}
                                onClick={() => setMode(m)}
                                className={cn(
                                    "border-l border-input px-3 py-1.5 text-sm first:border-l-0",
                                    filters.mode === m ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent",
                                )}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {filters.mode === "ww" && (
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="f-ww">Work week</Label>
                        <select id="f-ww" value={filters.ww ?? ""} onChange={(e) => apply({ ww: e.target.value })} className={inputCls}>
                            <option value="">All weeks</option>
                            {calendar.map((c) => (
                                <option key={c.cal_workweek} value={c.cal_workweek}>
                                    WW{c.cal_workweek}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {filters.mode === "date" && (
                    <>
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="f-from">From</Label>
                            <input id="f-from" type="date" value={filters.from ?? ""} onChange={(e) => apply({ from: e.target.value })} className={inputCls} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="f-to">To</Label>
                            <input id="f-to" type="date" value={filters.to ?? ""} onChange={(e) => apply({ to: e.target.value })} className={inputCls} />
                        </div>
                    </>
                )}
                {filters.mode === "period" && (
                    <>
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="f-year">Year</Label>
                            <select id="f-year" value={filters.year ?? ""} onChange={(e) => apply({ year: e.target.value, quarter: null, month: null })} className={inputCls}>
                                {years.map((y) => (
                                    <option key={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="f-q">Quarter</Label>
                            <select id="f-q" value={filters.quarter ?? ""} onChange={(e) => apply({ quarter: e.target.value, month: null })} className={inputCls}>
                                <option value="">All</option>
                                {quarters.map((q) => (
                                    <option key={q} value={q}>
                                        Q{q}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="f-m">Month</Label>
                            <select id="f-m" value={filters.month ?? ""} onChange={(e) => apply({ month: e.target.value })} className={inputCls}>
                                <option value="">All</option>
                                {months.map((m) => (
                                    <option key={m} value={m}>
                                        Month {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div className="flex flex-col gap-1">
                    <Label>Factory</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {lines.map((l) => {
                            const on = activeLines.includes(l.code);
                            return (
                                <button
                                    key={l.code}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggleLine(l.code)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                                        on ? "border-primary/40 bg-primary/10" : "border-input bg-background text-muted-foreground",
                                    )}
                                >
                                    <span className="h-2 w-2 rounded-full" style={{ background: lineColor(lineIndex(l.code), theme), opacity: on ? 1 : 0.35 }} />
                                    {l.name || l.code}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <Label>Package type</Label>
                    <details className="group relative">
                        <summary className={cn(inputCls, "flex min-w-[13rem] cursor-pointer list-none items-center justify-between gap-2", activePkgs.length && "border-primary/50")}>
                            <span className="truncate">{pkgLabel}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                        </summary>
                        <div className="absolute z-20 mt-1 max-h-80 w-60 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
                            <button
                                type="button"
                                onClick={() => apply({ packages: null })}
                                className="w-full rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
                            >
                                Show all
                            </button>
                            {pkgOptions.map((o) => (
                                <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                                    <input type="checkbox" checked={activePkgs.includes(o.id)} onChange={() => togglePkg(o.id)} className="checkbox checkbox-xs" />
                                    {o.code}
                                </label>
                            ))}
                        </div>
                    </details>
                </div>
            </div>

            {/* KPI strip */}
            {kpi ? (
                <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 xl:grid-cols-6">
                    <Tile label="Capacity" value={short(kpi.cap)} title={full(kpi.cap)}>
                        {short(kpi.cap - kpi.com)} open after commit
                    </Tile>
                    <Tile label="Commit" value={short(kpi.com)} title={full(kpi.com)}>
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono">{pct(kpi.com, kpi.cap) ?? "–"}% loaded</span>
                    </Tile>
                    <Tile label="Outs" value={short(kpi.outs)} title={full(kpi.outs)}>
                        <AttainmentPill value={kpi.att} thresholds={thresholds} /> of commit
                    </Tile>
                    <Tile label="Outs − commit" value={<Delta value={kpi.delta} format={short} />} title={full(kpi.delta)}>
                        {days.length} day{days.length > 1 ? "s" : ""} · {kpi.lineDays} line-days
                    </Tile>
                    <Tile label="WIP" value={short(kpi.wip)} title={full(kpi.wip)}>
                        as of {dateLabel(kpi.wipDate)}
                    </Tile>
                    <Tile label="Open actions" value={kpi.open}>
                        {kpi.overdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-950 dark:text-red-400">
                                <AlertTriangle className="h-3 w-3" /> {kpi.overdue} overdue
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-950 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" /> none overdue
                            </span>
                        )}
                    </Tile>
                </div>
            ) : (
                <Panel className="mb-4">
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No entries for {scope}.{" "}
                        <Link href={route("dp.entry")} className="underline">
                            Enter data
                        </Link>{" "}
                        or widen the filter.
                    </p>
                </Panel>
            )}

            {/* Charts */}
            {kpi && (
                <div className="mb-4 grid gap-4 xl:grid-cols-[3fr_2fr]">
                    <Panel
                        title="Outs vs commit by day"
                        right={
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: c.commit }} />Commit</span>
                                <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: c.outs }} />Outs</span>
                                <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-3" style={{ background: c.cap }} />Capacity</span>
                            </div>
                        }
                    >
                        <div className="relative h-72">
                            <Chart type="bar" data={dailyData} options={dailyOptions} aria-label="Daily commit, outs and capacity" />
                        </div>
                    </Panel>
                    <Panel
                        title="Outs-to-commit attainment by factory"
                        right={
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {activeLines.map((code) => (
                                    <span key={code} className="inline-flex items-center gap-1.5">
                                        <i className="h-0.5 w-3" style={{ background: lineColor(lineIndex(code), theme) }} />
                                        {code}
                                    </span>
                                ))}
                                <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-3" style={{ background: c.muted }} />{thresholds.good}% target</span>
                            </div>
                        }
                    >
                        <div className="relative h-72">
                            <Line data={attData} options={attOptions} aria-label="Attainment percent by line and day" />
                        </div>
                    </Panel>
                </div>
            )}

            {/* By package type */}
            {rows.length > 0 && (
                <Panel title="By package type" note="Totals for the selected period, biggest miss first." className="mb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[13px]">
                            <thead>
                                <tr>
                                    <th className={th}>Package type</th>
                                    <th className={th}>Factories</th>
                                    <th className={cn(th, "text-right")}>Capacity</th>
                                    <th className={cn(th, "text-right")}>Commit</th>
                                    <th className={cn(th, "text-right")}>Outs</th>
                                    <th className={cn(th, "text-right")}>Outs − commit</th>
                                    <th className={cn(th, "text-right")}>Attain.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {byPkg.map((p) => (
                                    <tr key={p.code}>
                                        <td className={cn(td, "font-semibold")}>{p.code}</td>
                                        <td className={cn(td, "font-mono text-muted-foreground")}>{p.factories}</td>
                                        <td className={tdn}>{full(p.cap)}</td>
                                        <td className={tdn}>{full(p.com)}</td>
                                        <td className={tdn}>{full(p.outs)}</td>
                                        <td className={tdn}>{p.delta != null && <Delta value={p.delta} />}</td>
                                        <td className={cn(td, "text-right")}>{p.outs != null && <AttainmentPill value={p.att} thresholds={thresholds} />}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            )}

            {/* Daily sheet */}
            <Panel title="Daily sheet" note="Grouped by date and factory, one row per package type. Deltas are computed: commit − capacity and outs − commit." className="mb-4">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                            <tr>
                                <th className={th}>Factory</th>
                                <th className={th}>Package</th>
                                <th className={cn(th, "text-right")}>Capacity</th>
                                <th className={cn(th, "text-right")}>WIP</th>
                                <th className={cn(th, "text-right")}>Commit</th>
                                <th className={cn(th, "text-right")}>Commit − cap</th>
                                <th className={th}>Commit to capacity remarks</th>
                                <th className={cn(th, "text-right")}>Outs</th>
                                <th className={cn(th, "text-right")}>Outs − commit</th>
                                <th className={cn(th, "text-right")}>Attain.</th>
                                <th className={th}>Outs to commit remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!days.length && (
                                <tr>
                                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                                        Nothing to show for this filter.
                                    </td>
                                </tr>
                            )}
                            {[...days].reverse().map(([date, rs]) => {
                                const factories = [...new Set(rs.map((r) => r.line_code))];
                                return (
                                    <Fragment key={date}>
                                        <tr className="bg-muted/60">
                                            <td colSpan={11} className="px-2 py-2 font-semibold">
                                                {longDate(date)}
                                                <span className="ml-2 font-mono font-normal text-muted-foreground">{ww(rs[0].cal_workweek)}</span>
                                            </td>
                                        </tr>
                                        {factories.map((fc) => {
                                            const fr = rs.filter((r) => r.line_code === fc);
                                            return (
                                                <Fragment key={fc}>
                                                    {fr.map((r, k) => (
                                                        <tr key={r.id}>
                                                            <td className={cn(td, "font-semibold")}>
                                                                {k === 0 && (
                                                                    <>
                                                                        {fc}
                                                                        <Link href={route("dp.entry", { date, factory: fc })} className="ml-2 text-xs font-normal text-primary underline">
                                                                            Edit
                                                                        </Link>
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td className={cn(td, "whitespace-nowrap", !r.package_code && "italic text-muted-foreground")}>{pkgOf(r)}</td>
                                                            <td className={tdn}>{full(r.capacity)}</td>
                                                            <td className={tdn}>{full(r.wip)}</td>
                                                            <td className={tdn}>{full(r.commit_qty)}</td>
                                                            <td className={tdn}><Delta value={r.commit_capacity_delta} /></td>
                                                            <td className={tdtxt}>{r.capacity_remarks}</td>
                                                            <td className={tdn}>{full(r.outs)}</td>
                                                            <td className={tdn}>{r.outs != null && <Delta value={r.outs_commit_delta} />}</td>
                                                            <td className={cn(td, "text-right")}>{r.outs != null && <AttainmentPill value={pct(r.outs, r.commit_qty)} thresholds={thresholds} />}</td>
                                                            <td className={tdtxt}>{r.gap_analysis}</td>
                                                        </tr>
                                                    ))}
                                                    {fr.length > 1 && <TotalRow label={`${fc} total`} rs={fr} />}
                                                </Fragment>
                                            );
                                        })}
                                        {factories.length > 1 && <TotalRow label="Day total" rs={rs} strong />}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Panel>

            {/* Action tracker */}
            <Panel
                title="Action tracker"
                note="Change a status here and it saves immediately."
                right={
                    <div className="flex gap-1.5">
                        {[
                            ["open", "Open & ongoing"],
                            ["all", "All"],
                        ].map(([k, l]) => (
                            <button
                                key={k}
                                type="button"
                                aria-pressed={statusView === k}
                                onClick={() => setStatusView(k)}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-sm",
                                    statusView === k ? "border-primary/40 bg-primary/10" : "border-input bg-background text-muted-foreground",
                                )}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                            <tr>
                                {["Raised", "Factory", "Package", "Action", "Who", "When", "Status", "Note"].map((h) => (
                                    <th key={h} className={th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!shownActions.length && (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                        {actions.length ? "All actions in this period are done or sustained." : "No actions recorded for this period."}
                                    </td>
                                </tr>
                            )}
                            {shownActions.map((a) => {
                                const overdue = OPEN_STATUSES.includes(a.status) && a.due_date && String(a.due_date).slice(0, 10) < today();
                                return (
                                    <tr key={a.id}>
                                        <td className={cn(td, "whitespace-nowrap font-mono")}>{dateLabel(a.entry_date)}</td>
                                        <td className={cn(td, "font-semibold")}>{a.line_code}</td>
                                        <td className={cn(td, "whitespace-nowrap")}>{a.package_code || "Unassigned"}</td>
                                        <td className={tdtxt}>{a.action_text}</td>
                                        <td className={td}>{a.owner}</td>
                                        <td className={cn(td, "whitespace-nowrap")}>
                                            {a.when_text}{" "}
                                            {overdue && (
                                                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-400">
                                                    <AlertTriangle className="h-3 w-3" /> overdue
                                                </span>
                                            )}
                                        </td>
                                        <td className={td}>
                                            <select
                                                value={a.status}
                                                onChange={(e) => changeStatus(a, e.target.value)}
                                                aria-label="Status"
                                                className={cn("rounded-full border-0 px-2 py-0.5 text-xs", statusTone[a.status])}
                                            >
                                                {STATUSES.map((s) => (
                                                    <option key={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className={tdtxt}>{a.status_note}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </AuthenticatedLayout>
    );
}
