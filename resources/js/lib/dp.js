// Shared helpers for the Daily Performance pages
const nf = new Intl.NumberFormat("en-US");

export const full = (v) => (v === null || v === undefined || v === "" ? "" : nf.format(v));

// 3,970,258 -> 3.97M ; 720,000 -> 720K
export const short = (v) => {
    if (v === null || v === undefined) return "–";
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
    if (a >= 1e3) return Math.round(v / 1e3) + "K";
    return String(v);
};

export const signed = (v, f = full) =>
    v === null || v === undefined ? "" : (v > 0 ? "+" : v < 0 ? "−" : "") + f(Math.abs(v));

export const pct = (a, b) => (a == null || !b ? null : Math.round((a / b) * 1000) / 10);

export const parseNum = (s) => {
    if (s === null || s === undefined || String(s).trim() === "") return null;
    const n = Number(String(s).replace(/[, ]/g, ""));
    return Number.isFinite(n) ? n : NaN;
};

export const dateLabel = (iso) =>
    new Date(String(iso).slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const longDate = (iso) =>
    new Date(String(iso).slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

export const today = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const ww = (n) => (n ? "WW" + n : "");

export const sum = (rows, k) => rows.reduce((a, r) => (r[k] == null ? a : a + Number(r[k])), 0);

export function byDate(rows) {
    const m = new Map();
    for (const r of rows) {
        const d = String(r.entry_date).slice(0, 10);
        if (!m.has(d)) m.set(d, []);
        m.get(d).push(r);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export const STATUSES = ["Open", "Ongoing", "Done", "Sustain"];
export const OPEN_STATUSES = ["Open", "Ongoing"];

// Validated categorical order (blue, orange, aqua, yellow); light / dark steps.
// Colour follows the line, so F1 is always blue wherever it appears.
const SERIES = {
    light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"],
    dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9"],
};
export const lineColor = (index, theme) => SERIES[theme === "dark" ? "dark" : "light"][index % 6];

export const chartColors = (theme) =>
    theme === "dark"
        ? { commit: "#2f5f97", outs: "#86b6ef", cap: "#b9c1bd", grid: "#2a302d", axis: "#3a413d", muted: "#87908b", ink: "#eef1ef", surface: "#18181b" }
        : { commit: "#86b6ef", outs: "#1c5cab", cap: "#5f6a65", grid: "#e4e7e5", axis: "#c3c8c4", muted: "#7b8480", ink: "#111614", surface: "#ffffff" };
