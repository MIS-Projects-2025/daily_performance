import { cn } from "@/lib/utils";
import { signed, full } from "@/lib/dp";

// Attainment % pill: colour + icon, never colour alone
export function AttainmentPill({ value, thresholds = { good: 100, watch: 95 } }) {
    if (value == null)
        return <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">no outs</span>;
    const tone =
        value >= thresholds.good
            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400"
            : value >= thresholds.watch
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400";
    return (
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-xs", tone)}>
            {value >= thresholds.good ? "▲" : "▼"} {value}%
        </span>
    );
}

// Signed delta in red/green
export function Delta({ value, format = full, className }) {
    if (value === null || value === undefined || Number.isNaN(value)) return <span className={cn("text-muted-foreground", className)}>–</span>;
    return (
        <span
            className={cn(
                "font-mono tabular-nums",
                value < 0 && "text-red-700 dark:text-red-400",
                value > 0 && "text-green-700 dark:text-green-400",
                className,
            )}
        >
            {signed(Number(value), format)}
        </span>
    );
}

export const statusTone = {
    Open: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    Ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    Done: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
    Sustain: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
};

export function Panel({ title, note, right, children, className }) {
    return (
        <section className={cn("min-w-0 rounded-lg border bg-card p-4 text-card-foreground", className)}>
            {(title || right) && (
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {title && <h2 className="text-sm font-semibold">{title}</h2>}
                    {note && <p className="text-xs text-muted-foreground">{note}</p>}
                    {right && <div className="ml-auto">{right}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

export const Label = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {children}
    </label>
);

export const inputCls =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
