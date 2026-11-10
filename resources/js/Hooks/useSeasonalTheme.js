import { useCallback, useEffect, useMemo, useState } from "react";
import { eventRangeLabel, getActiveEvent, SEASONAL_EVENTS } from "@/lib/seasonalEvents";

const ENABLED_KEY = "seasonal-theme:enabled";
const EFFECTS_KEY = "seasonal-theme:effects";
const PREVIEW_KEY = "seasonal-theme:preview";

const noop = () => {};
const EMPTY_VARS = {};

const readStorage = (storage, key) => {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
};

const writeStorage = (storage, key, value) => {
    try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
    } catch {
        // Storage can be unavailable (private mode, policy); the theme still
        // works for this page view.
    }
};

// Both `?name=value` and `#name=value` work, so the links keep working on a
// page that strips the query string (Inertia redirects, proxy rewrites).
const paramValue = (name) => {
    if (typeof window === "undefined") return null;
    const fromQuery = new URLSearchParams(window.location.search).get(name);
    if (fromQuery !== null) return fromQuery;
    const hash = window.location.hash.replace(/^#/, "");
    return new URLSearchParams(hash.includes("=") ? hash : "").get(name);
};

// Preview any event without waiting for its date:
//   ?season=halloween   -> preview that event (remembered for this tab)
//   ?season=reset       -> back to the real date
// Valid ids are the `id` values in seasonalEvents.js.
const readPreviewId = () => {
    if (typeof window === "undefined") return null;

    const requested = paramValue("season");
    if (requested === "reset") {
        writeStorage(window.sessionStorage, PREVIEW_KEY, null);
        return null;
    }
    if (requested && SEASONAL_EVENTS.some((event) => event.id === requested)) {
        writeStorage(window.sessionStorage, PREVIEW_KEY, requested);
        return requested;
    }

    const stored = readStorage(window.sessionStorage, PREVIEW_KEY);
    return stored && SEASONAL_EVENTS.some((event) => event.id === stored)
        ? stored
        : null;
};

// Pretend "today" is another date, to check a schedule without waiting for it:
//   ?as=2026-12-25   (also #as=2026-12-25)
const readPretendDate = () => {
    const raw = paramValue("as");
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [y, m, d] = raw.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Which seasonal event applies today, plus the two switches the footer offers.
 *
 * IMPORTANT - there is no colour injection here. The earlier version wrote a
 * `<style>` that re-mapped `--primary` / `--ring` / `--chart-1` to the event's
 * colour, which fought each department's own colour coding. The banner and the
 * particles already read `hsl(var(--primary))` and `bg-primary/10`, so an event
 * now shows up in the department's own colour. Nothing about the app's palette
 * changes; on a normal day even the banner is gone.
 */
export default function useSeasonalTheme() {
    const [enabled, setEnabled] = useState(
        () =>
            typeof window === "undefined" ||
            readStorage(window.localStorage, ENABLED_KEY) !== "off",
    );
    const [effectsEnabled, setEffectsEnabled] = useState(
        () =>
            typeof window === "undefined" ||
            (readStorage(window.localStorage, EFFECTS_KEY) !== "off" &&
                // ?fx=0 = no drifting shapes, the strip only. ?fx=1 puts them back.
                (paramValue("fx") ?? "1") !== "0"),
    );
    // Respect the OS "reduce motion" setting: no animation for those users.
    const [reducedMotion, setReducedMotion] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    );
    const [previewId] = useState(readPreviewId);
    const [pretend] = useState(readPretendDate);
    // Everything about "today" flows from this one value.
    const date = useMemo(() => pretend ?? new Date(), [pretend]);
    const event = useMemo(() => getActiveEvent(date, previewId), [date, previewId]);

    useEffect(() => {
        const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!query) return undefined;
        const update = () => setReducedMotion(query.matches);
        query.addEventListener?.("change", update);
        return () => query.removeEventListener?.("change", update);
    }, []);

    const toggleEffects = useCallback(() => {
        setEffectsEnabled((current) => {
            const next = !current;
            writeStorage(window.localStorage, EFFECTS_KEY, next ? "on" : "off");
            return next;
        });
    }, []);

    const toggle = useCallback(() => {
        setEnabled((current) => {
            const next = !current;
            writeStorage(window.localStorage, ENABLED_KEY, next ? "on" : "off");
            return next;
        });
    }, []);

    return {
        event,
        date,
        enabled,
        toggle,
        isPreview: previewId !== null,
        // True when the URL forced a date, so the QA badge can say so.
        isPretend: pretend !== null,
        effectsEnabled,
        toggleEffects,
        reducedMotion,
        // True when the animation layer should actually render.
        effectsActive: Boolean(event) && enabled && effectsEnabled && !reducedMotion,

        // ── Compat for older seasonal files still in the project ──────────────
        // A leftover `SeasonBackdrop`/`SeasonPhoto`/`seasonalContext.js` may read
        // these keys. They are returned (harmlessly) so an old component can
        // never crash the page over a missing prop; the canvas theme itself uses
        // only the fields above. `photo`/`vars` stay empty because this build
        // ships no photographs and writes no CSS variables.
        range: useMemo(
            () => (event ? eventRangeLabel(event, date) : null),
            [event, date.getFullYear()],
        ),
        photo: null,
        vars: EMPTY_VARS,
        backdropOn: false,
        toggleBackdrop: noop,
    };
}
