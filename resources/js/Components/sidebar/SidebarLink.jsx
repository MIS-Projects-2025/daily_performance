import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { cn } from "@/lib/utils";

const SidebarLink = ({
    href,
    label,
    icon,
    notifications = 0,
    isSidebarOpen,
}) => {
    const { url } = usePage();
    const isActive = url === new URL(href, window.location.origin).pathname;

    return (
        <Link
            href={href}
            title={!isSidebarOpen ? label : ""}
            className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl",
                "text-sm font-medium transition-all duration-200",

                /* Default */
                "text-muted-foreground hover:text-foreground",

                /* Hover background */
                "hover:bg-accent",

                /* Active */
                isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "border border-transparent",

                !isSidebarOpen && "justify-center px-0 mx-2",
            )}
        >
            {/* Active left accent bar */}
            {isActive && (
                <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
                    style={{
                        boxShadow: "0 0 8px 1px hsl(var(--primary) / 0.5)",
                    }}
                />
            )}

            {/* Icon */}
            <span
                className={cn(
                    "flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center transition-colors",
                    isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                )}
            >
                {icon}
            </span>

            {/* Label */}
            {isSidebarOpen && <span className="truncate">{label}</span>}

            {/* Notification badge */}
            {notifications > 0 && (
                <span
                    className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none",
                        "bg-destructive/20 text-destructive border border-destructive/30",
                        isSidebarOpen ? "ml-auto" : "absolute -top-1 -right-1",
                    )}
                >
                    {notifications > 99 ? "99+" : notifications}
                </span>
            )}
        </Link>
    );
};

export default SidebarLink;
