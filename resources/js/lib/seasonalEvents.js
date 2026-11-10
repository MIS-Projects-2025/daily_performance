// Seasonal events for the portal theme - CLASSIC look (banner strip + CSS particles),
// with the calendar corrected for a Philippine workplace portal.
//
// Rules:
//  - The FIRST event whose dates match today wins, so a specific day sits above a
//    broader one (Undas outranks Halloween on Oct 31, Simbang Gabi sits inside the
//    Christmas season). Order of SEASONAL_EVENTS matters.
//  - If nothing matches, getActiveEvent() returns null and the portal keeps its
//    normal theme. Most days of the year are like that on purpose: an event is
//    themed on its actual days, not for a whole month.
//  - There is NO colour override any more. Each department keeps its own colour
//    coding (`--primary` in app.css); the banner and the particles already read
//    hsl(var(--primary)), so the event shows up in the department colour.
//  - `message` = the greeting, `essence` = one line about what Filipinos actually do.

const md = (month, day) => month * 100 + day;

// Movable dates (month, day). Add more years when the table runs out; a year that
// is missing simply skips that event.
const EASTER_SUNDAY = {
    2026: [4, 5],
    2027: [3, 28],
    2028: [4, 16],
    2029: [4, 1],
    2030: [4, 21],
    2031: [4, 13],
    2032: [3, 28],
    2033: [4, 17],
    2034: [4, 9],
    2035: [3, 25],
};

const CHINESE_NEW_YEAR = {
    2026: [2, 17],
    2027: [2, 6],
    2028: [1, 26],
    2029: [2, 13],
    2030: [2, 3],
    2031: [1, 23],
    2032: [2, 11],
    2033: [1, 31],
    2034: [2, 19],
    2035: [2, 8],
};

// Eid'l Fitr (Wakas ng Ramadan). Proclamation No. 1189 set 2026 to March 20; 2027
// is expected on March 10. The moon decides, so the year is confirmed close to the day.
const EID_AL_FITR = {
    2026: [3, 20],
    2027: [3, 10],
    2028: [2, 27],
    2029: [2, 14],
    2030: [2, 3],
    2031: [1, 23],
    2032: [1, 12],
    2033: [12, 31],
    2034: [12, 21],
    2035: [12, 10],
};

const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

// Fixed yearly ranges, each [startMMDD, endMMDD] inclusive, e.g. [1, 1] -> md(1, 1).
const fixed =
    (...ranges) =>
    (date) => {
        const value = md(date.getMonth() + 1, date.getDate());
        return ranges.some(([start, end]) => value >= start && value <= end);
    };

// Window around a movable date: `before` days before through `after` days after.
const around = (table, before, after) => (date) => {
    const entry = table[date.getFullYear()];
    if (!entry) return false;
    const anchor = new Date(date.getFullYear(), entry[0] - 1, entry[1]);
    const day = startOfDay(date);
    return day >= addDays(anchor, -before) && day <= addDays(anchor, after);
};

// A single movable day, no padding (used for Eid'l Fitr: one proclaimed day).
const onDay = (table) => around(table, 0, 0);

// Last Monday of a month - National Heroes Day (Aug 31 2026, Aug 30 2027, ...).
const lastMondayOf = (month) => (date) => {
    if (date.getMonth() !== month - 1) return false;
    const last = new Date(date.getFullYear(), month, 0);
    const monday = new Date(last);
    while (monday.getDay() !== 1) monday.setDate(monday.getDate() - 1);
    return date.getDate() === monday.getDate();
};

export const SEASONAL_EVENTS = [
    // ── Specific days / movable dates (checked first) ──────────────────────
    {
        id: "new-year",
        name: "New Year's Day",
        icon: "firecracker",
        message: "Happy New Year!",
        essence: "A fresh start for family, gratitude, and new goals.",
        matches: fixed([md(1, 1), md(1, 2)]),
    },
    {
        id: "chinese-new-year",
        name: "Chinese New Year",
        icon: "envelope",
        message: "Happy Lunar New Year!",
        essence: "Celebrating new beginnings, family gatherings, and good fortune.",
        matches: around(CHINESE_NEW_YEAR, 1, 2),
    },
    {
        id: "valentines",
        name: "Valentine's Day",
        icon: "heart",
        message: "Happy Valentine's Day!",
        essence: "A moment to share kindness and appreciation.",
        matches: fixed([md(2, 13), md(2, 15)]),
    },
    {
        id: "womens-day",
        name: "International Women's Day",
        icon: "tulip",
        message: "Happy International Women's Day!",
        essence: "Celebrating the contributions and achievements of women everywhere.",
        matches: fixed([md(3, 7), md(3, 9)]),
    },
    {
        id: "eid-l-fitr",
        name: "Eid'l Fitr",
        icon: "moon",
        message: "Happy Eid'l Fitr!",
        essence: "Wishing peace, gratitude, and joy at the end of Ramadan.",
        matches: onDay(EID_AL_FITR),
    },
    {
        id: "holy-week",
        name: "Holy Week",
        icon: "dove",
        message: "Holy Week",
        essence: "A time for reflection, faith, and quiet remembrance.",
        // Thursday to Sunday of the Triduum (Good Friday = Easter minus 2 days).
        matches: around(EASTER_SUNDAY, 3, 0),
    },
    {
        id: "araw-ng-kagitingan",
        name: "Day of Valor",
        icon: "flag",
        message: "Day of Valor",
        essence: "Honoring the courage and sacrifice of those who served in Bataan and Corregidor.",
        matches: fixed([md(4, 9), md(4, 9)]),
    },
    {
        id: "earth-day",
        name: "Earth Day",
        icon: "sprout",
        message: "Happy Earth Day!",
        essence: "Small actions can help protect our shared environment.",
        matches: fixed([md(4, 22), md(4, 22)]),
    },
    {
        id: "labor-day",
        name: "Labor Day",
        icon: "tool",
        message: "Happy Labor Day!",
        essence: "Recognizing the dedication and contributions of workers everywhere.",
        matches: fixed([md(5, 1), md(5, 1)]),
    },
    {
        id: "independence-day",
        name: "Philippine Independence Day",
        icon: "flag",
        message: "Happy Philippine Independence Day!",
        essence: "Celebrating freedom and remembering the nation’s history.",
        matches: fixed([md(6, 11), md(6, 13)]),
    },
    {
        id: "nutrition-month",
        name: "Nutrition Month",
        icon: "bowl",
        message: "Nutrition Month",
        essence: "A reminder to nourish ourselves with balanced meals.",
        matches: fixed([md(7, 1), md(7, 3)]),
    },
    {
        id: "buwan-ng-wika",
        name: "National Language Month",
        icon: "book",
        message: "National Language Month",
        essence: "Celebrating the Filipino language and its role in our shared culture.",
        matches: fixed([md(8, 1), md(8, 9)]),
    },
    {
        id: "ninoy-aquino-day",
        name: "Ninoy Aquino Day",
        icon: "candle",
        message: "Ninoy Aquino Day",
        essence: "Remembering the life and legacy of Benigno Aquino Jr.",
        matches: fixed([md(8, 21), md(8, 21)]),
    },
    {
        id: "national-heroes-day",
        name: "National Heroes Day",
        icon: "medal",
        message: "National Heroes Day",
        essence: "Honoring the courage and service of the nation’s heroes.",
        matches: lastMondayOf(8),
    },
    {
        id: "undas",
        name: "All Saints and All Souls",
        icon: "candle",
        message: "Remembering Our Loved Ones",
        essence: "A time to honor and remember those who have passed away.",
        // First in the array on purpose: Oct 31 is Undas, not Halloween.
        matches: fixed([md(10, 31), md(11, 2)]),
    },
    {
        id: "halloween",
        name: "Halloween",
        icon: "pumpkin",
        message: "Happy Halloween!",
        essence: "A little seasonal fun before the days of remembrance.",
        matches: fixed([md(10, 30), md(10, 30)]),
    },
    {
        id: "bonifacio-day",
        name: "Bonifacio Day",
        icon: "flag",
        message: "Bonifacio Day",
        essence: "Remembering Andres Bonifacio and his role in the Philippine Revolution.",
        matches: fixed([md(11, 30), md(11, 30)]),
    },
    {
        id: "simbang-gabi",
        name: "Christmas Novena",
        icon: "lantern",
        message: "Christmas Novena",
        essence: "Nine days of worship and preparation before Christmas.",
        matches: fixed([md(12, 16), md(12, 24)]),
    },
    {
        id: "christmas",
        name: "Christmas",
        icon: "parol",
        message: "Merry Christmas!",
        essence: "Wishing you peace, joy, and time with loved ones.",
        matches: fixed([md(12, 25), md(12, 26)]),
    },
    {
        id: "rizal-day",
        name: "Rizal Day",
        icon: "quill",
        message: "Rizal Day",
        essence: "Remembering the life and legacy of Dr. Jose Rizal.",
        matches: fixed([md(12, 30), md(12, 30)]),
    },
    {
        id: "media-noche",
        name: "New Year's Eve",
        icon: "firecracker",
        message: "Happy New Year's Eve!",
        essence: "Welcoming the new year with hope and celebration.",
        matches: fixed([md(12, 31), md(12, 31)]),
    },

    // ── Month-long devotion (the only one on purpose) ───────────────────────
    {
        id: "flores-de-mayo",
        name: "May Flower Festival",
        icon: "flower",
        message: "May Flower Festival",
        essence: "A month of flower offerings and community devotion.",
        matches: fixed([md(5, 1), md(5, 31)]),
    },
];

/**
 * Returns the event for `date`, or null when it is a normal day.
 * `previewId` forces a specific event (used by ?season=<id> for testing).
 */
export function getActiveEvent(date = new Date(), previewId = null) {
    if (previewId) {
        return SEASONAL_EVENTS.find((event) => event.id === previewId) ?? null;
    }
    return SEASONAL_EVENTS.find((event) => event.matches(date)) ?? null;
}

/**
 * Decoration per event, painted by the canvas engine (see SeasonEffects.jsx +
 * lib/seasonalCanvas.js). No emoji and no images: each layer names a shape from
 * lib/seasonalShapes.js and a motion kind.
 *
 *   kinds    fall | tumble | rise | fly | dangle | roll | spin | twinkle | row | burst
 *   fields   shape(s), count, size [min,max] px, duration [min,max] s,
 *            amp [min,max] px (sway), thread/bob (dangle), radius/sparks (burst),
 *            edge/anim (row: wave | flicker | blink | bob | sway), colors (palette)
 *
 * Colours come from the app's own --primary unless a layer sets `colors`, so the
 * decorations inherit each department's colour coding instead of fighting it.
 * An event with no entry here simply has no animation.
 */
export const SEASONAL_EFFECTS = {
    "new-year": [
        { kind: "burst", count: 3, sparks: 14, radius: [60, 120], colors: "fireworks", duration: [2.8, 4.2] },
        { kind: "tumble", shapes: ["confetti"], count: 12, size: [10, 16], duration: [6, 10], amp: [20, 50], colors: "fireworks" },
    ],
    "chinese-new-year": [
        { kind: "dangle", shape: "lantern", count: 5, size: [30, 42], thread: [40, 110], duration: [3, 5] },
        { kind: "fall", shape: "envelope", count: 6, size: [18, 26], duration: [12, 20], amp: [20, 45] },
        { kind: "twinkle", shape: "sparkle", count: 5, size: [14, 20], duration: [3, 6] },
    ],
    valentines: [
        { kind: "rise", shapes: ["heart", "envelope"], count: 12, size: [16, 28], duration: [12, 20], amp: [20, 45] },
    ],
    "womens-day": [
        { kind: "rise", shapes: ["tulip", "flower"], count: 10, size: [22, 32], duration: [14, 22], amp: [15, 35] },
        { kind: "twinkle", shape: "sparkle", count: 6, size: [14, 20], duration: [3, 6] },
    ],
    "eid-l-fitr": [
        { kind: "dangle", shapes: ["moon", "lantern"], count: 4, size: [26, 36], thread: [50, 120], duration: [3.5, 5] },
        { kind: "twinkle", shape: "star", count: 7, size: [14, 22], duration: [3, 6] },
    ],
    "holy-week": [
        { kind: "row", edge: "top", anim: "flicker", shape: "candle", count: 7, size: 34, duration: [2.6, 4] },
        { kind: "fall", shape: "petal", count: 6, size: [22, 32], duration: [16, 26], amp: [18, 40] },
    ],
    "araw-ng-kagitingan": [
        { kind: "row", edge: "top", anim: "wave", shape: "flag", count: 8, size: 26, duration: [2, 3] },
    ],
    "earth-day": [
        { kind: "fall", shapes: ["leaf", "sprout"], count: 14, size: [24, 38], duration: [12, 20], amp: [25, 55] },
    ],
    "labor-day": [
        { kind: "roll", shape: "tool", count: 9, size: [30, 46], duration: [14, 24] },
        { kind: "row", edge: "top", anim: "sway", shape: "tool", count: 6, size: 26, duration: [2.6, 3.6] },
    ],
    "flores-de-mayo": [
        { kind: "fall", shapes: ["flower", "petal"], count: 12, size: [24, 36], duration: [10, 18], amp: [30, 60] },
    ],
    "independence-day": [
        { kind: "row", edge: "top", anim: "wave", shape: "flag", count: 9, size: 28, duration: [2, 3] },
        { kind: "tumble", shape: "confetti", count: 12, size: [10, 16], duration: [7, 11], amp: [20, 45], colors: "flag" },
    ],
    "nutrition-month": [
        { kind: "roll", shapes: ["carrot", "apple", "bowl"], count: 8, size: [30, 44], duration: [14, 22] },
        { kind: "row", edge: "bottom", anim: "bob", shapes: ["apple", "carrot", "bowl"], count: 7, size: 30, duration: [1.8, 2.8] },
    ],
    "buwan-ng-wika": [
        { kind: "rise", shapes: ["book", "letter", "letter"], count: 12, size: [18, 28], duration: [12, 20], amp: [20, 40] },
        { kind: "row", edge: "top", anim: "wave", shape: "flag", count: 7, size: 22, duration: [2, 3] },
    ],
    "ninoy-aquino-day": [
        { kind: "row", edge: "top", anim: "flicker", shape: "candle", count: 6, size: 32, duration: [2.6, 4] },
        { kind: "rise", shape: "dove", count: 4, size: [20, 28], duration: [16, 24], amp: [20, 40] },
    ],
    "national-heroes-day": [
        { kind: "dangle", shape: "medal", count: 6, size: [26, 36], thread: [40, 120], duration: [3, 4.5] },
        { kind: "row", edge: "top", anim: "wave", shape: "flag", count: 7, size: 24, duration: [2, 3] },
    ],
    undas: [
        { kind: "row", edge: "bottom", anim: "flicker", shape: "candle", count: 8, size: 34, duration: [2.4, 3.8] },
        { kind: "fall", shapes: ["flower", "petal"], count: 8, size: [24, 38], duration: [14, 24], amp: [20, 50] },
    ],
    halloween: [
        { kind: "fly", shape: "bat", count: 5, size: [22, 34], duration: [9, 16], dir: "both", flap: true },
        { kind: "rise", shape: "ghost", count: 4, size: [28, 40], duration: [14, 22], amp: [40, 90] },
        { kind: "dangle", shape: "spider", count: 4, size: [22, 30], thread: [60, 160], duration: [3, 5], bob: [20, 50] },
        { kind: "row", edge: "bottom", anim: "bob", shape: "pumpkin", count: 7, size: 30, duration: [1.6, 2.6] },
    ],
    "bonifacio-day": [
        { kind: "row", edge: "top", anim: "wave", shape: "flag", count: 7, size: 26, duration: [2, 3] },
        { kind: "fall", shape: "leaf", count: 6, size: [16, 24], duration: [14, 22], amp: [20, 45] },
    ],
    "simbang-gabi": [
        { kind: "dangle", shape: "lantern", count: 5, size: [30, 44], thread: [40, 120], duration: [3.5, 5] },
        { kind: "row", edge: "top", dots: true, anim: "blink", count: 20, size: 10, duration: [1.4, 2.2] },
    ],
    christmas: [
        { kind: "fall", shapes: ["snowflake", "star"], count: 16, size: [12, 24], duration: [10, 18], amp: [20, 50] },
        { kind: "row", edge: "top", anim: "blink", shape: "parol", count: 7, size: 22, duration: [1.6, 2.4] },
    ],
    "rizal-day": [
        { kind: "tumble", shape: "quill", count: 8, size: [24, 34], duration: [14, 24], amp: [20, 45] },
        { kind: "rise", shape: "dove", count: 3, size: [20, 26], duration: [16, 26], amp: [20, 40] },
    ],
    "media-noche": [
        { kind: "burst", count: 4, sparks: 16, radius: [60, 130], colors: "fireworks", duration: [2.6, 4] },
        { kind: "tumble", shape: "confetti", count: 12, size: [10, 16], duration: [6, 10], amp: [20, 50], colors: "fireworks" },
    ],
};

/* ────────────────────────────────────────────────────────────────────────────
 * Schedule readers (compat surface)
 *
 * These exist so the theme cannot break a project that still has older seasonal
 * files lying around. `lib/seasonalContext.js` (and any old `useSeasonalTheme`)
 * imports `eventRangeLabel` by name, and a missing named export is a hard ESM
 * error in Vite - the whole app stops, not just the decoration. The ranges are
 * derived from each event's own `matches()`, so there is still exactly one
 * source of truth for the calendar: nothing here can drift from the schedule.
 * ────────────────────────────────────────────────────────────────────────── */

const MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAY_MS = 864e5;
const spansCache = new WeakMap();

/** Inclusive day spans of one event for `year`, found by walking the calendar. */
function spansFor(event, year) {
    if (!event || typeof event.matches !== "function") return [];
    let byYear = spansCache.get(event);
    if (!byYear) {
        byYear = new Map();
        spansCache.set(event, byYear);
    }
    if (byYear.has(year)) return byYear.get(year);

    const found = [];
    const cursor = new Date(year, 0, 1);
    let open = null;
    while (cursor.getFullYear() === year) {
        if (event.matches(new Date(cursor))) {
            if (!open) open = { from: startOfDay(cursor), to: null };
        } else if (open) {
            open.to = new Date(startOfDay(cursor).getTime() - DAY_MS);
            found.push(open);
            open = null;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    if (open) {
        open.to = new Date(year, 11, 31);
        found.push(open);
    }

    byYear.set(year, found);
    return found;
}

const toKey = (date) => startOfDay(date).getTime();
const isWithin = (span, date) => {
    const d = toKey(date);
    return d >= toKey(span.from) && d <= toKey(span.to);
};
const spanDays = (span) => Math.round((toKey(span.to) - toKey(span.from)) / DAY_MS) + 1;

/** Spans of an event for the year of `date`. */
export function eventSpans(event, date = new Date()) {
    return spansFor(event, date.getFullYear());
}

/** The span covering `date`, or null. */
export function eventTodaySpan(event, date = new Date()) {
    return eventSpans(event, date).find((span) => isWithin(span, date)) ?? null;
}

/** How many days a year this event occupies. */
export function eventDayCount(event, date = new Date()) {
    return eventSpans(event, date).reduce((sum, span) => sum + spanDays(span), 0);
}

/** "December 16-24, 2026" / "April 9, 2026" */
export function formatSpan({ from, to }, { year = true } = {}) {
    const f = MONTHS_EN[from.getMonth()];
    const t = MONTHS_EN[to.getMonth()];
    const body =
        toKey(from) === toKey(to)
            ? `${f} ${from.getDate()}`
            : from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()
              ? `${f} ${from.getDate()}-${to.getDate()}`
              : `${f} ${from.getDate()} - ${t} ${to.getDate()}`;
    return year ? `${body}, ${to.getFullYear()}` : body;
}

/** Human-readable English day count. */
export function dayCountLabel(days) {
    return `${days} ${days === 1 ? "day" : "days"}`;
}

/**
 * { text, days, state: "active" | "upcoming", span, inDays } - what an old
 * SeasonBanner pill prints, and null when the event has no dates at all.
 */
export function eventRangeLabel(event, date = new Date()) {
    const spans = eventSpans(event, date);
    if (!spans.length) return null;
    const text = spans.map((span) => formatSpan(span)).join(" · ");
    const days = spans.reduce((sum, span) => sum + spanDays(span), 0);
    const today = startOfDay(date);

    const active = spans.find((span) => isWithin(span, date));
    if (active) return { text, days, state: "active", span: active };

    const upcoming = (list) =>
        [...list].filter((span) => span.from >= today).sort((a, b) => a.from - b.from)[0] ?? null;
    const next =
        upcoming(spans) ?? upcoming(eventSpans(event, new Date(date.getFullYear() + 1, 0, 1)));

    return {
        text,
        days,
        state: "upcoming",
        span: next,
        inDays: next ? Math.round((next.from - today) / DAY_MS) : null,
    };
}

/** True on any scheduled day (used by old callers that had no `getActiveEvent`). */
export function isSeasonalDay(date = new Date()) {
    return SEASONAL_EVENTS.some((event) => eventSpans(event, date).some((span) => isWithin(span, date)));
}

/** This build ships no photographs: photo slots resolve to null, never throw. */
export function photoOf() {
    return null;
}

/** Resolves string-or-function copy for a date (old `<SeasonBanner>` helper). */
export function eventText(value, date = new Date()) {
    return typeof value === "function" ? value(date) : value;
}
