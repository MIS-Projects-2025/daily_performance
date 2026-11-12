import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Delta, Panel } from "@/Components/DailyPerformance/Bits";
import { full, longDate, ww } from "@/lib/dp";

const primaryBtn = "btn btn-sm border-0 bg-primary text-primary-foreground hover:bg-primary/90";

export default function Import({ preview, columns, maxRows }) {
    const { flash } = usePage().props;
    const [committing, setCommitting] = useState(false);
    const form = useForm({ file: null });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const upload = (e) => {
        e.preventDefault();
        if (!form.data.file) return toast.error("Choose an Excel file first.");
        form.post(route("dp.import.preview"), {
            forceFormData: true,
            onError: (errs) => toast.error(errs.file || "Could not read the file."),
            onSuccess: () => form.reset(),
        });
    };

    const commit = () => {
        setCommitting(true);
        router.post(route("dp.import.commit"), { token: preview.token }, { onFinish: () => setCommitting(false) });
    };

    const groups = preview?.groups || [];
    const errors = preview?.errors || [];
    const nNew = groups.filter((g) => !g.exists).length;
    const nActions = groups.reduce((a, g) => a + g.actions.length, 0);
    const th = "whitespace-nowrap border-b px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
    const td = "border-b px-2 py-2 align-top";
    const tdn = cn(td, "text-right font-mono tabular-nums");

    return (
        <AuthenticatedLayout>
            <Head title="Import Daily Performance" />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">Import from Excel</h1>
                <Link href={route("dp.entry")} className="btn btn-ghost btn-sm ml-auto">
                    <ArrowLeft className="h-4 w-4" /> Back to entry
                </Link>
            </div>

            <div className="mb-4 grid gap-4 lg:grid-cols-2">
                <Panel title="1. Fill in the template">
                    <p className="mb-3 text-sm text-muted-foreground">
                        One row per date, factory and package type. The Factory, Package Type and Status columns have drop-downs. For several actions on one package,
                        repeat the row and fill only the action columns. Blank cells don't overwrite saved values, so you can import Outs on its own later.
                    </p>
                    <p className="mb-3 font-mono text-xs text-muted-foreground">{columns.join(" · ")}</p>
                    <a href={route("dp.import.template")} className="btn btn-sm">
                        <Download className="h-4 w-4" /> Download template (.xlsx)
                    </a>
                </Panel>

                <Panel title="2. Upload and check">
                    <form onSubmit={upload} className="flex flex-col gap-3">
                        <label
                            htmlFor="dp-file"
                            className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm hover:bg-accent",
                                form.errors.file && "border-red-500",
                            )}
                        >
                            <FileSpreadsheet className="h-6 w-6 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1 truncate">
                                {form.data.file ? form.data.file.name : "Choose an .xls or .xlsx file (max 5 MB, " + maxRows.toLocaleString() + " rows)"}
                            </span>
                            <input
                                id="dp-file"
                                type="file"
                                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                className="sr-only"
                                onChange={(e) => form.setData("file", e.target.files?.[0] || null)}
                            />
                        </label>
                        {form.errors.file && <p className="text-sm text-red-600 dark:text-red-400">{form.errors.file}</p>}
                        <div>
                            <button type="submit" className={primaryBtn} disabled={form.processing || !form.data.file}>
                                <Upload className="h-4 w-4" /> {form.processing ? "Checking…" : "Check file"}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Nothing is saved until you confirm the preview.</p>
                    </form>
                </Panel>
            </div>

            {preview && (
                <Panel
                    title={`3. Preview: ${preview.filename}`}
                    note={`Sheet "${preview.sheet}" · ${preview.rowCount} row(s) read`}
                    right={
                        <div className="flex gap-2">
                            <Link href={route("dp.import", { clear: 1 })} className="btn btn-ghost btn-sm">
                                Cancel
                            </Link>
                            <button type="button" className={primaryBtn} onClick={commit} disabled={committing || errors.length > 0 || !groups.length}>
                                <CheckCircle2 className="h-4 w-4" /> {committing ? "Importing…" : `Import ${groups.length} row${groups.length === 1 ? "" : "s"}`}
                            </button>
                        </div>
                    }
                >
                    {errors.length > 0 ? (
                        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            <p className="mb-2 flex items-center gap-2 font-semibold">
                                <AlertTriangle className="h-4 w-4" /> {errors.length} problem{errors.length === 1 ? "" : "s"} to fix. Nothing will be imported until the file is clean.
                            </p>
                            <ul className="max-h-64 list-none space-y-1 overflow-y-auto">
                                {errors.map((e, i) => (
                                    <li key={i}>
                                        {e.row ? <span className="mr-2 font-mono">Row {e.row}</span> : null}
                                        {e.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="mb-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" /> File is clean: {nNew} new, {groups.length - nNew} update{groups.length - nNew === 1 ? "" : "s"} to saved entries, {nActions}{" "}
                            action{nActions === 1 ? "" : "s"}.
                        </p>
                    )}

                    {groups.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[13px]">
                                <thead>
                                    <tr>
                                        {["", "Date", "Factory", "Package"].map((h) => (
                                            <th key={h} className={th}>{h}</th>
                                        ))}
                                        {["Capacity", "WIP", "Commit", "Commit − cap", "Outs", "Outs − commit"].map((h) => (
                                            <th key={h} className={cn(th, "text-right")}>{h}</th>
                                        ))}
                                        <th className={th}>Actions</th>
                                        <th className={th}>Excel rows</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((g) => (
                                        <tr key={`${g.entry_date}|${g.line_code}|${g.package_type}`}>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        "rounded-full px-2 py-0.5 text-xs",
                                                        g.exists ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
                                                    )}
                                                >
                                                    {g.exists ? "Update" : "New"}
                                                </span>
                                            </td>
                                            <td className={cn(td, "whitespace-nowrap")}>
                                                {longDate(g.entry_date)} <span className="font-mono text-muted-foreground">{ww(g.cal_workweek)}</span>
                                            </td>
                                            <td className={cn(td, "font-semibold")}>{g.line_code}</td>
                                            <td className={cn(td, "whitespace-nowrap")}>{g.package_type}</td>
                                            <td className={tdn}>{full(g.capacity)}</td>
                                            <td className={tdn}>{full(g.wip)}</td>
                                            <td className={tdn}>{full(g.commit_qty)}</td>
                                            <td className={tdn}>{g.commit_qty != null && g.capacity != null && <Delta value={g.commit_qty - g.capacity} />}</td>
                                            <td className={tdn}>{full(g.outs)}</td>
                                            <td className={tdn}>{g.outs != null && g.commit_qty != null && <Delta value={g.outs - g.commit_qty} />}</td>
                                            <td className={cn(td, "min-w-[200px] text-muted-foreground")}>
                                                {g.actions.map((a, i) => (
                                                    <div key={i}>
                                                        {a.action_text}
                                                        <span className="ml-1 text-xs">
                                                            ({[a.owner, a.when_text, a.status].filter(Boolean).join(" · ")})
                                                        </span>
                                                    </div>
                                                ))}
                                            </td>
                                            <td className={cn(td, "font-mono text-xs text-muted-foreground")}>{g.rows.join(", ")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            )}
        </AuthenticatedLayout>
    );
}
