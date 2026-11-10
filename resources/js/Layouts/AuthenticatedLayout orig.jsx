//TEMPLATE
import NavBar from "@/Components/NavBar";
import Sidebar from "@/Components/sidebar/SideBar";
import LoadingScreen from "@/Components/LoadingScreen";
import { usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

// const IDLE_LIMIT_MS = 15 * 60 * 1000;
const IDLE_LIMIT_MS = 60 * 1000; // 1 minute

export default function AuthenticatedLayout({ children }) {
    const { emp_data } = usePage().props;
    // Restore lock state from sessionStorage on mount — otherwise a
    // refresh remounts this component with locked reset to false,
    // silently bypassing the lock screen even though the user was
    // genuinely idle past the limit.
    const [locked, setLocked] = useState(
        () => sessionStorage.getItem("session_locked") === "1",
    );
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockError, setUnlockError] = useState("");
    const touchThrottle = useRef(null);
    const lastRemoteActivityRef = useRef(null);
    // Bumped any time THIS tab changes lock state on its own (idle timeout
    // firing, or a successful unlock). Any poll request already in flight
    // when that happens was reading server state from before the change,
    // so its response must be discarded even though it's technically the
    // "latest" poll tick — otherwise a slow poll that started just before
    // the lock landed can come back with locked:false and immediately
    // undo the lock screen we just showed.
    const pollSeqRef = useRef(0);
    // Wall-clock timestamp of last real interaction. A setTimeout scheduled
    // once and left to fire on its own gets throttled/delayed in background
    // tabs, which let a backgrounded tab tolerate far more idle time than a
    // foregrounded one. Checking elapsed time against this on every interval
    // tick avoids that: even if the browser delays *when* the check runs,
    // the check itself is correct once it does run.
    const lastActivityRef = useRef(Date.now());
    const lockingRef = useRef(false);

    const triggerLock = async () => {
        if (lockingRef.current || locked) return;
        lockingRef.current = true;
        try {
            // Locks ONLY this portal's own session row. Each portal
            // tracks and locks its own idle state independently — an
            // idle tab must never lock a tab the user is actively
            // using in a different portal.
            try {
                await axios.post(route("session.lock"));
            } catch (err) {
                if (err?.response?.status !== 419) throw err;
                // Stale CSRF token — e.g. another portal's tab was just
                // active and refreshed the browser's shared XSRF-TOKEN
                // cookie to its own session's value. Fetch a fresh token
                // for THIS session and retry once before giving up.
                await axios.get(window.location.href);
                await axios.post(route("session.lock"));
            }
            pollSeqRef.current++; // invalidate any in-flight stale poll
            sessionStorage.setItem("session_locked", "1");
            setLocked(true);
        } catch (e) {
            // Retry also failed — leave unlocked, next check tick retries
            // from scratch rather than getting stuck in a bad state.
        } finally {
            lockingRef.current = false;
        }
    };

    useEffect(() => {
        const markActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const events = [
            "mousemove",
            "keydown",
            "click",
            "scroll",
            "touchstart",
        ];
        events.forEach((e) => window.addEventListener(e, markActivity));

        // Catch up immediately when this tab regains focus, instead of
        // waiting for the next interval tick — a tab that was throttled
        // while backgrounded may have missed several ticks' worth of
        // elapsed idle time while you weren't looking at it.
        const checkNow = () => {
            if (
                document.visibilityState === "visible" &&
                Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS
            ) {
                triggerLock();
            }
        };
        document.addEventListener("visibilitychange", checkNow);

        const idleCheckInterval = setInterval(() => {
            if (Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) {
                triggerLock();
            }
        }, 1000);

        return () => {
            events.forEach((e) => window.removeEventListener(e, markActivity));
            document.removeEventListener("visibilitychange", checkNow);
            clearInterval(idleCheckInterval);
            if (touchThrottle.current) clearTimeout(touchThrottle.current);
        };
    }, [locked]);

    async function submitUnlock(password) {
        return axios.post(route("verifyPassword"), { password });
    }

    async function handleUnlock(e) {
        e.preventDefault();
        setUnlockError("");
        try {
            let res;
            try {
                res = await submitUnlock(unlockPassword);
            } catch (err) {
                if (err?.response?.status !== 419) throw err;
                // Stale CSRF token — fetch a fresh one without losing what
                // the user typed or making them notice anything happened.
                // Laravel issues a new XSRF-TOKEN cookie on any GET; axios
                // picks it up automatically (withCredentials + its default
                // xsrfCookieName/xsrfHeaderName config) and attaches it to
                // the retried request below. Only one retry — if it fails
                // again the token mismatch has a different cause and
                // should surface as a real error, not loop silently.
                await axios.get(window.location.href);
                res = await submitUnlock(unlockPassword);
            }

            if (res.data?.valid) {
                pollSeqRef.current++; // invalidate any in-flight stale poll
                lastActivityRef.current = Date.now();
                sessionStorage.removeItem("session_locked");
                setLocked(false);
                setUnlockPassword("");
            } else {
                setUnlockError("Incorrect password.");
            }
        } catch (err) {
            if (err?.response?.status === 419) {
                // Retry also failed — something more persistent is wrong
                // (e.g. the session itself, not just the token). Fall back
                // to a full reload as a last resort; lock state persists
                // via sessionStorage so the lock screen reappears after.
                window.location.reload();
                return;
            }
            setUnlockError("Something went wrong. Try again.");
        }
    }

    useEffect(() => {
        // Clear any leftover "intentional" flag as soon as we arrive here —
        // it already served its purpose getting us to this page. Leaving it
        // set would incorrectly suppress the *next* pagehide, which could
        // be an unrelated real tab-close much later.
        sessionStorage.removeItem("intentional_nav");

        const handlePageHide = () => {
            if (sessionStorage.getItem("intentional_nav") === "1") {
                sessionStorage.removeItem("intentional_nav");
                return; // known internal redirect, not a real close
            }
            navigator.sendBeacon(route("session.close-beacon"));
        };
        window.addEventListener("pagehide", handlePageHide);

        // Poll periodically so this tab notices if the session was
        // invalidated elsewhere (another tab closed, logout happened on a
        // different portal) without requiring the user to click anything.
        const pollInterval = setInterval(async () => {
            const mySeq = ++pollSeqRef.current;
            try {
                const res = await fetch(route("session.check"), {
                    credentials: "include",
                });

                // Discard this response if a newer poll — or a local
                // lock/unlock change from armIdleTimer()/handleUnlock() —
                // has already happened since this request started.
                if (mySeq !== pollSeqRef.current) return;

                if (res.status === 401) {
                    clearInterval(pollInterval);
                    sessionStorage.setItem("intentional_nav", "1");
                    window.location.href = route("dashboard");
                    return;
                }

                const json = await res.json();
                if (mySeq !== pollSeqRef.current) return; // re-check after 2nd await

                if (!json.valid) {
                    clearInterval(pollInterval);
                    sessionStorage.setItem("intentional_nav", "1");
                    window.location.href = route("dashboard");
                    return;
                }

                setLocked((prevLocked) => {
                    if (json.locked && !prevLocked) {
                        sessionStorage.setItem("session_locked", "1");
                        return true;
                    }
                    if (!json.locked && prevLocked) {
                        sessionStorage.removeItem("session_locked");
                        return false;
                    }
                    return prevLocked;
                });
            } catch (e) {
                // network hiccup — don't force a logout on a transient error
            }
        }, 1000);

        return () => {
            window.removeEventListener("pagehide", handlePageHide);
            clearInterval(pollInterval);
        };
    }, []);

    if (!emp_data) {
        return <LoadingScreen text="Loading user data..." />;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar /> {/* vertical sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                <NavBar /> {/* top navbar */}
                <main className="flex-1 px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto">
                    {children}
                </main>
                {/* ── Footer ── */}
                <footer className="px-6 py-1.5 shadow-lg flex items-center justify-end">
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-600">
                        Developed by:
                        <span className="font-semibold text-zinc-500 dark:text-zinc-500"></span>
                    </span>
                </footer>
            </div>
            {locked && (
                <>
                    {/* Blurs and dims the real page still rendered behind it,
                        instead of replacing it with blank space. */}
                    <div className="fixed inset-0 z-40 backdrop-blur-md bg-black/30" />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <form
                            onSubmit={handleUnlock}
                            className="w-full max-w-sm p-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 space-y-4"
                        >
                            <h2 className="text-lg font-bold">
                                Session Locked
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                You've been idle for a while. Confirm your
                                password to continue.
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 border-t pt-3">
                                This helps protect your account if you step away
                                from a shared or unattended device. If you're
                                finished for the day, it's safer to log out
                                completely from the account menu rather than
                                leaving the session locked.
                            </p>
                            <input
                                type="password"
                                autoFocus
                                value={unlockPassword}
                                onChange={(e) =>
                                    setUnlockPassword(e.target.value)
                                }
                                className="w-full border rounded px-3 py-2 bg-white/50 dark:bg-zinc-800/50"
                                placeholder="Password"
                            />
                            {unlockError && (
                                <p className="text-sm text-red-500">
                                    {unlockError}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="w-full btn btn-primary"
                            >
                                Unlock
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
