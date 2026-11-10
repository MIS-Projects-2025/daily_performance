import { useEffect, useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Skeleton } from "@/Components/ui/skeleton";
import { Badge } from "@/Components/ui/badge";
import { LogOut, MonitorSmartphone } from "lucide-react";

// Add friendly names for your portal_ids here
const PORTAL_LABELS = {
    telford: "Telford Portal (Authify)",
};

const labelFor = (id) => PORTAL_LABELS[id] ?? id.toUpperCase();

export default function LogoutModal({ open, onOpenChange }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        axios
            .get(route("session.list"))
            .then((res) => setSessions(res.data.sessions ?? []))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
    }, [open]);

    function confirmLogout() {
        setLeaving(true);
        sessionStorage.removeItem("session_locked");
        window.location.href = route("logout");
    }

    return (
        <Dialog open={open} onOpenChange={leaving ? undefined : onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Log out of all sessions?</DialogTitle>
                    <DialogDescription>
                        Logging out here ends every active session on your
                        account, including the Telford Portal.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 mt-2">
                    {loading ? (
                        [...Array(2)].map((_, i) => (
                            <Skeleton key={i} className="h-14 rounded-lg" />
                        ))
                    ) : sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No active sessions found.
                        </p>
                    ) : (
                        sessions.map((s) => (
                            <div
                                key={s.portal_id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                            >
                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                    <MonitorSmartphone className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {labelFor(s.portal_id)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Signed in{" "}
                                        {new Date(
                                            s.generated_at,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                {s.is_current && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                    >
                                        This app
                                    </Badge>
                                )}
                                {s.locked && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                    >
                                        Locked
                                    </Badge>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={leaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={confirmLogout}
                        disabled={leaving}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {leaving ? "Logging out…" : "Log out all"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
