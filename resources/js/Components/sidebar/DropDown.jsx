import { useState, useEffect, useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";

export default function Dropdown({
    label,
    icon = null,
    links = [],
    notification = null,
    isSidebarOpen = false,
}) {
    const { url } = usePage();

    const normalizePath = (href) => {
        try {
            return new URL(href, window.location.origin).pathname;
        } catch {
            return href;
        }
    };

    const isActiveLink = (href) => url === normalizePath(href);

    const hasActiveChild = useMemo(
        () => links.some((link) => isActiveLink(link.href)),
        [url, links],
    );

    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(isSidebarOpen && hasActiveChild);
    }, [isSidebarOpen, hasActiveChild]);

    const parentActive = hasActiveChild;

    return (
        <div className="relative w-full">
            {/* Parent button */}
            <button
                onClick={() => setOpen(!open)}
                className={`relative flex items-center justify-between w-full px-3 py-2.5 mx-2 rounded-xl transition-all duration-200 text-sm font-medium border ${
                    parentActive
                        ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
                }`}
                style={{ width: "calc(100% - 1rem)" }}
            >
                <div className="flex items-center space-x-3">
                    {icon && (
                        <span
                            className={`flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center ${parentActive ? "text-primary" : "text-muted-foreground"}`}
                        >
                            {icon}
                        </span>
                    )}
                    {isSidebarOpen && <span>{label}</span>}
                </div>

                {isSidebarOpen && (
                    <div className="flex items-center space-x-2">
                        {notification && typeof notification === "number" && (
                            <span className="bg-destructive/20 text-destructive border border-destructive/30 text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none">
                                {notification > 99 ? "99+" : notification}
                            </span>
                        )}
                        {open ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </div>
                )}
            </button>

            {/* Child links */}
            {isSidebarOpen && open && (
                <div className="relative mt-1 space-y-1 pl-4">
                    {/* vertical line */}
                    <div className="absolute left-4 top-2 bottom-2 w-[2px] bg-border rounded" />

                    {links.map((link, idx) => {
                        const active = isActiveLink(link.href);
                        return (
                            <Link
                                key={idx}
                                href={link.href}
                                className={`relative flex items-center justify-start w-full pl-6 pr-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium border ${
                                    active
                                        ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
                                }`}
                            >
                                {/* Dot indicator on the vertical line */}
                                <span
                                    className="absolute left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 transition-colors duration-200"
                                    style={{
                                        backgroundColor: active
                                            ? "hsl(var(--primary))"
                                            : "hsl(var(--border))",
                                        borderColor: active
                                            ? "hsl(var(--primary))"
                                            : "hsl(var(--muted-foreground))",
                                    }}
                                />

                                {link.icon && (
                                    <span
                                        className={`mr-2 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                                    >
                                        {link.icon}
                                    </span>
                                )}
                                <span className="text-xs">{link.label}</span>

                                {link.notification &&
                                    typeof link.notification === "number" && (
                                        <span className="ml-auto bg-destructive/20 text-destructive border border-destructive/30 text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none">
                                            {link.notification > 99
                                                ? "99+"
                                                : link.notification}
                                        </span>
                                    )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
