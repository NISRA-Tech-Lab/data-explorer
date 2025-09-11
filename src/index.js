import { createMenus, getSearchIndex } from "./utils/createMenus.js";
import { wireSearch } from "./utils/wireSearch.js";
import { initSidebarPersistence } from "./utils/initSideBarPersistence.js";

let searchIndex = [];

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Build menus AND the search index
    await createMenus();

    // Get the index produced during createMenus()
    if (typeof getSearchIndex === "function") {
      searchIndex = getSearchIndex() || [];
    }

    wireSearch(searchIndex);
    initSidebarPersistence();
  } catch (e) {
    console.error("Startup failed:", e);
  }
});
