import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Navigation from "@/Components/sidebar/Navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Separator } from "@/Components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import {
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    MonitorSmartphone,
    ShieldAlert,
    ShieldCheck,
    FileWarning,
} from "lucide-react";

export default function Sidebar() {
    const { display_name, emp_data, system_status } = usePage().props;
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState(
        "System is currently under maintenance.",
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = emp_data?.emp_id == 1705;
    const isInMaintenance = system_status?.status === "maintenance";

    useEffect(() => setMounted(true), []);

    const formattedAppName = display_name
        ?.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    const handleSetMaintenance = () => {
        setIsSubmitting(true);
        router.post(
            route("system-status.maintenance"),
            { message: maintenanceMessage },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setDialogOpen(false);
                },
            },
        );
    };

    const handleSetOnline = () => {
        setIsSubmitting(true);
        router.post(
            route("system-status.online"),
            {},
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    if (!mounted) return null;

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex">
                {/* ── Mobile Hamburger ── */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed z-[60] top-4 left-4 md:hidden h-9 w-9
                    bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
                    border border-border
                    text-primary
                    hover:bg-accent hover:text-accent-foreground
                    shadow-md rounded-xl"
                    onClick={() => setIsMobileSidebarOpen(true)}
                >
                    <Menu className="w-4 h-4" />
                </Button>

                {/* ── Mobile Overlay ── */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/40 dark:bg-black/70 backdrop-blur-sm md:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* ── Sidebar ── */}
                <aside
                    className={cn(
                        "fixed md:relative top-0 left-0 z-50 flex flex-col min-h-screen",
                        "transition-all duration-300 ease-in-out",
                        "bg-card shadow-lg",
                        isSidebarOpen ? "w-64" : "w-[68px]",
                        isMobileSidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full md:translate-x-0",
                    )}
                    style={{ boxShadow: "4px 0 20px 0 rgba(0,0,0,0.05)" }}
                >
                    {/* ── Desktop Collapse Toggle ── */}
                    <button
                        className={cn(
                            "hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10",
                            "w-6 h-6 items-center justify-center rounded-full",
                            "bg-primary text-primary-foreground border-2 border-card shadow-md",
                            "hover:scale-110 transition-all duration-200",
                        )}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? (
                            <PanelLeftClose className="w-3 h-3" />
                        ) : (
                            <PanelLeftOpen className="w-3 h-3" />
                        )}
                    </button>

                    {/* ── Mobile Close ── */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 md:hidden h-7 w-7
                        text-muted-foreground hover:text-foreground
                        hover:bg-accent rounded-lg"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    {/* ── Logo ── */}
                    <div
                        className={cn(
                            "flex items-center h-14 shadow-lg",
                            isSidebarOpen ? "px-4" : "px-0 justify-center",
                        )}
                    >
                        <Link
                            href={route("dashboard")}
                            className={cn(
                                "flex items-center gap-3 min-w-0",
                                !isSidebarOpen && "justify-center",
                            )}
                        >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-md">
                                <FileWarning className="w-4 h-4 text-primary-foreground" />
                            </div>

                            {isSidebarOpen && (
                                <div className="flex flex-col min-w-0">
                                    <span
                                        className="text-sm font-semibold tracking-tight leading-tight truncate
                                        text-foreground"
                                    >
                                        {formattedAppName}
                                    </span>
                                    <span
                                        className="text-[7px] font-medium tracking-widest uppercase
                                        text-primary/70"
                                    >
                                        Workspace
                                    </span>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* ── Navigation ── */}
                    <div
                        className="flex-1 overflow-y-auto overflow-x-hidden py-4
                        scrollbar-thin scrollbar-thumb-border
                        scrollbar-track-transparent"
                    >
                        <Navigation isSidebarOpen={isSidebarOpen} />
                    </div>

                    {/* ── Admin: System Status Toggle ── */}
                    {isAdmin && (
                        <div
                            className={cn(
                                "p-3",
                                !isSidebarOpen && "flex justify-center",
                            )}
                        >
                            {isInMaintenance ? (
                                /* ── Set Online Button ── */
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={handleSetOnline}
                                            disabled={isSubmitting}
                                            className={cn(
                                                "flex items-center gap-2.5 rounded-lg",
                                                "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
                                                "hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300",
                                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                                "transition-all duration-200",
                                                isSidebarOpen
                                                    ? "w-full px-3 py-2 text-xs font-medium"
                                                    : "w-9 h-9 justify-center",
                                            )}
                                        >
                                            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                            {isSidebarOpen && (
                                                <span>Set System Online</span>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    {!isSidebarOpen && (
                                        <TooltipContent side="right">
                                            Set System Online
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            ) : (
                                /* ── Set Maintenance Button + Dialog ── */
                                <Dialog
                                    open={dialogOpen}
                                    onOpenChange={setDialogOpen}
                                >
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DialogTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "flex items-center gap-2.5 rounded-lg",
                                                        "text-amber-400 bg-amber-500/10 border border-amber-500/20",
                                                        "hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300",
                                                        "transition-all duration-200",
                                                        isSidebarOpen
                                                            ? "w-full px-3 py-2 text-xs font-medium"
                                                            : "w-9 h-9 justify-center",
                                                    )}
                                                >
                                                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                                                    {isSidebarOpen && (
                                                        <span>
                                                            Set Maintenance
                                                        </span>
                                                    )}
                                                </button>
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        {!isSidebarOpen && (
                                            <TooltipContent side="right">
                                                Set Maintenance Mode
                                            </TooltipContent>
                                        )}
                                    </Tooltip>

                                    <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700 text-zinc-100">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-amber-400">
                                                <ShieldAlert className="w-5 h-5" />
                                                Enable Maintenance Mode
                                            </DialogTitle>
                                            <DialogDescription className="text-zinc-400">
                                                The system will be inaccessible
                                                to regular users. Provide an
                                                optional message to display.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-2 py-2">
                                            <Label
                                                htmlFor="maintenance-message"
                                                className="text-zinc-300 text-xs font-medium"
                                            >
                                                Maintenance Message
                                            </Label>
                                            <Textarea
                                                id="maintenance-message"
                                                value={maintenanceMessage}
                                                onChange={(e) =>
                                                    setMaintenanceMessage(
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                maxLength={500}
                                                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none focus:border-amber-500/50 focus:ring-amber-500/20"
                                            />
                                            <p className="text-[11px] text-zinc-600 text-right">
                                                {maintenanceMessage.length}/500
                                            </p>
                                        </div>

                                        <DialogFooter className="gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    setDialogOpen(false)
                                                }
                                                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSetMaintenance}
                                                disabled={isSubmitting}
                                                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold disabled:opacity-50"
                                            >
                                                {isSubmitting
                                                    ? "Enabling…"
                                                    : "Enable Maintenance"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </TooltipProvider>
    );
}
