// Canvas shape painters for the seasonal theme - pure code, no images, no icon
// font, no SVG, no emoji. Each shape draws one object centred on (0, 0) inside a
// `size x size` box, so the caller only translates / rotates / scales.
//
// Why helpers instead of raw ctx calls: every fill must start from an empty path,
// otherwise a previous sub-path gets painted twice. box()/disc()/shape()/stroke()
// make that impossible to forget.

const hsl = (v, fallback) => v || fallback;

function box(ctx, style, x, y, w, h) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fillStyle = style;
    ctx.fill();
}

function disc(ctx, style, x, y, rad) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, rad), 0, Math.PI * 2);
    ctx.fillStyle = style;
    ctx.fill();
}

function shape(ctx, style, build) {
    ctx.beginPath();
    build();
    ctx.fillStyle = style;
    ctx.fill();
}

function stroke(ctx, style, width, build) {
    ctx.beginPath();
    build();
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(0.5, width);
    ctx.stroke();
}

function poly(ctx, style, pts) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
        if (i === 0) ctx.moveTo(pts[i], pts[i + 1]);
        else ctx.lineTo(pts[i], pts[i + 1]);
    }
    ctx.closePath();
    ctx.fillStyle = style;
    ctx.fill();
}

function flame(ctx, s, c, t) {
    const wig = Math.sin(t * Math.PI * 2) * s * 0.06;
    shape(ctx, hsl(c.light, "#ffb020"), () => {
        ctx.moveTo(-s * 0.16, s * 0.06);
        ctx.quadraticCurveTo(-s * 0.2 + wig, -s * 0.18, wig * 0.6, -s * 0.44);
        ctx.quadraticCurveTo(s * 0.2 + wig, -s * 0.18, s * 0.16, s * 0.06);
        ctx.closePath();
    });
    shape(ctx, hsl(c.accent, "#ffe9a8"), () => {
        ctx.moveTo(-s * 0.07, s * 0.04);
        ctx.quadraticCurveTo(0, -s * 0.12, s * 0.02, -s * 0.26);
        ctx.quadraticCurveTo(s * 0.1, -s * 0.1, s * 0.07, s * 0.04);
        ctx.closePath();
    });
}

export const SHAPES = {
    // ── All Saints' Eve ───────────────────────────────────────────────────────
    pumpkin: (ctx, s, c) => {
        shape(ctx, hsl(c.base, "#e2620f"), () => {
            ctx.ellipse(0, s * 0.06, s * 0.44, s * 0.36, 0, 0, Math.PI * 2);
        });
        // two soft rib lines, low contrast, so the silhouette stays clean when small
        ctx.globalAlpha = 0.22;
        stroke(ctx, hsl(c.dark, "#000000"), s * 0.02, () => {
            for (const k of [-0.2, 0.2]) {
                ctx.moveTo(s * k, -s * 0.28);
                ctx.quadraticCurveTo(s * (k + 0.1), s * 0.06, s * k, s * 0.4);
            }
        });
        ctx.globalAlpha = 1;
        poly(ctx, hsl(c.green, "#4b7f3f"), [
            -s * 0.05, -s * 0.27,
            s * 0.06, -s * 0.28,
            s * 0.05, -s * 0.42,
            -s * 0.08, -s * 0.4,
        ]);
        const ink = hsl(c.ink, "#3a1a00");
        poly(ctx, ink, [-s * 0.22, -s * 0.06, -s * 0.08, -s * 0.06, -s * 0.15, -s * 0.19]);
        poly(ctx, ink, [s * 0.08, -s * 0.06, s * 0.22, -s * 0.06, s * 0.15, -s * 0.19]);
        // grinning mouth: one polygon with three teeth, no rectangles
        shape(ctx, ink, () => {
            ctx.moveTo(-s * 0.24, s * 0.08);
            ctx.lineTo(-s * 0.14, s * 0.18);
            ctx.lineTo(-s * 0.05, s * 0.08);
            ctx.lineTo(s * 0.05, s * 0.18);
            ctx.lineTo(s * 0.14, s * 0.08);
            ctx.lineTo(s * 0.24, s * 0.08);
            ctx.lineTo(s * 0.16, s * 0.24);
            ctx.lineTo(-s * 0.16, s * 0.24);
            ctx.closePath();
        });
    },
    bat: (ctx, s, c, t) => {
        const flap = Math.sin(t * Math.PI * 2) * s * 0.08;
        const ink = hsl(c.ink, "#242a35");
        disc(ctx, ink, 0, 0, s * 0.13);
        for (const dir of [-1, 1]) {
            shape(ctx, ink, () => {
                ctx.moveTo(dir * s * 0.08, -s * 0.02);
                ctx.quadraticCurveTo(dir * s * 0.28, -s * 0.24 - flap, dir * s * 0.46, -s * 0.06 - flap * 0.5);
                ctx.lineTo(dir * s * 0.34, s * 0.02 - flap * 0.3);
                ctx.lineTo(dir * s * 0.42, s * 0.16);
                ctx.lineTo(dir * s * 0.22, s * 0.04);
                ctx.lineTo(dir * s * 0.12, s * 0.18);
                ctx.closePath();
            });
        }
        poly(ctx, ink, [-s * 0.08, -s * 0.09, -s * 0.03, -s * 0.23, s * 0.02, -s * 0.09]);
        poly(ctx, ink, [s * 0.03, -s * 0.09, s * 0.08, -s * 0.23, s * 0.01, -s * 0.09]);
    },
    ghost: (ctx, s, c, t) => {
        const wave = Math.sin(t * Math.PI * 2) * s * 0.03;
        shape(ctx, hsl(c.light, "rgba(236,241,248,.92)"), () => {
            ctx.moveTo(-s * 0.3, s * 0.3);
            ctx.lineTo(-s * 0.3, -s * 0.02);
            ctx.quadraticCurveTo(-s * 0.3, -s * 0.38, 0, -s * 0.38);
            ctx.quadraticCurveTo(s * 0.3, -s * 0.38, s * 0.3, -s * 0.02);
            ctx.lineTo(s * 0.3, s * 0.3 + wave);
            ctx.lineTo(s * 0.18, s * 0.18);
            ctx.lineTo(s * 0.06, s * 0.3 - wave);
            ctx.lineTo(-s * 0.06, s * 0.18);
            ctx.lineTo(-s * 0.18, s * 0.3 + wave);
            ctx.closePath();
        });
        const ink = hsl(c.ink, "#2a2f3a");
        disc(ctx, ink, -s * 0.11, -s * 0.1, s * 0.05);
        disc(ctx, ink, s * 0.11, -s * 0.1, s * 0.05);
        shape(ctx, ink, () => {
            ctx.ellipse(0, s * 0.06, s * 0.05, s * 0.08, 0, 0, Math.PI * 2);
        });
    },
    spider: (ctx, s, c) => {
        const ink = hsl(c.ink, "#262b33");
        stroke(ctx, ink, s * 0.035, () => {
            for (const dir of [-1, 1]) {
                for (let i = 0; i < 4; i += 1) {
                    const y = -s * 0.08 + i * s * 0.09;
                    ctx.moveTo(0, 0);
                    ctx.quadraticCurveTo(dir * s * 0.22, y - s * 0.16, dir * s * 0.38, y);
                }
            }
        });
        disc(ctx, ink, 0, s * 0.05, s * 0.17);
        disc(ctx, ink, 0, -s * 0.14, s * 0.09);
    },

    // ── Undas / Holy Week / memorials ─────────────────────────────────────────
    candle: (ctx, s, c, t) => {
        const wax = hsl(c.light, "#f7edd8");
        // holder dish in the department colour, so a pale candle never vanishes on white
        shape(ctx, hsl(c.base, "#c9962f"), () => {
            ctx.ellipse(0, s * 0.42, s * 0.26, s * 0.09, 0, 0, Math.PI * 2);
        });
        box(ctx, wax, -s * 0.14, -s * 0.1, s * 0.28, s * 0.5);
        stroke(ctx, hsl(c.dark, "rgba(0,0,0,.35)"), Math.max(1, s * 0.02), () => {
            ctx.rect(-s * 0.14, -s * 0.1, s * 0.28, s * 0.5);
        });
        stroke(ctx, hsl(c.dark, "#4a3a20"), Math.max(1, s * 0.02), () => {
            ctx.moveTo(0, -s * 0.1);
            ctx.lineTo(0, -s * 0.18);
        });
        flame(ctx, s * 0.62, c, t);
    },
    cross: (ctx, s, c) => {
        const wood = hsl(c.dark, "#6b4b2a");
        box(ctx, wood, -s * 0.07, -s * 0.42, s * 0.14, s * 0.84);
        box(ctx, wood, -s * 0.26, -s * 0.2, s * 0.52, s * 0.13);
    },
    flower: (ctx, s, c) => {
        for (let k = 0; k < 6; k += 1) {
            const a = (k / 6) * Math.PI * 2;
            shape(ctx, hsl(c.light, "#f9c9dd"), () => {
                ctx.ellipse(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22, s * 0.19, s * 0.13, a, 0, Math.PI * 2);
            });
        }
        disc(ctx, hsl(c.accent, "#ffd34d"), 0, 0, s * 0.13);
    },
    petal: (ctx, s, c) => {
        // one blossom petal - wide enough to read at 18-34px
        shape(ctx, hsl(c.light, "#f9c9dd"), () => {
            ctx.moveTo(0, -s * 0.42);
            ctx.bezierCurveTo(s * 0.42, -s * 0.18, s * 0.28, s * 0.34, 0, s * 0.42);
            ctx.bezierCurveTo(-s * 0.28, s * 0.34, -s * 0.42, -s * 0.18, 0, -s * 0.42);
            ctx.closePath();
        });
    },
    leaf: (ctx, s, c) => {
        shape(ctx, hsl(c.base, "#5d8a4a"), () => {
            ctx.moveTo(-s * 0.34, s * 0.16);
            ctx.quadraticCurveTo(-s * 0.05, -s * 0.34, s * 0.34, -s * 0.2);
            ctx.quadraticCurveTo(s * 0.05, s * 0.3, -s * 0.34, s * 0.16);
            ctx.closePath();
        });
        stroke(ctx, hsl(c.dark, "rgba(0,0,0,.2)"), s * 0.02, () => {
            ctx.moveTo(-s * 0.3, s * 0.14);
            ctx.lineTo(s * 0.3, -s * 0.19);
        });
    },

    // ── Christmas season ──────────────────────────────────────────────────────
    parol: (ctx, s, c, t) => {
        const squash = 1 + Math.cos(t * Math.PI * 2) * 0.25;
        ctx.save();
        ctx.scale(squash, 1);
        shape(ctx, hsl(c.base, "#c9202e"), () => {
            for (let i = 0; i < 10; i += 1) {
                const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
                const rad = i % 2 === 0 ? s * 0.42 : s * 0.16;
                const x = Math.cos(a) * rad;
                const y = Math.sin(a) * rad;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        });
        stroke(ctx, hsl(c.light, "#fff2b0"), s * 0.03, () => {
            for (let i = 0; i < 10; i += 1) {
                const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
                const rad = i % 2 === 0 ? s * 0.42 : s * 0.16;
                const x = Math.cos(a) * rad;
                const y = Math.sin(a) * rad;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        });
        ctx.restore();
        disc(ctx, hsl(c.accent, "#ffe9a8"), 0, 0, s * 0.08);
        stroke(ctx, hsl(c.base, "#c9202e"), s * 0.025, () => {
            for (const dx of [-s * 0.08, s * 0.08]) {
                ctx.moveTo(dx, s * 0.4);
                ctx.quadraticCurveTo(dx * 2.2, s * 0.52, dx, s * 0.62);
            }
        });
    },
    snowflake: (ctx, s, c) => {
        stroke(ctx, hsl(c.light, "rgba(226,240,255,.95)"), s * 0.045, () => {
            for (let i = 0; i < 6; i += 1) {
                const a = (i / 6) * Math.PI * 2;
                const x = Math.cos(a) * s * 0.4;
                const y = Math.sin(a) * s * 0.4;
                ctx.moveTo(0, 0);
                ctx.lineTo(x, y);
                for (const k of [0.55, 0.82]) {
                    const bx = x * k;
                    const by = y * k;
                    ctx.moveTo(bx, by);
                    ctx.lineTo(bx + Math.cos(a + 0.7) * s * 0.12, by + Math.sin(a + 0.7) * s * 0.12);
                    ctx.moveTo(bx, by);
                    ctx.lineTo(bx + Math.cos(a - 0.7) * s * 0.12, by + Math.sin(a - 0.7) * s * 0.12);
                }
            }
        });
    },
    lantern: (ctx, s, c) => {
        shape(ctx, hsl(c.base, "#d4262b"), () => {
            ctx.ellipse(0, 0, s * 0.28, s * 0.34, 0, 0, Math.PI * 2);
        });
        const gold = hsl(c.accent, "#ffd34d");
        box(ctx, gold, -s * 0.14, -s * 0.43, s * 0.28, s * 0.08);
        box(ctx, gold, -s * 0.14, s * 0.35, s * 0.28, s * 0.07);
        stroke(ctx, hsl(c.dark, "rgba(0,0,0,.22)"), s * 0.02, () => {
            for (const k of [-0.14, 0, 0.14]) {
                ctx.moveTo(s * k + s * 0.08, 0);
                ctx.ellipse(s * k, 0, s * 0.08, s * 0.33, 0, 0, Math.PI * 2);
            }
        });
        stroke(ctx, gold, s * 0.025, () => {
            ctx.moveTo(0, s * 0.42);
            ctx.lineTo(0, s * 0.58);
        });
    },
    bell: (ctx, s, c, t) => {
        const tilt = Math.sin(t * Math.PI * 2) * 0.18;
        ctx.save();
        ctx.rotate(tilt);
        shape(ctx, hsl(c.base, "#e0a92e"), () => {
            ctx.moveTo(-s * 0.28, s * 0.22);
            ctx.quadraticCurveTo(-s * 0.26, -s * 0.3, 0, -s * 0.32);
            ctx.quadraticCurveTo(s * 0.26, -s * 0.3, s * 0.28, s * 0.22);
            ctx.closePath();
        });
        box(ctx, hsl(c.base, "#e0a92e"), -s * 0.32, s * 0.22, s * 0.64, s * 0.08);
        ctx.restore();
        disc(ctx, hsl(c.accent, "#ffd34d"), 0, s * 0.38, s * 0.07);
    },

    // ── New year / celebration ────────────────────────────────────────────────
    firecracker: (ctx, s, c) => {
        box(ctx, hsl(c.base, "#c9202e"), -s * 0.12, -s * 0.26, s * 0.24, s * 0.52);
        box(ctx, hsl(c.accent, "#ffd34d"), -s * 0.12, -s * 0.06, s * 0.24, s * 0.08);
        stroke(ctx, hsl(c.dark, "rgba(0,0,0,.25)"), s * 0.025, () => {
            ctx.moveTo(0, -s * 0.26);
            ctx.quadraticCurveTo(s * 0.14, -s * 0.38, s * 0.04, -s * 0.46);
        });
    },
    envelope: (ctx, s, c) => {
        box(ctx, hsl(c.base, "#d4262b"), -s * 0.3, -s * 0.2, s * 0.6, s * 0.4);
        stroke(ctx, hsl(c.accent, "#ffd34d"), s * 0.03, () => {
            ctx.moveTo(-s * 0.3, -s * 0.2);
            ctx.lineTo(0, s * 0.04);
            ctx.lineTo(s * 0.3, -s * 0.2);
        });
    },
    heart: (ctx, s, c) => {
        shape(ctx, hsl(c.base, "#d6336c"), () => {
            ctx.moveTo(0, s * 0.3);
            ctx.bezierCurveTo(-s * 0.5, -s * 0.02, -s * 0.24, -s * 0.42, 0, -s * 0.14);
            ctx.bezierCurveTo(s * 0.24, -s * 0.42, s * 0.5, -s * 0.02, 0, s * 0.3);
            ctx.closePath();
        });
    },
    confetti: (ctx, s, c) => {
        box(ctx, hsl(c.base, "#facc15"), -s * 0.2, -s * 0.12, s * 0.4, s * 0.24);
    },
    star: (ctx, s, c, t) => {
        const pulse = 1 + Math.sin(t * Math.PI * 2) * 0.12;
        shape(ctx, hsl(c.accent, "#ffd34d"), () => {
            for (let i = 0; i < 8; i += 1) {
                const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
                const rad = (i % 2 === 0 ? s * 0.4 : s * 0.14) * pulse;
                const x = Math.cos(a) * rad;
                const y = Math.sin(a) * rad;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        });
    },
    sparkle: (ctx, s, c, t) => {
        const k = 0.4 + Math.sin(t * Math.PI * 2) * 0.35;
        shape(ctx, hsl(c.accent, "#fff6cc"), () => {
            ctx.moveTo(0, -s * 0.42);
            ctx.quadraticCurveTo(s * k * 0.1, -s * 0.06, s * 0.42, 0);
            ctx.quadraticCurveTo(s * k * 0.1, s * 0.06, 0, s * 0.42);
            ctx.quadraticCurveTo(-s * k * 0.1, s * 0.06, -s * 0.42, 0);
            ctx.quadraticCurveTo(-s * k * 0.1, -s * 0.06, 0, -s * 0.42);
            ctx.closePath();
        });
    },
    moon: (ctx, s, c) => {
        disc(ctx, hsl(c.accent, "#ffe9a8"), 0, 0, s * 0.36);
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(s * 0.17, -s * 0.08, s * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.restore();
    },
    dove: (ctx, s, c, t) => {
        const wing = Math.sin(t * Math.PI * 2) * s * 0.12;
        const white = hsl(c.light, "#f4f6fb");
        shape(ctx, white, () => {
            ctx.ellipse(0, 0, s * 0.3, s * 0.14, -0.2, 0, Math.PI * 2);
        });
        shape(ctx, white, () => {
            ctx.moveTo(-s * 0.05, -s * 0.02);
            ctx.quadraticCurveTo(s * 0.05, -s * 0.3 - wing, s * 0.28, -s * 0.14 - wing);
            ctx.quadraticCurveTo(s * 0.1, -s * 0.06, -s * 0.05, s * 0.04);
            ctx.closePath();
        });
        poly(ctx, white, [-s * 0.28, s * 0.02, -s * 0.46, s * 0.15, -s * 0.26, s * 0.17]);
        poly(ctx, hsl(c.accent, "#ffd34d"), [s * 0.28, -s * 0.04, s * 0.4, 0, s * 0.27, s * 0.05]);
    },

    // ── Civic days ────────────────────────────────────────────────────────────
    flag: (ctx, s, c, t) => {
        const wave = Math.sin(t * Math.PI * 2) * s * 0.05;
        shape(ctx, hsl(c.blue, "#1d3f8f"), () => {
            ctx.moveTo(-s * 0.34, -s * 0.24);
            ctx.lineTo(s * 0.34, -s * 0.24 + wave);
            ctx.lineTo(s * 0.34, wave * 0.5);
            ctx.lineTo(-s * 0.34, 0);
            ctx.closePath();
        });
        shape(ctx, hsl(c.red, "#c9202e"), () => {
            ctx.moveTo(-s * 0.34, 0);
            ctx.lineTo(s * 0.34, wave * 0.5);
            ctx.lineTo(s * 0.34, s * 0.24 + wave);
            ctx.lineTo(-s * 0.34, s * 0.24);
            ctx.closePath();
        });
        poly(ctx, "#f5f5f5", [-s * 0.34, -s * 0.24, -s * 0.34, s * 0.24, s * 0.02, 0]);
        disc(ctx, hsl(c.accent, "#ffd34d"), -s * 0.19, 0, s * 0.05);
    },
    medal: (ctx, s, c) => {
        poly(ctx, hsl(c.blue, "#1d3f8f"), [
            -s * 0.16, -s * 0.4,
            s * 0.16, -s * 0.4,
            s * 0.08, -s * 0.06,
            -s * 0.08, -s * 0.06,
        ]);
        box(ctx, hsl(c.red, "#c9202e"), -s * 0.04, -s * 0.4, s * 0.08, s * 0.34);
        disc(ctx, hsl(c.accent, "#e8c34a"), 0, s * 0.14, s * 0.24);
        disc(ctx, hsl(c.base, "#1d3f8f"), 0, s * 0.14, s * 0.11);
    },
    quill: (ctx, s, c) => {
        shape(ctx, hsl(c.base, "#f5f0e6"), () => {
            ctx.moveTo(-s * 0.3, s * 0.34);
            ctx.quadraticCurveTo(-s * 0.05, -s * 0.05, s * 0.3, -s * 0.36);
            ctx.quadraticCurveTo(s * 0.1, s * 0.06, -s * 0.16, s * 0.3);
            ctx.closePath();
        });
        stroke(ctx, hsl(c.dark, "rgba(0,0,0,.35)"), s * 0.02, () => {
            ctx.moveTo(-s * 0.24, s * 0.3);
            ctx.lineTo(s * 0.26, -s * 0.32);
        });
    },
    torch: (ctx, s, c, t) => {
        box(ctx, hsl(c.dark, "#7a5a2f"), -s * 0.07, -s * 0.02, s * 0.14, s * 0.44);
        // handle grip + a bowl that holds the flame
        box(ctx, hsl(c.base, "#b98b3f"), -s * 0.13, s * 0.3, s * 0.26, s * 0.09);
        shape(ctx, hsl(c.base, "#b98b3f"), () => {
            ctx.moveTo(-s * 0.19, -s * 0.06);
            ctx.lineTo(s * 0.19, -s * 0.06);
            ctx.lineTo(s * 0.11, s * 0.02);
            ctx.lineTo(-s * 0.11, s * 0.02);
            ctx.closePath();
        });
        ctx.save();
        ctx.translate(0, -s * 0.1);
        flame(ctx, s * 1.05, c, t);
        ctx.restore();
    },

    // String-light bulb: used by the `dots: true` rows (parol / Simbang Gabi lights).
    bulb: (ctx, s, c, t) => {
        const glow = 0.55 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.45;
        ctx.globalAlpha = glow;
        disc(ctx, c.base, 0, 0, s * 0.26);
        ctx.globalAlpha = 1;
        box(ctx, hsl(c.dark, "#5b5b5b"), -s * 0.09, s * 0.2, s * 0.18, s * 0.12);
        stroke(ctx, hsl(c.dark, "#5b5b5b"), s * 0.03, () => {
            ctx.moveTo(0, -s * 0.26);
            ctx.lineTo(0, -s * 0.42);
        });
    },

    // ── People / awareness ────────────────────────────────────────────────────
    tulip: (ctx, s, c) => {
        stroke(ctx, hsl(c.green, "#3f7d3a"), s * 0.04, () => {
            ctx.moveTo(0, s * 0.4);
            ctx.lineTo(0, -s * 0.02);
        });
        shape(ctx, hsl(c.base, "#c2559b"), () => {
            ctx.moveTo(-s * 0.2, -s * 0.02);
            ctx.quadraticCurveTo(-s * 0.24, -s * 0.38, 0, -s * 0.3);
            ctx.quadraticCurveTo(s * 0.24, -s * 0.38, s * 0.2, -s * 0.02);
            ctx.quadraticCurveTo(0, s * 0.1, -s * 0.2, -s * 0.02);
            ctx.closePath();
        });
    },
    tool: (ctx, s, c) => {
        const steel = hsl(c.base, "#6b7280");
        stroke(ctx, steel, s * 0.11, () => {
            ctx.moveTo(-s * 0.22, s * 0.26);
            ctx.lineTo(s * 0.1, -s * 0.06);
        });
        stroke(ctx, steel, s * 0.1, () => {
            ctx.arc(s * 0.2, -s * 0.2, s * 0.16, 0.6, 5.1);
        });
    },
    sprout: (ctx, s, c) => {
        stroke(ctx, hsl(c.green, "#3f7d3a"), s * 0.05, () => {
            ctx.moveTo(0, s * 0.38);
            ctx.lineTo(0, -s * 0.02);
        });
        shape(ctx, hsl(c.base, "#5d8a4a"), () => {
            ctx.ellipse(-s * 0.17, -s * 0.12, s * 0.17, s * 0.09, -0.5, 0, Math.PI * 2);
        });
        shape(ctx, hsl(c.base, "#5d8a4a"), () => {
            ctx.ellipse(s * 0.17, -s * 0.2, s * 0.17, s * 0.09, 0.5, 0, Math.PI * 2);
        });
    },
    apple: (ctx, s, c) => {
        shape(ctx, hsl(c.base, "#c9202e"), () => {
            ctx.ellipse(0, s * 0.06, s * 0.3, s * 0.28, 0, 0, Math.PI * 2);
        });
        const green = hsl(c.green, "#3f7d3a");
        stroke(ctx, green, s * 0.04, () => {
            ctx.moveTo(0, -s * 0.2);
            ctx.lineTo(s * 0.02, -s * 0.34);
        });
        shape(ctx, green, () => {
            ctx.ellipse(s * 0.13, -s * 0.3, s * 0.11, s * 0.05, -0.5, 0, Math.PI * 2);
        });
    },
    carrot: (ctx, s, c) => {
        poly(ctx, hsl(c.base, "#ea7517"), [-s * 0.17, -s * 0.16, s * 0.17, -s * 0.16, 0, s * 0.42]);
        const green = hsl(c.green, "#3f7d3a");
        for (const k of [-0.12, 0, 0.12]) {
            shape(ctx, green, () => {
                ctx.ellipse(k * s, -s * 0.28, s * 0.05, s * 0.13, k * 2, 0, Math.PI * 2);
            });
        }
    },
    bowl: (ctx, s, c) => {
        shape(ctx, hsl(c.base, "#3f7d3a"), () => {
            ctx.arc(0, -s * 0.02, s * 0.3, 0, Math.PI);
            ctx.closePath();
        });
        const food = hsl(c.accent, "#ffd34d");
        for (const k of [-0.14, 0.02, 0.16]) {
            disc(ctx, food, s * k, -s * 0.1, s * 0.07);
        }
    },
    book: (ctx, s, c) => {
        poly(ctx, hsl(c.base, "#1d3f8f"), [-s * 0.36, -s * 0.2, 0, -s * 0.1, 0, s * 0.26, -s * 0.36, s * 0.16]);
        poly(ctx, hsl(c.light, "#f6f2e8"), [s * 0.36, -s * 0.2, 0, -s * 0.1, 0, s * 0.26, s * 0.36, s * 0.16]);
        stroke(ctx, hsl(c.dark, "rgba(0,0,0,.25)"), s * 0.02, () => {
            ctx.moveTo(0, -s * 0.1);
            ctx.lineTo(0, s * 0.26);
        });
    },
    // Alphabet tile for Buwan ng Wika: an "A" built from strokes, so it needs no
    // font and still reads at 18px.
    letter: (ctx, s, c, t) => {
        box(ctx, hsl(c.base, "#1d7a4f"), -s * 0.34, -s * 0.34, s * 0.68, s * 0.68);
        const ink = hsl(c.ink, "#ffffff");
        const bob = Math.sin(t * Math.PI * 2) * s * 0.012;
        stroke(ctx, ink, s * 0.075, () => {
            ctx.moveTo(-s * 0.13, s * 0.15 + bob);
            ctx.lineTo(0, -s * 0.17 + bob);
            ctx.lineTo(s * 0.13, s * 0.15 + bob);
            ctx.moveTo(-s * 0.075, s * 0.03 + bob);
            ctx.lineTo(s * 0.075, s * 0.03 + bob);
        });
    },
};

/**
 * Paint `name` into the current transform. An unknown name falls back to a
 * sparkle, so a typo in seasonalEvents.js can never throw inside rAF.
 */
export function drawShape(ctx, name, size, color, t = 0) {
    const fn = SHAPES[name] ?? SHAPES.sparkle;
    fn(ctx, size, color, t);
}

export const SHAPE_NAMES = Object.keys(SHAPES);
