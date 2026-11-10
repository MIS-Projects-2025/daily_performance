import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggler({ toggleTheme, theme }) {
    const isDark = theme === "dark";

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={cn(
                "relative flex items-center gap-1 px-1 py-1 rounded-full border bg-background hover:bg-muted transition-all duration-300",
            )}
        >
            {/* Sliding indicator */}
            <span
                className={cn(
                    "absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-300",
                    isDark
                        ? "left-1 bg-primary shadow-primary/30"
                        : "left-[calc(100%-1.75rem)] bg-amber-400 shadow-amber-400/30",
                )}
            />

            {/* Sun */}
            <span
                className={cn(
                    "relative z-10 flex items-center justify-center w-6 h-6",
                    isDark ? "text-muted-foreground" : "text-white",
                )}
            >
                <Sun className="w-3.5 h-3.5" />
            </span>

            {/* Moon */}
            <span
                className={cn(
                    "relative z-10 flex items-center justify-center w-6 h-6",
                    isDark ? "text-white" : "text-muted-foreground",
                )}
            >
                <Moon className="w-3.5 h-3.5" />
            </span>
        </button>
    );
}
