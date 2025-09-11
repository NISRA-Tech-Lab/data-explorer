import { sidebarEl, SIDEBAR_OPEN_KEY } from "./elements.js";

export function initSidebarPersistence() {
  if (!sidebarEl) return;

  // Persist user open/close actions
  sidebarEl.addEventListener("shown.bs.offcanvas", () => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
  });
  sidebarEl.addEventListener("hidden.bs.offcanvas", () => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, "0");
  });

  // Auto-open on mobile/tablet if last state was "open"
  const shouldAutoOpen =
    window.matchMedia("(max-width: 991.98px)").matches &&
    localStorage.getItem(SIDEBAR_OPEN_KEY) === "1";

  if (shouldAutoOpen) {
    const off = bootstrap.Offcanvas.getOrCreateInstance(sidebarEl);

    // Disable animation just for this programmatic show
    document.body.classList.add("offcanvas-no-anim");
    off.show();

    const removeNoAnim = () => document.body.classList.remove("offcanvas-no-anim");
    sidebarEl.addEventListener("shown.bs.offcanvas", removeNoAnim, { once: true });
    setTimeout(removeNoAnim, 500); // safety fallback
  }
}