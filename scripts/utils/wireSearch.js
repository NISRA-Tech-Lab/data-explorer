import { sidebarEl, globalSearchResults, globalSearchWrap, globalSearchInput } from "./elements.js";
import { filterNamesGlobal } from "./filterNamesGlobal.js";
import { renderGlobalResults } from "./renderGlobalResults.js";

export function wireSearch(searchIndex) {

  if (!globalSearchInput || !globalSearchResults) return;

  const doSearch = () => {
    const q = globalSearchInput.value || "";
    const matches = filterNamesGlobal(q, searchIndex);
    renderGlobalResults(matches);
    if (!q.trim() && globalSearchWrap) globalSearchWrap.classList.remove("has-results");
  };

  globalSearchInput.addEventListener("input", doSearch);

  globalSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = globalSearchResults.querySelector(".list-group-item-action");
      if (first && first.getAttribute("href")) {
        window.location.href = first.getAttribute("href");
      }
    }
    if (e.key === "Escape" && globalSearchWrap) {
      globalSearchWrap.classList.remove("has-results");
      globalSearchInput.blur();
    }
  });

  // Hide when input loses focus (small delay so clicks still register)
  globalSearchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (globalSearchWrap) globalSearchWrap.classList.remove("has-results");
    }, 150);
  });

  // Also clear when the offcanvas closes
  if (sidebarEl) {
    sidebarEl.addEventListener("hidden.bs.offcanvas", () => {
      globalSearchResults.innerHTML = "";
      if (globalSearchWrap) globalSearchWrap.classList.remove("has-results");
      if (globalSearchInput) globalSearchInput.value = "";
    });
  }
}