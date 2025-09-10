
import { default_table, GEOG_PROPS, palette } from "./scripts/config.js";
import { wrapLabel } from "./scripts/utils/wrapLabel.js";
import { firstKey } from "./scripts/utils/firstKey.js";
import { quantile } from "./scripts/utils/quantile.js";
import { getColour } from "./scripts/utils/getColour.js";
import { syncDraggingToZoom } from "./scripts/utils/syncDraggingToZoom.js";
import { sortObject } from "./scripts/utils/sortObject.js";
import { titleCase } from "./scripts/utils/titleCase.js";
import { filterNamesGlobal } from "./scripts/utils/filterNamesGlobal.js";
import { renderGlobalResults } from "./scripts/utils/renderGlobalResults.js";
import { loadTables } from "./scripts/utils/loadTables.js";
import { loadShapes } from "./scripts/utils/loadShapes.js";
import { yAxisLabelPlugin } from "./scripts/utils/yAxisLabelPlugin.js";

// run your startup logic once DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  createMenus();
});


const SIDEBAR_OPEN_KEY = "nisra:data-explorer:sidebarOpen";

let themes_menu = document.getElementById("theme");
let products_menu = document.getElementById("product");
let subjects_menu = document.getElementById("subject");
let names_menu = document.getElementById("name");
let geo_menu = document.getElementById("geo");
let stats_menu = document.getElementById("stat");
let other_menu = document.getElementById("other-vars");
let chart_container = document.getElementById("chart-container");
let table_preview = document.getElementById("table-preview");
let map_subtitle = document.getElementById("map-subtitle");
let page_title = document.getElementsByTagName("title")[0];
let globalSearchInput = document.getElementById("global-search");
// let globalSearchResults = document.getElementById("global-search-results");
let searchIndex = [];
// let globalSearchWrap = document.querySelector(".sidebar-search");
let metadata_text = document.getElementById("metadata-text");

let tables = {};


let search = window.location.search.replace("?", "").split("&");

const TABLES_CACHE_KEY = "nisra:tables:v1";     // bump v1→v2 if schema changes
const TABLES_TTL_MS    = 60 * 60 * 1000;        // 1 hour

async function createMenus () {

    try {
    tables = await loadTables();  // ← cached load
    // Build global search index
    searchIndex = Object.keys(tables).map(key => {
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

    fillSubjectsMenu(structure);
    fillProductsMenu(structure);
    fillNamesMenu(structure);
    fillGeoMenu(structure);
    fillStatMenu();

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


}

async function plotMap (matrix, statistic, geog_type, other = "") {

    let map_container = document.getElementById("map-container");

    let time_var = tables[matrix].time;
    let year = tables[matrix].time_series[tables[matrix].time_series.length - 1];
    
    const normal_vars = ["STATISTIC", geog_type, time_var];

    let other_vars = Object.keys(tables[matrix].categories);
    other_vars = other_vars.filter(x => !normal_vars.includes(x));

    let other_selections = "";
    var other_headline = "";
    let id_vars;

    if (["none", "NI"].includes(geog_type)) {
        document.getElementById("map-card").classList.add("d-none");
        document.getElementById("chart-card").classList.remove("col-xl-6");
        
        id_vars = `["STATISTIC", "${time_var}"`;

    } else {

        id_vars = `["STATISTIC", "${time_var}", "${geog_type}"`;

    }
        

    if (other_vars.length > 0) {
        other_headline = " for ";
        for (let i = 0; i < other_vars.length; i ++) {
            
            id_vars += `, "${other_vars[i]}"`;

            let new_menu = document.createElement("div");

            if (other == "") {

                new_menu.innerHTML = `<label for = "${other_vars[i]}" class = "form-label">${tables[matrix].categories[other_vars[i]].label}</label><select id = "${other_vars[i]}" name = "${other_vars[i]}" class = "form-select"></select>`

                let options = tables[matrix].categories[other_vars[i]].category.index;
                let labels = Object.values(tables[matrix].categories[other_vars[i]].category.label);

                other_menu.appendChild(new_menu);

                for (let j = 0; j < labels.length; j ++) {
                    let option = document.createElement("option");
                    option.value = options[j];
                    option.textContent = labels[j];
                    document.getElementById(other_vars[i]).appendChild(option);
                }

                
                let selected_option = options[0];

                const other_defaults = ["All", "ALL", "N92000002"];

                for (let j = 0; j < other_defaults.length; j ++) {
                    if (options.includes(other_defaults[j])) {
                        selected_option = other_defaults[j];
                    }
                }                

                for (let j = 0; j < search.length; j ++) {
                    if (search[j].includes(`${other_vars[i]}=`)) {
                        let search_split = search[j].split("=");
                        selected_option = search_split[1];
                        break;
                    }
                }

                document.getElementById(other_vars[i]).value = selected_option;

               

                new_menu.onchange = function () {

                    localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
                    let search_string = `?table=${geo_menu.value}&stat=${stats_menu.value}`;

                    for (let j = 0; j < other_vars.length; j ++) {
                        search_string += `&${other_vars[j]}=${document.getElementById(other_vars[j]).value}`;
                    }                    

                    window.location.search = search_string;
                    
                }
            }

            
            other_selections += `,"${other_vars[i]}":{"category":{"index":["${document.getElementById(other_vars[i]).value}"]}}`;
            
            if (i == 0) {
                map_subtitle.innerHTML = "";
            }

            map_subtitle.innerHTML += `<strong>${tables[matrix].categories[other_vars[i]].label}</strong>: ${tables[matrix].categories[other_vars[i]].category.label[document.getElementById(other_vars[i]).value]}<br>`;

            if (i != 0) {
                if (i == other_vars.length - 1) {
                    other_headline += " and "
                } else {
                    other_headline += ", "
                }
            }
            

            other_headline += `the <strong>${tables[matrix].categories[other_vars[i]].label}</strong> category <em>"${tables[matrix].categories[other_vars[i]].category.label[document.getElementById(other_vars[i]).value]}"</em>`
        }
        
    }  
    
    id_vars += `]`;   

    let api_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":' +
            id_vars + ',"dimension":{"STATISTIC":{"category":{"index":["' +
            statistic + '"]}},"' + time_var + '":{"category":{"index":["' + year +
            '"]}}' + other_selections + '},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
            matrix + '"},"version":"2.0"}}');
   

    const response = await fetch(api_url);
    const {result} = await response.json();

    var stat_label = Object.values(result.dimension.STATISTIC.category.label)[0];
    var unit = result.dimension.STATISTIC.category.unit[statistic].label;

    let plot_ni = false;

    if (geog_type == "none") {
        plot_ni = true;
    } else {
        if (result.dimension[geog_type].category.index.includes("N92000002") | themes_menu.value == "67") {
            plot_ni = true;
        }
    }

    if (plot_ni) {

        document.getElementById("chart-card").classList.remove("d-none");
        document.getElementById("chart-card").classList.add("d-block");
        document.getElementById("headline").classList.remove("d-none");
        document.getElementById("headline").classList.add("d-block");

        if (themes_menu.value != "67" & geog_type != "none") {
            const NI_position = result.dimension[geog_type].category.index.indexOf("N92000002");
            result.value.splice(NI_position, 1);
            result.dimension[geog_type].category.index.splice(NI_position, 1);
            delete result.dimension[geog_type].category.label["N92000002"];
        }

        while(chart_container.firstChild) {
            chart_container.removeChild(chart_container.firstChild)
        }

        let ni_url;

        let categories = Object.keys(tables[matrix].categories);

        if (themes_menu.value == "67") {
            if (categories.includes("NI")) {
                ni_url = "https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:%22PxStat.Data.Cube_API.ReadDataset%22,%22params%22:%7B%22class%22:%22query%22,%22id%22:%5B%5D,%22dimension%22:%7B%7D,%22extension%22:%7B%22pivot%22:null,%22codes%22:false,%22language%22:%7B%22code%22:%22en%22%7D,%22format%22:%7B%22type%22:%22JSON-stat%22,%22version%22:%222.0%22%7D,%22matrix%22:%22" + matrix + "%22%7D,%22version%22:%222.0%22%7D%7D";
            } else {
                let eq_matrix = matrix;
                 if (geog_type == "LGD2014") {
                    eq_matrix = matrix.replace("LGD", "EQ");
                } else if (geog_type == "AA") {
                    eq_matrix = matrix.replace("AA", "EQ");
                }

                ni_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' + 
                    encodeURIComponent('{"jsonrpc": "2.0", "method": "PxStat.Data.Cube_API.ReadDataset", "params": {"class": "query","id": ["EQUALGROUPS"],"dimension": {"EQUALGROUPS": {"category": {"index": ["N92000002"]}}},"extension": {"pivot": null,"codes": false,"language": {"code": "en"},"format": {"type": "JSON-stat","version": "2.0"},"matrix": "' +
                        eq_matrix + '"},"version": "2.0"}}')
                }

        } else if (geog_type == "none") {

            ni_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
            encodeURIComponent('{"jsonrpc":"2.0", "method": "PxStat.Data.Cube_API.ReadDataset", "params": {"class": "query", "id": ' + id_vars + ', "dimension": { "STATISTIC": {"category": {"index": ["' + statistic +
                '"]}}' + other_selections + '},"extension": {"pivot": null,"codes": false,"language": {"code":"en"},"format":{"type": "JSON-stat","version": "2.0"},"matrix": "'+
                matrix + '"},"version": "2.0"}}');

        } else {

        ni_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
            encodeURIComponent('{"jsonrpc": "2.0", "method": "PxStat.Data.Cube_API.ReadDataset", "params": {"class": "query", "id": ' + id_vars + ', "dimension": { "STATISTIC": {"category": {"index": ["' + statistic +
                '"]}}, "' + geog_type + 
                '": {"category": {"index": ["N92000002"]}}' + other_selections + '},"extension": {"pivot": null,"codes": false,"language": {"code":"en"},"format":{"type": "JSON-stat","version": "2.0"},"matrix": "'+
                matrix + '"},"version": "2.0"}}');   
        }

        

        const ni_response = await fetch(ni_url);
        const ni_result = await ni_response.json();
        
        var data_series = ni_result.result.value;
        // Make sure values are numbers
        const values = data_series.map(v => (v === null || v === undefined ? null : Number(v)));

        var time_series = ni_result.result.dimension[time_var].category.index;

        Chart.defaults.font.family = "'Roboto', Arial, sans-serif";
        Chart.defaults.color = "#212529"; // optional: match Bootstrap body color

        // Chart data
        const chart_data = {
            labels: [...time_series],
            datasets: [{
                label: stat_label,
                data: [...values],
                borderColor: "#00205b",
                backgroundColor: "#00205b",
                barPercentage: 0.4,
                fill: false,
                pointBackgroundColor: "#00205b",
                tension: 0
            }]
        };

        // Decide chart type dynamically
        const chart_type = (values.length === 1) ? "bar" : "line";

        // Axis titles
        const xAxisTitle = result.dimension[time_var].label || "";
        const yAxisTitle = unit || "";

        // Chart config
        const chart_config = {
            type: chart_type,
            data: chart_data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: wrapLabel(yAxisTitle).length * 25, left: 30 } }, // space for Y label
                interaction: { intersect: false, mode: "index" },
                scales: {
                    x: {
                        grid: { lineWidth: 0, drawTicks: true, tickWidth: 1 },
                        ticks: { minRotation: 0, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
                        title: {
                            display: !!xAxisTitle,
                            text: xAxisTitle,
                            color: "#6c757d",
                            padding: { top: 10 },
                            font: { size: 14, weight: "500", family: "'Roboto', Arial, sans-serif" }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            minRotation: 0,
                            maxRotation: 0,
                            callback: (v) => {
                                try { return Number(v).toLocaleString("en-GB"); }
                                catch { return v; }
                            }
                        },
                        title: { display: false } // plugin draws the label
                    }
                },
                plugins: {
                    legend: { display: false },
                    yAxisLabel: {
                        text: yAxisTitle,
                        color: "#6c757d",
                        offset: 10,
                        font: { size: 14, weight: "500", family: "'Roboto', Arial, sans-serif" },
                        maxChars: 12 // wrap threshold
                    }
                }
            },
            plugins: [yAxisLabelPlugin]
        };



        let chart_title = document.getElementById("chart-title");

        if (time_series.length == 1) {
            chart_title.textContent = `${stat_label} in Northern Ireland ${time_series[0]}`;
        } else {
            chart_title.textContent = `${stat_label} in Northern Ireland (${time_series[0]} to ${time_series[time_series.length - 1]})`;
        }

        let chart_subtitle = document.getElementById("chart-subtitle");
        chart_subtitle.innerHTML = map_subtitle.innerHTML;

        // Create a new canvas and render
        const chart_canvas = document.createElement("canvas");
        chart_canvas.id = "line-canvas";
        chart_container.appendChild(chart_canvas);

        // Prefer element or 2D context, not just the id string
        const ctx = chart_canvas.getContext('2d');
        new Chart(ctx, chart_config);

        let unit_fixed = unit;

        if (unit.toLowerCase() == "number") {
            unit_fixed = "";
        }

        let headline_value = "Not available";
        if (values[values.length - 1] != null) headline_value = values[values.length - 1].toLocaleString();

        document.getElementById("headline-fig").innerHTML = `<span class = "h1">${headline_value}</span> ${unit_fixed}`;
        document.getElementById("headline-stat").innerHTML = `<strong>${stat_label}</strong> in Northern Ireland in <strong>${time_series[time_series.length - 1]}</strong>${other_headline}.`

    } else {
        document.getElementById("map-card").classList.remove("col-xl-6")
        document.getElementById("title-card").classList.remove("col-xl-6");
    }

    let data;

    if (!["none", "NI"].includes(geog_type)) {

        let u_position;

        if (result.dimension[geog_type].category.index.includes("0")) {
            u_position = result.dimension[geog_type].category.index.indexOf("0")
            result.value.splice(u_position, 1);
            result.dimension[geog_type].category.index.splice(u_position, 1);
            delete result.dimension[geog_type].category.label["0"];
        }

        if (result.dimension[geog_type].category.index.includes("Unknown")) {
            u_position = result.dimension[geog_type].category.index.indexOf("Unknown")
            result.value.splice(u_position, 1);
            result.dimension[geog_type].category.index.splice(u_position, 1);
            delete result.dimension[geog_type].category.label["Unknown"];
        }

        data = result.value;

        // Useful for legend (keep as-is even for COB quintiles)
        let range_min = Math.floor(Math.min(...data.filter(v => v != null)));
        let range_max = Math.ceil(Math.max(...data.filter(v => v != null)));

        let colours = [];

        if (geog_type === "COB_BASIC") {
        // Build evenly-sized quintile thresholds (20/40/60/80%)
        const vals = data.filter(v => v != null).sort((a, b) => a - b);
        const qs = [0.2, 0.4, 0.6, 0.8].map(p => quantile(vals, p));

        // Map each value to a bin 0..4, then normalize to 0..1 in steps of 0.25
        const toBin = (v) => {
            if (v == null) return -1;              // “no data”
            if (v <= qs[0]) return 0;
            if (v <= qs[1]) return 1;
            if (v <= qs[2]) return 2;
            if (v <= qs[3]) return 3;
            return 4;
        };

        for (let i = 0; i < data.length; i++) {
            const bin = toBin(data[i]);
            colours.push(bin < 0 ? -1 : bin / 4);  // -1 marks NA; 0, .25, .5, .75, 1 for bins
        }
        } else {
        // Original continuous scaling
        const range = range_max - range_min || 1; // avoid divide-by-zero
        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            colours.push(v == null ? -1 : (v - range_min) / range);
        }
        }

        let legend_div = document.createElement("div");
        legend_div.id = "map-legend";
        legend_div.classList.add("map-legend");
        legend_div.classList.add("align-self-center");
        legend_div.classList.add("col-6");

        let legend_row_1 = document.createElement("div");
        legend_row_1.classList.add("row");

        let min_value = document.createElement("div");
        min_value.classList.add("legend-min");
        legend_row_1.appendChild(min_value);

        let unit_value = document.createElement("div");
        unit_value.classList.add("legend-unit");
        if (unit.toLowerCase() != "number") {
            unit_value.innerHTML = `(${unit})`;
        }
        legend_row_1.appendChild(unit_value);

        let max_value = document.createElement("div");

        max_value.classList.add("legend-max");
        legend_row_1.appendChild(max_value);

        legend_div.appendChild(legend_row_1);

        let legend_row_2 = document.createElement("div");
        legend_row_2.classList.add("row");

        for (let i = 0; i < palette.length; i++) {
            let colour_block = document.createElement("div");
            colour_block.style.backgroundColor = palette[i];
            colour_block.classList.add("colour-block");
        
            if (i == palette.length - 1) {
                colour_block.style.borderRight = "1px #555555 solid;"
            }

            legend_row_2.appendChild(colour_block);
        }

        legend_div.appendChild(legend_row_2);

        map_container.appendChild(legend_div);

            

        // Create a div for map to sit in
        let map_div = document.createElement("div");
        map_div.id = matrix + "-map";
        map_div.classList.add("map");

        
        map_container.classList.add("d-block");
        map_container.appendChild(map_div);

        let initialZoom = window.innerWidth < 768 ? 7 : 8; 

        if (geog_type == "COB_BASIC") {
            initialZoom = 1;
        }

        // Create a map
        var map = L.map(matrix + "-map",
        {zoomControl: true, // Turn off zoom controls
        dragging: false,
        touchZoom: true,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
        tap: false}).setView([54.67, -6.85], initialZoom); // Set initial co-ordinates and zoom


        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            subdomains: 'abcd',
            minZoom: initialZoom,
            maxZoom: initialZoom + 3,
            attribution:
                '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(map);

        // Run once and on every zoom change
        syncDraggingToZoom(map, initialZoom);

        // Keep the original center you used for setView
        const originalCenter = L.latLng(54.67, -6.85);
        let hasDraggedAtNonBaseZoom = false;

        // Mark that the user panned while zoomed in/out (not at base)
        map.on("movestart", () => {
        if (map.getZoom() !== initialZoom) hasDraggedAtNonBaseZoom = true;
        });

        // On zoom changes: toggle dragging AND snap back if we’re at base zoom again
        map.on("zoomend", () => {
        syncDraggingToZoom(map, initialZoom);

        // If the user had dragged while off base zoom and returns to base zoom,
        // snap back to the original center.
        if (map.getZoom() === initialZoom && hasDraggedAtNonBaseZoom) {
            hasDraggedAtNonBaseZoom = false;

            // Only recenter if we’re notably off from the original center
            const dist = map.getCenter().distanceTo(originalCenter); // meters
            if (dist > 50) { // tweak threshold as you like
            map.setView(originalCenter, initialZoom, { animate: true });
            }
        }
        });


            // Function to add tool tip to each layer
            function enhanceLayer(f, l){

                if (f.properties){

                    let geog_index = result.dimension[geog_type].category.index.indexOf(f.properties[GEOG_PROPS[geog_type].code_var].toString().replace(" ", ""));

                    let shape_label = titleCase(result.dimension[geog_type].category.label[f.properties[GEOG_PROPS[geog_type].code_var].toString().replace(" ", "")]);
                    
                    if (data[geog_index] != null) {
                        l.bindTooltip(shape_label + " (" + year + "): <strong>" + data[geog_index].toLocaleString("en-GB") + "</strong> (" + unit + ")");
                    } else {
                        l.bindTooltip(shape_label + " (" + year + "): <strong>Not available</strong>");
                    }                    

                    // http://leafletjs.com/reference.html#path-options
                    l.setStyle({
                        fillColor: getColour(colours[geog_index]),
                        fillOpacity: 0.75,
                        stroke: true,
                        color: "#555555",
                        opacity: 0.75,
                        weight: 1
                    });

                    l.on("mouseover", function (e) {
                        l.setStyle({
                            weight: 2,
                            opacity: 1
                        })
                    })

                    l.on("mouseout", function (e) {
                        l.setStyle({
                            weight: 1,
                            opacity: 0.75
                        })
                    })
                }
            }
            
            
            

            const geojsonData = await loadShapes(geog_type);
            const shapes = L.geoJSON(geojsonData, { onEachFeature: enhanceLayer }).addTo(map);
            

            min_value.innerHTML = range_min.toLocaleString("en-GB");       
            max_value.innerHTML = range_max.toLocaleString("en-GB"); 
            

            document.getElementById("map-title").textContent = `${stat_label} by ${result.dimension[geog_type].label} (${year})` ;
            document.getElementById("map-updated").innerHTML = `Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong>`;

        } else {
            data = data_series;
        }

        document.getElementById("table-title").textContent = `${result.label}`;
            page_title.textContent += ` - ${result.label}`;

            document.getElementById("nav-theme").textContent = tables[geo_menu.value].theme;        
            document.getElementById("nav-subject").textContent = tables[geo_menu.value].subject;    
            document.getElementById("nav-product").textContent = tables[geo_menu.value].product;   

        document.getElementById("chart-updated").innerHTML = `Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong>`;

        let rows = tables[matrix].rows;

        document.getElementById("dp-link").innerHTML = `Showing rows 1-${Math.min(data.length, 10)} of ${rows.toLocaleString("en-GB")}. See this full dataset on <a href = "https://data.nisra.gov.uk/table/${matrix}" target = "_blank">NISRA Data Portal</a> or download it in <a href = "https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/${matrix}/CSV/1.0/en">CSV format</a>.`

         while (table_preview.firstChild) {
            table_preview.removeChild(table_preview.firstChild)
         }

         let header_row = document.createElement("tr");

         let headers = Object.keys(result.dimension);

         for (let i = 0; i < headers.length; i ++) {
            if (headers[i] != "NI") {
                let th = document.createElement("th");
                th.textContent = result.dimension[headers[i]].label;
                header_row.appendChild(th);
            }
          

         }

         let unit_header = document.createElement("th");
         let value_header = document.createElement("th");

         unit_header.textContent = "Unit";
         value_header.textContent = "Value";
         value_header.classList.add("text-end");

         header_row.appendChild(unit_header);
         header_row.appendChild(value_header);

         table_preview.appendChild(header_row);

         for (let i = 0; i < Math.min(data.length, 10); i ++) {
            let tr = document.createElement("tr");

            let stat_cell = document.createElement("td");
            stat_cell.textContent = stat_label;
            tr.appendChild(stat_cell);

            let year_cell = document.createElement("td");
            if (["none", "NI"].includes(geog_type)) {
                year_cell.textContent = time_series[i];
            } else {
                year_cell.textContent = year;
            }
            tr.appendChild(year_cell);

            if (!["none", "NI"].includes(geog_type)) {
                let geog_cell = document.createElement("td");
                geog_cell.textContent = titleCase(Object.values(result.dimension[geog_type].category.label)[i]);
                tr.appendChild(geog_cell);
            }

            for (let j = 0; j < other_vars.length; j ++) {
                let other_cell = document.createElement("td");
                other_cell.textContent = Object.values(result.dimension[other_vars[j]].category.label)[0];
                tr.append(other_cell);
            }

            let unit_cell = document.createElement("td");
            unit_cell.textContent = unit;
            tr.appendChild(unit_cell);

            let value_cell = document.createElement("td");
            if (data[i] == null) {
                value_cell.textContent = "..";
            } else {
                let decimals = result.dimension.STATISTIC.category.unit[stats_menu.value].decimals;
                value_cell.textContent = data[i].toLocaleString("en-GB", {
                    minimumFractionDigits: decimals,
                    maximumFractionDigts: decimals
                });
            }
            
            value_cell.align = "right";
            tr.appendChild(value_cell);

            table_preview.appendChild(tr);
         }

         let note_cleaned = result.note[0].replaceAll("\r", "<br>").replaceAll("[b]", "<strong>").replaceAll("[/b]", "</strong>").replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>").replaceAll("[u]", "<u>").replaceAll("[/u]", "</u>");

         // Convert [url=...]...[/url] into <a href="...">...</a>
        note_cleaned = note_cleaned.replace(
            /\[url=([a-zA-Z][a-zA-Z0-9+.-]*:[^\]]+)\](.*?)\[\/url\]/gi,
            (match, url, text) => {
                if (url.toLowerCase().startsWith("mailto:")) {
                return `<a href="${url}">${text}</a>`;
                } else {
                return `<a href="${url}" target="_blank">${text}</a>`;
                }
            }
        );



         metadata_text.innerHTML = note_cleaned;   
   

}

function fillSubjectsMenu (structure) {

    let subjects = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects;

    for (let i = 0; i < Object.keys(subjects).length; i ++) {
        let option = document.createElement("option");
        option.value = subjects[Object.keys(subjects)[i]].code;
        option.textContent = Object.keys(subjects)[i];
        subjects_menu.appendChild(option);
    }

    let selected_subject = subjects[Object.keys(subjects)[0]].code;

    if (window.location.search == "") {
        selected_subject = tables[default_table].subject_code;
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table")) {
            let search_split = search[i].split("=");
            selected_subject = tables[search_split[1]].subject_code;
            break;
        }
    }

    subjects_menu.value = selected_subject;    

}

function fillProductsMenu (structure) {

    let products = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products;


    for (let i = 0; i < Object.keys(products).length; i ++) {
        let option = document.createElement("option");
        option.value = products[Object.keys(products)[i]].code;
        option.textContent = Object.keys(products)[i];
        products_menu.appendChild(option);
    }

    let selected_product;

    if (window.location.search == "") {
        selected_product = tables[default_table].product_code;
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_product = tables[search_split[1]].product_code;
            break;
        }
    }

    products_menu.value = selected_product;  

}

function fillNamesMenu (structure) {

    let names = Object.keys(structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text].tables);

    for (let i = 0; i < names.length; i ++) {
        let option = document.createElement("option");
        option.value = names[i].replaceAll(" ", "-");
        option.textContent = names[i];
        names_menu.appendChild(option);
    }

    let selected_name = names[0].replaceAll(" ", "-");

    if (window.location.search == "") {
        selected_name = tables[default_table].name.replaceAll(" ", "-");
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_name = tables[search_split[1]].name.replaceAll(" ", "-");
            break;
        }
    }

    names_menu.value = selected_name;  

}

function fillGeoMenu (structure) {

    let names = structure[themes_menu.options[themes_menu.selectedIndex].text].subjects[subjects_menu.options[subjects_menu.selectedIndex].text].products[products_menu.options[products_menu.selectedIndex].text].tables;

    let geos;

    for (let i = 0; i < Object.keys(names).length; i ++) {
        if (Object.keys(names)[i].replaceAll(" ", "-") == names_menu.value) {
            geos = Object.values(names)[i]
        }
    }

    let num_options = 0;

    for (let i = 0; i < geos.length; i ++) {

        let categories = Object.keys(tables[geos[i]].categories);
        
        let option = document.createElement("option");
        option.value = geos[i];
        
        if (categories.includes("AA") | categories.includes("AA2024")) {
            option.textContent = "Assembly Area";
        } else if (categories.includes("LGD2014") | categories.includes("LGD")) {
            option.textContent = "Local Government District";
        } else if (categories.includes("LGD1992")) {
            option.textContent = "Local Government District (1992)"
        } else if (categories.includes("HSCT")) {
            option.textContent = "Health and Social Care Trust";
        } else if (categories.includes("DEA2014")) {
            option.textContent = "District Electoral Area";
        } else if (categories.includes("SDZ2021")) {
            option.textContent = "Super Data Zone";
        } else if (categories.includes("DZ2021")) {
            option.textContent = "Data Zone";
        } else if (categories.includes("Ward2014")) {
            option.textContent = "Ward";
        } else if (categories.includes("SOA")) {
            option.textContent = "Super Output Area";   
        } else if (categories.includes("SA")) {
            option.textContent = "Small Area";   
        } else if (categories.includes("LCG")) {
            option.textContent = "Local Commisioning Group";
        } else if (categories.includes("UR2015") | categories.includes("SETTLEMENT")) {
            option.textContent = "Urban/Rural";
        } else if (categories.includes("NUTS3")) {
            option.textContent = "NUTS3";
        } else if (categories.includes("ELB")) {
            option.textContent = "Education and Library Board";
        } else if (categories.includes("COB_BASIC")) {
            option.textContent = "Country of Birth";
        } else if (themes_menu.value == "67" & categories.includes("EQUALGROUPS")) {
            option.textContent = "Equality Groups";
        } else if (categories.includes("NI")) {
            option.textContent = "Northern Ireland"
        }
        geo_menu.appendChild(option);
        if (option.textContent != "") num_options += 1;
        
    }

    if (num_options > 0) {
        document.getElementById("geo").parentElement.classList.add("d-block");
        document.getElementById("geo").parentElement.classList.remove("d-none");
    }

    let selected_geo;

    if (window.location.search == "") {
        selected_geo = default_table;
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("table=")) {
            let search_split = search[i].split("=");
            selected_geo = search_split[1];
        }
    }

    geo_menu.value = selected_geo; 

}

function fillStatMenu () {

    let statistics = tables[geo_menu.value].statistics;

    for (let i = 0; i < Object.keys(statistics).length; i ++) {
        let option = document.createElement("option");
        option.value = Object.keys(statistics)[i];
        option.textContent = Object.values(statistics)[i];
        stats_menu.appendChild(option);
    }

    let selected_stat = Object.keys(statistics)[0];

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("stat=")) {
            let search_split = search[i].split("=");
            selected_stat = search_split[1];
            break
        }
    }

    stats_menu.value = selected_stat;  
    
    mapSelections();

}

function mapSelections () {

    let categories = Object.keys(tables[geo_menu.value].categories);
    let geog_type;
    
    if (categories.includes("LGD2014")) {
        geog_type = "LGD2014";
    } else if (categories.includes("LGD")) {
        geog_type = "LGD";
    } else if (categories.includes("LGD1992")) {
        geog_type = "LGD1992";
    } else if (categories.includes("AA")) {
        geog_type = "AA";
    } else if (categories.includes("AA2024")) {
        geog_type = "AA2024";
    } else if (categories.includes("HSCT")) {
        geog_type = "HSCT";
    } else if (categories.includes("DEA2014")) {
        geog_type = "DEA2014";
    } else if (categories.includes("SDZ2021")) {
        geog_type = "SDZ2021";
    } else if (categories.includes("DZ2021")) {
        geog_type = "DZ2021";
    } else if (categories.includes("Ward2014")) {
        geog_type = "Ward2014";
    } else if (categories.includes("SOA")) {
        geog_type = "SOA";
    } else if (categories.includes("SA")) {
        geog_type = "SA";
    } else if (categories.includes("LCG")) {
        geog_type = "LCG";
    } else if (categories.includes("UR2015")) {
        geog_type = "UR2015";
    } else if (categories.includes("SETTLEMENT")) {
        geog_type = "SETTLEMENT";
    } else if (categories.includes("NUTS3")) {
        geog_type = "NUTS3";
    } else if (categories.includes("ELB")) {
        geog_type = "ELB";
    } else if (categories.includes("COB_BASIC")) {
        geog_type = "COB_BASIC";
    } else if (categories.includes("NI")) {
        geog_type = "NI"
    } else {
        geog_type = "none";
    }

    plotMap(geo_menu.value.replace(/_[0-9]+/, ""), stats_menu.value, geog_type);

}


// Wire up global search input
if (globalSearchInput) {
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
 const sidebarEl = document.getElementById("sidebar");
 if (sidebarEl) {
   sidebarEl.addEventListener("hidden.bs.offcanvas", () => {
     globalSearchResults.innerHTML = "";
     if (globalSearchWrap) globalSearchWrap.classList.remove("has-results");
     if (globalSearchInput) globalSearchInput.value = "";
   });
 }
}