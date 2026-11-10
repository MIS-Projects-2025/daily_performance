// The seasonal decoration engine: one <canvas>, requestAnimationFrame, and
// hand-written shape painters. No emoji, no images, no CSS keyframes, no fonts.
// Framework-free on purpose - SeasonEffects.jsx only sizes the canvas and drives
// this, which is also what lets the whole thing be tested/rendered outside a DOM.
//
// Layer kinds (see SEASONAL_EFFECTS in seasonalEvents.js):
//   fall    drifts down while swaying            (candles' light, petals, ash)
//   tumble  falls while rotating                 (leaves, petals, confetti)
//   rise    floats upward while swaying          (ghosts, hearts, bubbles, steam)
//   fly     crosses the screen                   (bats, doves)               dir, flap
//   dangle  hangs from the top on a thread, swings                            thread, bob
//   roll    rolls along the bottom edge
//   spin    stays put and rotates / pulses                     spots
//   twinkle fades in and out at a fixed spot
//   row     a row pinned to an edge, with a per-item delay     edge, anim
//   burst   fireworks: sparks fly out and fade                              sparks, radius
//
// Colours: `colors.base` is the *department's* own --primary. The theme never
// writes that variable; it only reads it (see useSeasonalColors below).

import { drawShape } from "./seasonalShapes.js";

export const MAX_ITEMS = 56;
export const LAYER_PALETTES = {
    lights: ["#ef4444", "#22c55e", "#facc15", "#3b82f6"],
    fireworks: ["#facc15", "#f472b6", "#38bdf8", "#a3e635", "#fb923c"],
    flag: ["#1d3f8f", "#c9202e", "#facc15"],
};

const TWO_PI = Math.PI * 2;

const rand = (range, fallback) => {
    const [min, max] = Array.isArray(range) ? range : [range, range];
    return min + Math.random() * (max - min || 1);
};
const band = (value, fallback) => (Array.isArray(value) ? value : [value ?? fallback[0], value ?? fallback[1]]);
const wrap01 = (v) => v - Math.floor(v);

/**
 * Build the item list for an event. Deterministic per mount (Math.random at
 * build time, never per frame), so nothing jitters when React re-renders.
 */
export function createScene(layers) {
    const items = [];
    if (!Array.isArray(layers)) return { items, signature: "" };

    for (let li = 0; li < layers.length; li += 1) {
        const layer = layers[li];
        const kind = layer.kind ?? "fall";
        const count = Math.max(0, Math.min(layer.count ?? 0, kind === "row" ? 26 : 20));
        const [minS, maxS] = band(layer.size, [22, 22]);
        const [minD, maxD] = band(layer.duration, [12, 18]);
        const [minA, maxA] = band(layer.amp, [20, 40]);
        const [minT, maxT] = band(layer.thread, [60, 130]);
        const [minB, maxB] = band(layer.bob, [14, 40]);
        const [minR, maxR] = band(layer.radius, [60, 110]);
        const shapes = layer.shapes ?? (layer.shape ? [layer.shape] : ["sparkle"]);
        // A layer may name a palette ("fireworks") or list colours directly.
        const colors = Array.isArray(layer.colors)
            ? layer.colors
            : typeof layer.colors === "string"
                ? LAYER_PALETTES[layer.colors] ?? null
                : null;

        for (let i = 0; i < count; i += 1) {
            if (items.length >= MAX_ITEMS) break;
            const dur = Math.max(0.6, minD + Math.random() * Math.max(0, maxD - minD));
            items.push({
                kind,
                layer: li,
                shape: shapes[(i + li) % shapes.length],
                size: Math.min(64, Math.max(8, minS + Math.random() * Math.max(0, maxS - minS))),
                x: (i + 0.5 + Math.random() * 0.6) / count,
                y: Math.random(),
                dur,
                phase: Math.random(),
                amp: Math.max(4, minA + Math.random() * Math.max(0, maxA - minA)),
                spin: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.9),
                alpha: 0.55 + Math.random() * 0.4,
                dir: layer.dir === "both" ? (i % 2 === 0 ? 1 : -1) : layer.dir === "rtl" ? -1 : 1,
                flap: Boolean(layer.flap),
                thread: minT + Math.random() * Math.max(0, maxT - minT),
                bobAmp: minB + Math.random() * Math.max(0, maxB - minB),
                radius: minR + Math.random() * Math.max(0, maxR - minR),
                sparks: Math.max(4, Math.min(18, layer.sparks ?? 10)),
                spots: layer.spots ? layer.spots[i % layer.spots.length] : null,
                edge: layer.edge === "bottom" ? "bottom" : "top",
                anim: layer.anim ?? "wave",
                dots: Boolean(layer.dots),
                colorIdx: colors ? i % colors.length : -1,
                color: colors ? colors[i % colors.length] : undefined,
                tint: layer.tint ?? "base",
            });
        }
    }
    // A cheap fingerprint so the wrapper can skip work when the event is the same.
    return { items, signature: items.map((i) => i.kind + i.shape).join(",") };
}

/**
 * Paint one frame. `t` is seconds since mount; the caller owns the transform
 * (device-pixel scaling) and the clear.
 */
export function paintFrame(ctx, scene, width, height, t, colors) {
    if (!scene || !scene.items.length) return 0;
    // A single bad number in the table would otherwise blank the whole canvas
    // silently, so frame geometry is checked before anything is drawn.
    if (![width, height, t].every(Number.isFinite)) return 0;
    let drawn = 0;

    for (const item of scene.items) {
        if (![item.x, item.y, item.size, item.dur, item.amp, item.phase].every(Number.isFinite)) continue;
        const cycle = wrap01(t / item.dur + item.phase);
        const sway = Math.sin((t / item.dur) * TWO_PI * 2 + item.phase * TWO_PI) * item.amp;
        let x = item.x * width;
        let y = item.y * height;
        let rot = 0;
        let alpha = item.alpha;
        let scale = 1;
        let threadFrom = null;

        switch (item.kind) {
            case "fall":
                y = -item.size + cycle * (height + item.size * 2);
                x += sway;
                break;
            case "tumble":
                y = -item.size + cycle * (height + item.size * 2);
                x += sway * 0.6;
                rot = cycle * TWO_PI * item.spin * 2;
                break;
            case "rise":
                y = height + item.size - cycle * (height + item.size * 2);
                x += sway * 0.7;
                rot = Math.sin(cycle * TWO_PI) * 0.18;
                break;
            case "fly": {
                const travel = wrap01(cycle);
                x = (item.dir > 0 ? travel : 1 - travel) * (width + item.size * 2) - item.size;
                y = item.y * height * 0.7 + Math.sin(travel * TWO_PI * 1.5) * height * 0.05;
                rot = item.dir > 0 ? 0 : Math.PI;
                if (item.flap) scale = 1 + Math.sin(t * 7 + item.phase * 6) * 0.06;
                break;
            }
            case "dangle": {
                const swing = Math.sin((t / item.dur) * TWO_PI + item.phase * TWO_PI);
                x = item.x * width;
                y = item.thread + Math.abs(swing) * item.bobAmp * 0.35;
                rot = swing * 0.22;
                threadFrom = { x0: x, y0: 0, x1: x + Math.sin(rot) * item.thread, y1: y - item.size * 0.4 };
                break;
            }
            case "roll":
                x = -item.size + cycle * (width + item.size * 2);
                y = height - item.size * 0.55 - Math.abs(Math.sin(cycle * Math.PI * 6)) * item.size * 0.35;
                rot = cycle * TWO_PI * 1.5 * (item.spin > 0 ? 1 : -1);
                break;
            case "spin":
                if (item.spots) {
                    x = (item.spots[0] / 100) * width;
                    y = (item.spots[1] / 100) * height;
                }
                rot = item.anim === "spin" ? (t / item.dur) * TWO_PI : 0;
                scale = item.anim === "pulse" ? 1 + Math.sin((t / item.dur) * TWO_PI) * 0.08 : 1;
                break;
            case "twinkle":
                alpha = 0.25 + Math.abs(Math.sin((t / item.dur) * TWO_PI + item.phase * TWO_PI)) * 0.75;
                scale = 0.85 + alpha * 0.25;
                break;
            case "row": {
                const step = (item.x * width) % width;
                x = step;
                const wave = Math.sin((t / item.dur) * TWO_PI + item.x * 6);
                // Shapes reach about 0.7x their size from the centre (flame, wire),
                // so rows are inset that far - otherwise the top of every candle or
                // bulb is cut off by the viewport edge.
                const pad = item.size * 0.72;
                if (item.edge === "bottom") {
                    y = height - pad;
                    if (item.anim === "bob") y -= Math.abs(wave) * item.bobAmp * 0.35;
                    if (item.anim === "sway") rot = wave * 0.12;
                } else {
                    y = pad;
                    if (item.anim === "wave") y += wave * item.bobAmp * 0.25;
                    if (item.anim === "sway") rot = wave * 0.1;
                }
                if (item.anim === "blink") alpha = wave > 0 ? 1 : 0.25;
                if (item.anim === "flicker") alpha = 0.55 + Math.abs(wave) * 0.45;
                break;
            }
            case "burst": {
                const p = cycle;
                const cx = item.x * width;
                const cy = item.y * height * 0.75 + height * 0.05;
                alpha = p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.15) / 0.85);
                const rad = item.radius * (0.25 + p * 1.1);
                for (let k = 0; k < item.sparks; k += 1) {
                    const a = (k / item.sparks) * TWO_PI;
                    const sx = cx + Math.cos(a) * rad;
                    const sy = cy + Math.sin(a) * rad + p * p * item.radius * 0.5;
                    const px = cx + Math.cos(a) * rad * 0.72;
                    const py = cy + Math.sin(a) * rad * 0.72 + p * p * item.radius * 0.3;
                    ctx.globalAlpha = alpha * 0.9;
                    ctx.strokeStyle = item.colorIdx >= 0 ? item.color : colors.accent ?? "#ffd34d";
                    ctx.lineWidth = Math.max(1, item.size * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(sx, sy);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                drawn += 1;
                break;
            }
            default:
                break;
        }

        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        ctx.save();
        ctx.translate(x, y);
        if (rot) ctx.rotate(rot);
        if (scale !== 1) ctx.scale(scale, scale);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        if (threadFrom) {
            ctx.strokeStyle = colors.thread ?? "rgba(120,120,120,.45)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(threadFrom.x0 - x, threadFrom.y0 - y);
            ctx.lineTo(threadFrom.x1 - x, threadFrom.y1 - y);
            ctx.stroke();
        }

        const tint = item.colorIdx >= 0 ? { ...colors, base: item.color, accent: item.color } : colors;
        drawShape(ctx, item.shape, item.size, tint, wrap01(t / item.dur + item.phase));
        ctx.restore();
        drawn += 1;
        ctx.globalAlpha = 1;
    }
    return drawn;
}

/**
 * Per-item colours for layers that need their own palette (light bulbs,
 * confetti). Kept local so a hue can never leak into the app's tokens.
 */
export function applyLayerColors(scene, palettes) {
    if (!scene) return scene;
    for (const item of scene.items) {
        item.color = item.colorIdx >= 0 && palettes ? palettes[item.colorIdx % palettes.length] : undefined;
    }
    return scene;
}


/**
 * Turn SEASONAL_EFFECTS layers into engine layers: shape names instead of emoji.
 */
export function sceneForEvent(event, effects) {
    const layers = effects?.[event?.id];
    if (!layers) return { items: [], signature: "" };
    const scene = createScene(
        layers.map((layer) => ({
            ...layer,
            // `dots: true` = a string of lights; everything else names its shape.
            shape: layer.shape ?? (layer.dots ? "bulb" : "sparkle"),
            shapes: layer.shapes ?? null,
            colors: layer.dots ? LAYER_PALETTES.lights : layer.colors === "fireworks" ? LAYER_PALETTES.fireworks : null,
        })),
    );
    applyLayerColors(scene, null);
    return scene;
}

/**
 * Read the department's own colour and derive the palette the shapes are painted
 * with. Nothing here writes a token back - the app keeps its colour coding, the
 * decorations simply borrow it. Called again when <html class/style> changes
 * (dark mode toggle, department switch), so it follows live.
 */
/**
 * Turns any CSS colour the app might store in `--primary` into an [h, s, l] triple:
 * shadcn's `h s% l%`, `hsl(...)`, `#hex`, `rgb(...)`, and Tailwind v4's `oklch(...)`.
 * Every one of those is common in real Laravel+shadcn projects, and a theme that only
 * understood the HSL triple would silently paint in the fallback colour instead of the
 * department's - which is exactly the complaint this whole file exists to answer.
 */
export function parsePrimaryColor(raw) {
    if (!raw) return null;
    const t = String(raw).trim().toLowerCase().replace(/\s+/g, " ");
    if (!t) return null;
    const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : null;
    };
    const wrap = (h, s, l) => [(((h % 360) + 360) % 360), Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l))];

    let m = t.match(/^hsla?\(\s*([\d.]+)(?:deg)?[ ,]+([\d.]+)%?[ ,]+([\d.]+)%?/);
    if (m) {
        const [h, s, l] = [num(m[1]), num(m[2]), num(m[3])];
        if (h !== null && s !== null && l !== null) return wrap(h, s, l);
    }
    // bare token: "262 83% 58%" | "262, 83%, 58%" | "262 83 58"
    m = t.match(/^([\d.]+)(?:deg)?[ ,]+([\d.]+)%?[ ,]+([\d.]+)%?$/);
    if (m) {
        const [h, s, l] = [num(m[1]), num(m[2]), num(m[3])];
        if (h !== null && s !== null && l !== null) return wrap(h, s, l);
    }
    m = t.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
    if (m) {
        let hex = m[1];
        if (hex.length === 3 || hex.length === 4) hex = hex.split("").slice(0, 3).map((c) => c + c).join("");
        else hex = hex.slice(0, 6);
        const v = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
        if (v.some(Number.isNaN)) return null;
        return rgbToHsl(v[0], v[1], v[2]);
    }
    m = t.match(/^rgba?\(\s*([\d.]+)(%?)[ ,]+([\d.]+)(%?)[ ,]+([\d.]+)(%?)/);
    if (m) {
        const pct = m[2] === "%";
        const conv = (v, isPct) => (isPct ? (parseFloat(v) / 100) * 255 : parseFloat(v));
        const r = conv(m[1], pct);
        const g = conv(m[3], m[4] === "%");
        const b = conv(m[5], m[6] === "%");
        if ([r, g, b].every(Number.isFinite)) return rgbToHsl(r, g, b);
    }
    m = t.match(/^oklch\(\s*([\d.]+)(%?)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:deg)?/);
    if (m) {
        // oklch accepts a percentage lightness too: oklch(75% .15 70deg)
        const lightness = m[2] === "%" ? parseFloat(m[1]) / 100 : num(m[1]);
        const [r, g, b] = oklchToRgb(lightness, num(m[3]), num(m[4]));
        if ([r, g, b].every(Number.isFinite)) return rgbToHsl(r, g, b);
    }
    return null;
}

function rgbToHsl(r, g, b) {
    const [rn, gn, bn] = [r, g, b].map((v) => Math.max(0, Math.min(255, v)) / 255);
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;
    if (!d) return [0, 0, Math.round(l * 1000) / 10];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    return [(((h * 60) % 360) + 360) % 360, Math.min(100, s * 100), l * 100].map((v) => Math.round(v * 10) / 10);
}

/** oklch -> 8-bit sRGB (Oklab matrix + gamma encode); good enough for tinting. */
function oklchToRgb(L, C, H) {
    if (![L, C, H].every(Number.isFinite)) return [NaN, NaN, NaN];
    const hr = (H * Math.PI) / 180;
    const a = C * Math.cos(hr);
    const bb = C * Math.sin(hr);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
    const s_ = L - 0.0894841775 * a - 1.291485548 * bb;
    const [l3, m3, s3] = [l_ ** 3, m_ ** 3, s_ ** 3];
    const lin = [
        4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
        -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
        -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
    ];
    return lin.map((c) => {
        const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
        return Math.round(Math.max(0, Math.min(1, v)) * 255);
    });
}

/**
 * Reads the department's own --primary and derives the whole decoration palette
 * from it. Read-only by design: nothing here writes a token back, so an event can
 * never recolour the app or fight the per-department colour coding.
 */
export function readSeasonalColors(root) {
    const el = root ?? (typeof document !== "undefined" ? document.documentElement : null);
    let raw = "";
    try {
        raw = getComputedStyle(el).getPropertyValue("--primary") || "";
    } catch {
        raw = "";
    }
    const parsed = parsePrimaryColor(raw);
    const [h, sat, li] = parsed ?? [222, 40, 45]; // calm slate if the token is unreadable
    const clamp = (v) => Math.max(0, Math.min(100, v));
    const hsl = (hh, ss, ll, a) =>
        a === undefined ? `hsl(${Math.round(hh)} ${Math.round(ss)}% ${Math.round(ll)}%)` : `hsl(${Math.round(hh)} ${Math.round(ss)}% ${Math.round(ll)}% / ${a})`;
    return {
        base: hsl(h, sat, li),
        light: hsl(h, clamp(sat * 0.9), clamp(li + 26)),
        dark: hsl(h, clamp(sat * 0.8), clamp(li - 20)),
        accent: hsl(h, clamp(Math.max(sat, 70)), clamp(Math.max(li + 8, 58))),
        ink: hsl(h, clamp(sat * 0.6), 14),
        green: "hsl(122 34% 34%)",
        red: "hsl(352 68% 44%)",
        blue: "hsl(222 68% 40%)",
        thread: hsl(h, 12, 52, 0.5),
    };
}
