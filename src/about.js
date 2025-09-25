import { share_btn } from "./utils/elements.js";
import { sharePage } from "./utils/sharePage.js";

window.addEventListener("DOMContentLoaded", async () => {
    share_btn.onclick = sharePage;
});
