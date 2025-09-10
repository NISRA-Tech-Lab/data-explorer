import { createMenus, getSearchIndex } from "./scripts/utils/createMenus.js"; 
import { wireSearch } from "./scripts/utils/wireSearch.js";

let searchIndex = [];

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Build menus AND the search index
    await createMenus();

    // Get the index produced during createMenus()
    // (see small addition to createMenus.js below)
    if (typeof getSearchIndex === "function") {
      searchIndex = getSearchIndex() || [];
    }

    wireSearch(searchIndex);
  } catch (e) {
    console.error("Startup failed:", e);
  }
});
