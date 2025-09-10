import { loadTables } from "./loadTables.js";
import { sortObject } from "./sortObject.js";
import { default_table } from "../config.js";
import { fillSubjectsMenu, fillProductsMenu, fillNamesMenu, fillGeoMenu, fillStatMenu} from "./fillMenus.js";
import { firstKey } from "./firstKey.js"
import { themes_menu, subjects_menu, products_menu, names_menu, geo_menu, stats_menu, search, SIDEBAR_OPEN_KEY } from "./elements.js";

let tables = {};
let _searchIndex = [];

export async function createMenus () {

    try {
    tables = await loadTables();  // ← cached load
    // Build global search index
    let searchIndex = Object.keys(tables).map(key => {
      const t = tables[key] || {};
      const name = (t.name || "").trim();
      return {
        key,
        name,
        nameLower: name.toLowerCase(),
        theme_code: t.theme_code,
        subject_code: t.subject_code,
        product_code: t.product_code,
        theme: t.theme,
        subject: t.subject,
        product: t.product,
        slug: name.replace(/\s+/g, "-")
      };
    });
  } catch (error) {
    console.error("Failed to load tables:", error);
    return; // bail early if we truly have nothing
  }

    let structure = {};

    for (const [matrix, t] of Object.entries(tables)) {
        const theme = t.theme;
        const theme_code   = String(t.theme_code);
        const subject = String(t.subject);
        const subject_code = String(t.subject_code);
        const product = String(t.product);
        const product_code = String(t.product_code);
        const table_name   = t.name;

        // Build nested structure safely
        structure[theme] ??= {code: theme_code, subjects: {}};
        structure[theme].subjects[subject] ??= {code: subject_code, products: {}};
        structure[theme].subjects[subject].products[product] ??= {code: product_code, tables: {}};

        // Ensure an array at the table_name leaf
        const list = (structure[theme].subjects[subject].products[product].tables[table_name] ??= []);

        // Push matrix if not present
        if (!list.includes(matrix)) list.push(matrix);
    }

    structure = sortObject(structure);

    for (let i = 0; i < Object.keys(structure).length; i ++) {
        let option = document.createElement("option");
        option.value = structure[Object.keys(structure)[i]].code;
        option.textContent = Object.keys(structure)[i];
        themes_menu.appendChild(option);
    }

    let selected_theme = tables[default_table].theme_code;

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_theme = tables[search_split[1]].theme_code;
            break;
        }
    }

    themes_menu.value = selected_theme;

    fillSubjectsMenu(structure, tables);
    fillProductsMenu(structure, tables);
    fillNamesMenu(structure, tables);
    fillGeoMenu(structure, tables);
    fillStatMenu(tables);

    themes_menu.onchange = function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const theme = structure[themes_menu.options[themes_menu.selectedIndex].text];
        const subjects = theme.subjects;
        const products = subjects[firstKey(subjects)].products;
        const tables   = products[firstKey(products)].tables;

        const selected_geo = tables[firstKey(tables)][0];

        window.location.search = `?table=${selected_geo}`;
    }

    subjects_menu.onchange = function() {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const subject = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text];
        const products = subject.products;
        const tables   = products[firstKey(products)].tables;

        const selected_geo = tables[firstKey(tables)][0];
        
        window.location.search = `?table=${selected_geo}`;
    }

    products_menu.onchange = function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const product = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text];
        const tables = product.tables;

        const selected_geo = tables[firstKey(tables)][0];

        window.location.search = `?table=${selected_geo}`;
    }

    names_menu.onchange = function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");

        const tables = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text].tables[names_menu.options[names_menu.selectedIndex].text];
        let selected_geo = tables[0];   

        window.location.search = `?table=${selected_geo}`;
    }

    geo_menu.onchange = function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
        window.location.search = `?table=${geo_menu.value}`;
    }

    stats_menu.onchange = function () {
        localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
        window.location.search = `?table=${geo_menu.value}&stat=${stats_menu.value}`;
    }

    _searchIndex = Object.keys(tables).map(key => {
        const t = tables[key] || {};
        const name = (t.name || "").trim();
        return {
        key,
        name,
        nameLower: name.toLowerCase(),
        theme_code: t.theme_code,
        subject_code: t.subject_code,
        product_code: t.product_code,
        theme: t.theme,
        subject: t.subject,
        product: t.product,
        slug: name.replace(/\s+/g, "-")
        };
    });


}

export function getSearchIndex() {
  return _searchIndex;
}