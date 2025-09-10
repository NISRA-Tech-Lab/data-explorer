import { sidebarEl, globalSearchResults, globalSearchWrap, globalSearchInput } from "./elements.js";

export function filterNamesGlobal(query, searchIndex) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  return searchIndex.filter(item => words.every(w => item.nameLower.includes(w)));
}

export function renderGlobalResults(items) {

  globalSearchResults.innerHTML = "";
  if (!items.length) {
    globalSearchResults.innerHTML = '<div class="list-group-item text-muted small">No matches</div>';
   if (globalSearchWrap) globalSearchWrap.classList.remove("has-results");
    return;
  }

  // Deduplicate by name
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      unique.push(item);
    }
  }
  

  const top = unique.slice(0, 25);
  top.forEach(item => {
    const a = document.createElement("a");
    a.className = "list-group-item list-group-item-action";
    a.href = `?table=${item.key}`;
    a.innerHTML = `
      <div class="fw-semibold">${item.name}</div>
      <div class="small text-secondary">${item.theme} &rsaquo; ${item.subject} &rsaquo; ${item.product}</div>
    `;
    a.addEventListener("click", () => {
      const sidebarEl = document.getElementById("sidebar");
      const inst = sidebarEl ? bootstrap.Offcanvas.getInstance(sidebarEl) : null;
      if (inst) inst.hide();
      if (globalSearchWrap) globalSearchWrap.classList.remove("has-results");
    });
    globalSearchResults.appendChild(a);
  });

 if (globalSearchWrap) globalSearchWrap.classList.add("has-results");
}

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