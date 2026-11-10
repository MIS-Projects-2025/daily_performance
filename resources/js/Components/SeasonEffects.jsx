import { useEffect, useRef } from "react";
import { SEASONAL_EFFECTS } from "@/lib/seasonalEvents";
import { drawShape } from "@/lib/seasonalShapes";
import { readSeasonalColors } from "@/lib/seasonalCanvas";

// In-flow ribbon, not a viewport overlay. The layout places it after the banner
// and before <main>, so canvas drawings can never cover the form or table.
export default function SeasonEffects({ event, active = true, seasonal } = {}) {
    const target = seasonal?.event ?? event;
    const on = seasonal ? Boolean(seasonal.effectsActive) : Boolean(active);
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !on || !target) return undefined;
        let ctx;
        try { ctx = canvas.getContext("2d"); } catch { return undefined; }
        if (!ctx) return undefined;

        const layerShapes = (SEASONAL_EFFECTS[target.id] || []).flatMap((layer) =>
            layer.shapes || (layer.shape ? [layer.shape] : layer.dots ? ["bulb"] : ["sparkle"]),
        );
        const shapes = [...new Set([target.icon, ...layerShapes].filter(Boolean))];
        if (!shapes.length) shapes.push("sparkle");
        let width = 0, height = 0, raf = 0, last = 0, clock = 0;
        let colors = readSeasonalColors(document.documentElement);
        let alive = true;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const frame = (now) => {
            if (!alive) return;
            if (!last) last = now;
            clock += Math.min(0.05, (now - last) / 1000);
            last = now;
            ctx.clearRect(0, 0, width, height);
            if (width > 0 && height > 0) {
                // Distribute the drawings across the actual available column width.
                const count = Math.max(2, Math.min(12, Math.floor(width / 100)));
                const size = Math.min(32, height * 0.48, width / (count * 1.6));
                for (let i = 0; i < count; i += 1) {
                    ctx.save();
                    ctx.translate((i + 0.5) * width / count, height / 2 + Math.sin(clock * 1.3 + i * 0.8) * 3);
                    ctx.rotate(Math.sin(clock * 0.9 + i) * 0.06);
                    drawShape(ctx, shapes[i % shapes.length], size, colors, clock);
                    ctx.restore();
                }
            }
            raf = window.requestAnimationFrame(frame);
        };
        const stop = () => { if (raf) window.cancelAnimationFrame(raf); raf = 0; };
        const start = () => { if (!raf && !document.hidden) { last = 0; raf = window.requestAnimationFrame(frame); } };
        const visibility = () => document.hidden ? stop() : start();
        const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
        resizeObserver?.observe(canvas);
        const colorObserver = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
            colors = readSeasonalColors(document.documentElement);
        });
        colorObserver?.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", visibility);
        resize();
        start();
        return () => {
            alive = false;
            stop();
            resizeObserver?.disconnect();
            colorObserver?.disconnect();
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", visibility);
        };
    }, [on, target?.id]);

    if (!on || !target) return null;
    return (
        <div aria-hidden="true" data-season-ribbon="" style={{ position: "relative", width: "100%", height: 64, flex: "0 0 64px", overflow: "hidden", pointerEvents: "none" }}>
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        </div>
    );
}
