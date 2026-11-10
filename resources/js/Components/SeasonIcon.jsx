import { useEffect, useRef } from "react";
import { drawShape } from "@/lib/seasonalShapes";
import { readSeasonalColors } from "@/lib/seasonalCanvas";

// One seasonal object, drawn with canvas paths at icon size - the banner uses it
// instead of an emoji so nothing depends on a system emoji font (and so the icon
// can be tinted with the department colour). Static on purpose: a 18px icon does
// not need an animation loop.
export default function SeasonIcon({ name = "sparkle", size = 18, className = "" }) {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        const colors = readSeasonalColors(canvas);
        // Keep it legible on bg-primary/10: use the strip's own text colour for the
        // silhouette and the department primary for the accent parts.
        const textColor = getComputedStyle(canvas).color || "currentColor";
        drawShape(ctx, name, size, { ...colors, base: colors.base, light: textColor, ink: textColor }, 0.25);
        ctx.restore();
    }, [name, size]);

    return (
        <canvas
            ref={ref}
            aria-hidden="true"
            className={className}
            style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle" }}
        />
    );
}
