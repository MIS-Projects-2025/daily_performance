// Call this immediately before any navigation that's part of normal
// app flow (login redirect, logout, portal switch) so the pagehide
// beacon knows not to treat it as a real tab-close.
export function markIntentionalNavigation() {
    sessionStorage.setItem("intentional_nav", "1");
}
