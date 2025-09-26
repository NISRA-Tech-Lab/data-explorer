import { createMenus, getSearchIndex } from "./utils/createMenus.js";
import { wireSearch } from "./utils/wireSearch.js";
import { initSidebarPersistence } from "./utils/initSideBarPersistence.js";
import { share_btn } from "./utils/elements.js";
import { sharePage } from "./utils/sharePage.js";

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
    
    for (let i = 0; i < share_btn.length; i++) {
      share_btn[i].onclick = sharePage;
    }

  } catch (e) {
    console.error("Startup failed:", e);
  }
});
