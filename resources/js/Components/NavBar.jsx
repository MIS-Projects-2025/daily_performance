//TEMPLATE
import { usePage } from "@inertiajs/react";
import { useState, useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { ChevronDown, User, LogOut, Loader2 } from "lucide-react";
import ThemeToggler from "./sidebar/ThemeToggler";
import axios from "axios";
//Template
export default function NavBar() {
    const { emp_data } = usePage().props;
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [checkingSiblings, setCheckingSiblings] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [sessions, setSessions] = useState([]);

    const startLogout = async () => {
        setCheckingSiblings(true);
        try {
            const res = await axios.get(route("session.list"));
            setSessions(res.data.sessions ?? []);
        } catch (e) {
            setSessions([]);
        } finally {
            setCheckingSiblings(false);
            setShowLogoutModal(true);
        }
    };

    const doLogout = () => {
        setShowLogoutModal(false);
        setIsLoggingOut(true);
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => {
            // Template's logout() always cascades to Authify
            window.location.href = route("logout");
        }, 500);
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const firstName = emp_data?.emp_firstname || "Guest";
    const isDark = theme === "dark";
    const busy = isLoggingOut || checkingSiblings;

    return (
        <>
            <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur-md h-14 shadow-lg">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-end h-[54px] gap-3">
                        <ThemeToggler theme={theme} toggleTheme={toggleTheme} />

                        <div className="w-px h-5 bg-border" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 h-auto rounded-full hover:bg-muted"
                                >
                                    <div className="relative">
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback
                                                className={cn(
                                                    "text-xs font-bold text-white",
                                                    isDark
                                                        ? "bg-primary"
                                                        : "bg-primary",
                                                )}
                                            >
                                                {getInitials(firstName)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                                    </div>

                                    <span className="text-sm font-medium hidden sm:block">
                                        Hello,{" "}
                                        <span className="font-semibold">
                                            {firstName}
                                        </span>
                                    </span>

                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className="w-56 rounded-2xl p-1.5 shadow-xl"
                            >
                                <div className="px-3 py-2.5">
                                    <div className="text-sm font-semibold">
                                        {firstName}
                                    </div>
                                    <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        Active now
                                    </div>
                                </div>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                    <a
                                        href={route("profile.index")}
                                        className="flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </a>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={startLogout}
                                    disabled={busy}
                                    className="text-destructive focus:text-destructive"
                                >
                                    {busy ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <LogOut className="w-4 h-4" />
                                    )}
                                    <span>
                                        {isLoggingOut
                                            ? "Signing out..."
                                            : checkingSiblings
                                              ? "Checking sessions..."
                                              : "Log out"}
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>

            {/* ── Log out of all sessions modal ── */}
            <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log out of all sessions?</DialogTitle>
                        <DialogDescription>
                            Logging out here ends every active session on your
                            account, including the Telford Portal. These
                            sessions will be signed out:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-2">
                        {sessions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-3">
                                No other active sessions found.
                            </p>
                        ) : (
                            sessions.map((s) => (
                                <div
                                    key={s.portal_id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {s.portal_id === "telford"
                                                ? "Telford Portal"
                                                : s.portal_id.toUpperCase()}
                                            {s.is_current && " (this app)"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Signed in{" "}
                                            {new Date(
                                                s.generated_at,
                                            ).toLocaleString()}
                                            {s.locked && " · Locked"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowLogoutModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={doLogout}>
                            Log out all
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
