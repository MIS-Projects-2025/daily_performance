import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Plus, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Delta, Label, inputCls } from "@/Components/DailyPerformance/Bits";
import { full, longDate, parseNum, STATUSES, ww } from "@/lib/dp";

const NUM_FIELDS = ["capacity", "wip", "commit_qty", "outs"];
const CELLS = [
    ["capacity", "Capacity"],
    ["wip", "WIP"],
    ["commit_qty", "Commit"],
    ["d1", "Commit − capacity"],
    ["outs", "Outs"],
    ["d2", "Outs − commit"],
];
const primaryBtn = "btn btn-sm border-0 bg-primary text-primary-foreground hover:bg-primary/90";
const blankAction = () => ({ id: null, action_text: "", owner: "", when_text: "", status: "Open", status_note: "" });
const blankRow = (packageType) => ({
    id: null,
    package_type: packageType || "",
    capacity: "",
    wip: "",
    commit_qty: "",
    outs: "",
    capacity_remarks: "",
    gap_analysis: "",
    actions: [],
});

function buildRows(rows) {
    return rows.map((r) => ({
        id: r.id,
        package_type: r.package_type || "",
        capacity: full(r.capacity),
        wip: full(r.wip),
        commit_qty: full(r.commit_qty),
        outs: full(r.outs),
        capacity_remarks: r.capacity_remarks || "",
        gap_analysis: r.gap_analysis || "",
        actions: (r.actions || []).map((a) => ({
            id: a.id,
            action_text: a.action_text || "",
            owner: a.owner || "",
            when_text: a.when_text || "",
            status: a.status || "Open",
            status_note: a.status_note || "",
        })),
    }));
}

export default function Entry({ date, factory, calendar, lines, filled, packageTypes, rows, suggestedWw }) {
    const { flash } = usePage().props;
    const [confirmDelete, setConfirmDelete] = useState(false);
    const form = useForm({
        entry_date: date,
        line_code: factory,
        cal_workweek: suggestedWw ? String(suggestedWw) : "",
        rows: buildRows(rows),
    });
    const { data, setData, errors, processing } = form;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const setRow = (i, patch) => setData("rows", data.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    const setAction = (i, k, patch) =>
        setRow(i, { actions: data.rows[i].actions.map((a, j) => (j === k ? { ...a, ...patch } : a)) });

    const used = data.rows.map((r) => r.package_type).filter(Boolean);
    const unused = packageTypes.filter((p) => !used.includes(String(p.id)));
    const pkgName = (id) => packageTypes.find((p) => String(p.id) === String(id))?.code;

    const go = (params) => {
        if (form.isDirty) toast.message("Unsaved changes were discarded.");
        router.get(route("dp.entry"), { date, factory, ...params }, { preserveScroll: true });
    };

    const totals = useMemo(() => {
        const t = {};
        for (const k of NUM_FIELDS) {
            const vals = data.rows.map((r) => parseNum(r[k])).filter((v) => v !== null && !Number.isNaN(v));
            t[k] = vals.length ? vals.reduce((a, b) => a + b, 0) : null;
        }
        return t;
    }, [data.rows]);

    const submit = (e) => {
        e.preventDefault();
        if (!data.rows.length) return toast.error("Add at least one package type.");
        if (data.rows.some((r) => !r.package_type)) return toast.error("Pick a package type for every row.");
        if (data.rows.some((r) => NUM_FIELDS.some((k) => Number.isNaN(parseNum(r[k])))))
            return toast.error("Fix the highlighted numbers (digits and commas only).");
        form.post(route("dp.save"), {
            preserveScroll: true,
            onError: (errs) => toast.error(Object.values(errs)[0] || "Check the form."),
        });
    };

    const deleteFactory = () =>
        router.delete(route("dp.delete"), { data: { date, factory }, preserveScroll: true, onFinish: () => setConfirmDelete(false) });

    const err = (path) => errors[path];
    const factoryName = lines.find((l) => l.code === factory)?.name || factory;

    return (
        <AuthenticatedLayout>
            <Head title="Daily Performance Entry" />

            <form onSubmit={submit} autoComplete="off" noValidate className="space-y-4 pb-28">
                <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                    <div>
                        <h1 className="text-2xl font-bold">Daily performance entry</h1>
                        <p className="text-sm text-muted-foreground">
                            {rows.length ? "Editing" : "New entry for"} {factoryName} · {longDate(date)}
                            {data.cal_workweek && <span className="ml-2 font-mono">{ww(data.cal_workweek)}</span>}
                        </p>
                    </div>
                    <div className="ml-auto flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="dp-date">Date</Label>
                            <input id="dp-date" type="date" value={date} onChange={(e) => e.target.value && go({ date: e.target.value })} className={inputCls} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="dp-ww">Work week</Label>
                            <select
                                id="dp-ww"
                                value={data.cal_workweek}
                                onChange={(e) => setData("cal_workweek", e.target.value)}
                                className={cn(inputCls, "min-w-[12rem]", err("cal_workweek") && "border-red-500")}
                            >
                                <option value="">Select…</option>
                                {calendar.map((c) => (
                                    <option key={c.cal_workweek} value={c.cal_workweek}>
                                        WW{c.cal_workweek} · {c.cal_year} Q{c.cal_quarter} M{c.cal_month}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Link href={route("dp.import")} className="btn btn-sm">
                            <FileUp className="h-4 w-4" /> Import from Excel
                        </Link>
                        <Link href={route("dp.dashboard")} className="btn btn-ghost btn-sm">
                            Dashboard
                        </Link>
                    </div>
                </div>

                {/* Factory tabs: each factory is entered and saved on its own */}
                <div className="flex flex-col gap-1">
                    <Label>Factory</Label>
                    <div className="flex flex-wrap gap-2" role="tablist">
                        {lines.map((l) => {
                            const on = l.code === factory;
                            const n = filled?.[l.code];
                            return (
                                <button
                                    key={l.code}
                                    type="button"
                                    role="tab"
                                    aria-selected={on}
                                    onClick={() => !on && go({ factory: l.code })}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold",
                                        on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
                                    )}
                                >
                                    <span className="font-mono">{l.name || l.code}</span>
                                    {n ? (
                                        <span className={cn("inline-flex items-center gap-1 text-xs font-normal", on ? "opacity-90" : "text-green-700 dark:text-green-400")}>
                                            <CheckCircle2 className="h-3.5 w-3.5" /> {n} pkg
                                        </span>
                                    ) : (
                                        <span className={cn("text-xs font-normal", on ? "opacity-80" : "text-muted-foreground")}>not entered</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {!data.rows.length && (
                    <div className="rounded-lg border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                        No package types entered for {factoryName} on this date yet. Add the first one below.
                    </div>
                )}

                {data.rows.map((r, i) => {
                    const v = Object.fromEntries(NUM_FIELDS.map((k) => [k, parseNum(r[k])]));
                    const d1 = v.commit_qty != null && v.capacity != null ? v.commit_qty - v.capacity : null;
                    const d2 = v.outs != null && v.commit_qty != null ? v.outs - v.commit_qty : null;
                    const idp = `row${i}`;
                    return (
                        <section key={r.id ?? `new-${i}`} className="rounded-lg border bg-card text-card-foreground" data-row={i}>
                            <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                                <span className="font-mono text-sm font-semibold text-muted-foreground">{factory}</span>
                                <select
                                    value={r.package_type}
                                    onChange={(e) => setRow(i, { package_type: e.target.value })}
                                    aria-label="Package type"
                                    className={cn(inputCls, "w-auto min-w-[10rem] font-semibold", (!r.package_type || err(`rows.${i}.package_type`)) && "border-red-500")}
                                >
                                    <option value="">Package type…</option>
                                    {packageTypes
                                        .filter((p) => String(p.id) === r.package_type || !used.includes(String(p.id)))
                                        .map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.code}
                                            </option>
                                        ))}
                                </select>
                                {!r.package_type && r.id && <span className="text-xs text-amber-700 dark:text-amber-300">Saved without a package type: pick one</span>}
                                <button
                                    type="button"
                                    onClick={() => setData("rows", data.rows.filter((_, j) => j !== i))}
                                    className="btn btn-ghost btn-sm ml-auto"
                                    aria-label={`Remove ${pkgName(r.package_type) || "row"}`}
                                >
                                    <X className="h-4 w-4" /> Remove
                                </button>
                            </header>
                            <div className="grid gap-4 p-4">
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                                    {CELLS.map(([k, label]) =>
                                        k === "d1" || k === "d2" ? (
                                            <div key={k} className="flex flex-col gap-1">
                                                <Label>{label}</Label>
                                                <div className="rounded-md border border-dashed bg-muted/50 px-2.5 py-1.5 text-right text-sm">
                                                    <Delta value={k === "d1" ? d1 : d2} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={k} className="flex flex-col gap-1">
                                                <Label htmlFor={`${idp}-${k}`}>{label}</Label>
                                                <input
                                                    id={`${idp}-${k}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={r[k]}
                                                    onChange={(e) => setRow(i, { [k]: e.target.value })}
                                                    onBlur={(e) => {
                                                        const n = parseNum(e.target.value);
                                                        if (n !== null && !Number.isNaN(n)) setRow(i, { [k]: full(n) });
                                                    }}
                                                    aria-invalid={Number.isNaN(v[k]) || !!err(`rows.${i}.${k}`)}
                                                    className={cn(
                                                        inputCls,
                                                        "text-right font-mono tabular-nums",
                                                        (Number.isNaN(v[k]) || err(`rows.${i}.${k}`)) && "border-red-500 bg-red-50 dark:bg-red-950/40",
                                                    )}
                                                />
                                            </div>
                                        ),
                                    )}
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor={`${idp}-remarks`}>Commit to capacity remarks</Label>
                                        <textarea
                                            id={`${idp}-remarks`}
                                            rows={2}
                                            value={r.capacity_remarks}
                                            onChange={(e) => setRow(i, { capacity_remarks: e.target.value })}
                                            placeholder="e.g. 720K open capacity, 100K hold due to no carrier tape"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor={`${idp}-gap`}>Outs to commit remarks</Label>
                                        <textarea
                                            id={`${idp}-gap`}
                                            rows={2}
                                            value={r.gap_analysis}
                                            onChange={(e) => setRow(i, { gap_analysis: e.target.value })}
                                            placeholder="Why outs missed commit: machine, downtime hours, capacity loss"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label>Actions</Label>
                                    {r.actions.map((a, k) => (
                                        <div key={a.id ?? `new-${k}`} className="grid grid-cols-2 items-start gap-2 lg:grid-cols-[3fr_1fr_1fr_1fr_1.2fr_auto]">
                                            <textarea
                                                rows={2}
                                                value={a.action_text}
                                                onChange={(e) => setAction(i, k, { action_text: e.target.value })}
                                                placeholder="Action"
                                                aria-label="Action"
                                                className={cn(inputCls, "col-span-2 lg:col-span-1")}
                                            />
                                            <input value={a.owner} onChange={(e) => setAction(i, k, { owner: e.target.value })} placeholder="Who" aria-label="Who" className={inputCls} />
                                            <input
                                                value={a.when_text}
                                                onChange={(e) => setAction(i, k, { when_text: e.target.value })}
                                                placeholder="WW702 or 2026-11-08"
                                                aria-label="When"
                                                className={inputCls}
                                            />
                                            <select value={a.status} onChange={(e) => setAction(i, k, { status: e.target.value })} aria-label="Status" className={inputCls}>
                                                {STATUSES.map((s) => (
                                                    <option key={s}>{s}</option>
                                                ))}
                                            </select>
                                            <input
                                                value={a.status_note}
                                                onChange={(e) => setAction(i, k, { status_note: e.target.value })}
                                                placeholder="Status note"
                                                aria-label="Status note"
                                                className={inputCls}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setRow(i, { actions: r.actions.filter((_, j) => j !== k) })}
                                                className="btn btn-ghost btn-sm"
                                                aria-label="Remove action"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div>
                                        <button type="button" onClick={() => setRow(i, { actions: [...r.actions, blankAction()] })} className="btn btn-sm">
                                            <Plus className="h-4 w-4" /> Add action
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    );
                })}

                {/* Add a package type row */}
                <div className="flex flex-wrap items-center gap-2">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <select
                        id="dp-add-pkg"
                        value=""
                        onChange={(e) => e.target.value && setData("rows", [...data.rows, blankRow(e.target.value)])}
                        disabled={!unused.length}
                        aria-label="Add package type"
                        className={cn(inputCls, "w-auto min-w-[14rem]")}
                    >
                        <option value="">{unused.length ? `Add package type to ${factory}…` : "All package types added"}</option>
                        {unused.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 shadow-lg">
                    <span className="font-mono text-sm font-semibold">{factory} total</span>
                    {[
                        ["Capacity", totals.capacity],
                        ["WIP", totals.wip],
                        ["Commit", totals.commit_qty],
                    ].map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</span>
                            <b className="font-mono font-medium tabular-nums">{v == null ? "–" : full(v)}</b>
                        </div>
                    ))}
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Commit − capacity</span>
                        <Delta value={totals.commit_qty != null && totals.capacity != null ? totals.commit_qty - totals.capacity : null} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Outs</span>
                        <b className="font-mono font-medium tabular-nums">{totals.outs == null ? "–" : full(totals.outs)}</b>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Outs − commit</span>
                        <Delta value={totals.outs != null && totals.commit_qty != null ? totals.outs - totals.commit_qty : null} />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {rows.length > 0 &&
                            (confirmDelete ? (
                                <>
                                    <span className="text-sm">Delete {factory} for this date?</span>
                                    <button type="button" className="btn btn-sm border-0 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteFactory}>
                                        Delete
                                    </button>
                                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(false)}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(true)}>
                                    <Trash2 className="h-4 w-4" /> Delete {factory}
                                </button>
                            ))}
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => form.reset()} disabled={!form.isDirty}>
                            Undo changes
                        </button>
                        <button type="submit" className={primaryBtn} disabled={processing}>
                            <Save className="h-4 w-4" /> {processing ? "Saving…" : `Save ${factory}`}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
