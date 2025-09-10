

export function renderGlobalResults(items) {

  const globalSearchResults = document.getElementById("global-search-results");
  const globalSearchWrap = document.querySelector(".sidebar-search");

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