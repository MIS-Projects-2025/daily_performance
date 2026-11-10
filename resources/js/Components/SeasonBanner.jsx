import { useState } from "react";
import { X } from "lucide-react";
import SeasonIcon from "@/Components/SeasonIcon";

const dismissKey = (event) =>
    `seasonal-theme:dismissed:${event.id}:${new Date().getFullYear()}`;

const wasDismissed = (event) => {
    try {
        return window.localStorage.getItem(dismissKey(event)) === "1";
    } catch {
        return false;
    }
};

/**
 * Thin strip under the navbar: a canvas-drawn event icon, the greeting, and one
 * line of essence. No emoji anywhere - the icon is painted from paths, so it does
 * not depend on a system emoji font and it picks up the department colour.
 * Dismissing hides it for that event for the rest of the year; the accent colour
 * is not changed anywhere - the strip simply uses the department's own
 * `primary` token, so it matches the rest of the system.
 *
 * Props are the ones your AuthenticatedLayout already passes
 * (<SeasonBanner event={seasonal.event} enabled={seasonal.enabled}
 *  isPreview={seasonal.isPreview} />). A single `seasonal={seasonal}` object is
 * accepted too, so the strip keeps rendering whichever wiring is in the layout.
 */
export default function SeasonBanner(props) {
    const { event, enabled, isPreview = false } = props.seasonal ?? props;
    const [hiddenKey, setHiddenKey] = useState(null);

    if (!event || !enabled || hiddenKey === dismissKey(event) || wasDismissed(event)) return null;

    const dismiss = () => {
        setHiddenKey(dismissKey(event));
        try {
            window.localStorage.setItem(dismissKey(event), "1");
        } catch {
            // Dismiss still applies for this page view.
        }
    };

    return (
        <div
            role="status"
            className="flex items-center justify-center gap-2 border-b border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-foreground sm:text-sm"
        >
            <SeasonIcon name={event.icon} size={18} />
            <span className="font-medium">{event.message}</span>
            {event.essence && (
                <span className="hidden text-muted-foreground md:inline">
                    <span aria-hidden="true" className="mx-1 opacity-60">
                        ·
                    </span>
                    {event.essence}
                </span>
            )}
            {isPreview && (
                <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                    Preview
                </span>
            )}
            <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss greeting"
                className="ml-2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
