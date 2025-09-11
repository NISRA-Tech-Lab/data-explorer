import { wrapLabel } from "./wrapLabel.js";
import { yAxisLabelPlugin } from "./yAxisLabelPlugin.js";
import { palette, GEOG_PROPS } from "../config/config.js";
import { syncDraggingToZoom } from "./syncDraggingToZoom.js";
import { loadShapes } from "./loadShapes.js";
import { titleCase } from "./titleCase.js";
import { getColour } from "./getColour.js";
import { quantile} from "./quantile.js";
import { themes_menu, map_container, stats_menu,
         other_menu, map_subtitle, page_title, chart_container, 
         table_preview, metadata_text, search, geo_menu,
         SIDEBAR_OPEN_KEY, map_card, chart_card, headline,
         chart_title, chart_subtitle, headline_fig, dp_link,
         chart_updated, nav_product, nav_subject, nav_theme,
         table_title, map_updated, map_title, title_card, headline_stat } from "./elements.js";

export async function plotMap (tables, matrix, statistic, geog_type) {   

    let time_var = tables[matrix].time;
    
    let year = tables[matrix].time_series[tables[matrix].time_series.length - 1];

    if (!Array.isArray(tables[matrix].time_series)) {
        year = tables[matrix].time_series;
    }
    
    const normal_vars = ["STATISTIC", geog_type, time_var];
    if (geog_type == "COB_BASIC") {
        normal_vars.push("NI")
    } 

    let other_vars = Object.keys(tables[matrix].categories);
    other_vars = other_vars.filter(x => !normal_vars.includes(x));

    let other_selections = "";
    var other_headline = "";
    let id_vars;

    if (["none", "NI"].includes(geog_type)) {
        map_card.classList.add("d-none");
        chart_card.classList.remove("col-xl-6");
        
        id_vars = `["STATISTIC", "${time_var}"`;

    } else {

        id_vars = `["STATISTIC", "${time_var}", "${geog_type}"`;

    }        

    if (other_vars.length > 0) {
        other_headline = " for ";
        for (let i = 0; i < other_vars.length; i ++) {
            
            id_vars += `, "${other_vars[i]}"`;

            let new_menu = document.createElement("div");


            new_menu.innerHTML = `<label for = "${other_vars[i]}" class = "form-label">${tables[matrix].categories[other_vars[i]].label}</label><select id = "${other_vars[i]}" name = "${other_vars[i]}" class = "form-select"></select>`

            let options = Object.keys(tables[matrix].categories[other_vars[i]].category.label);
            let labels = Object.values(tables[matrix].categories[other_vars[i]].category.label);

            other_menu.appendChild(new_menu);

            const new_select = document.getElementById(other_vars[i]);

            for (let j = 0; j < labels.length; j ++) {
                let option = document.createElement("option");
                option.value = options[j];
                option.textContent = labels[j];
                new_select.appendChild(option);
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

            new_select.value = selected_option;              

            new_menu.onchange = function () {

                localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
                let search_string = `?table=${geo_menu.value}&stat=${stats_menu.value}`;

                for (let j = 0; j < other_vars.length; j ++) {
                    search_string += `&${other_vars[j]}=${document.getElementById(other_vars[j]).value}`;
                }                    

                window.location.search = search_string;
                
            }
     

            
            other_selections += `,"${other_vars[i]}":{"category":{"index":["${new_select.value}"]}}`;
            
            if (i == 0) {
                map_subtitle.innerHTML = "";
            }

            map_subtitle.innerHTML += `<strong>${tables[matrix].categories[other_vars[i]].label}</strong>: ${tables[matrix].categories[other_vars[i]].category.label[new_select.value]}<br>`;

            if (i != 0) {
                if (i == other_vars.length - 1) {
                    other_headline += " and "
                } else {
                    other_headline += ", "
                }
            }
            

            other_headline += `the <strong>${tables[matrix].categories[other_vars[i]].label}</strong> category <em>"${tables[matrix].categories[other_vars[i]].category.label[new_select.value]}"</em>`
        }
        
    }  
    
    id_vars += `]`;   

    let api_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":' +
            id_vars + ',"dimension":{"STATISTIC":{"category":{"index":["' +
            statistic + '"]}},"' + time_var + '":{"category":{"index":["' + year +
            '"]}}' + other_selections + 
            '},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
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

        chart_card.classList.remove("d-none");
        chart_card.classList.add("d-block");
        headline.classList.remove("d-none");
        headline.classList.add("d-block");

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
            } else if (matrix == "INDEXSALELGD") {
                ni_url = "https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:%22PxStat.Data.Cube_API.ReadDataset%22,%22params%22:%7B%22class%22:%22query%22,%22id%22:%5B%5D,%22dimension%22:%7B%7D,%22extension%22:%7B%22pivot%22:null,%22codes%22:false,%22language%22:%7B%22code%22:%22en%22%7D,%22format%22:%7B%22type%22:%22JSON-stat%22,%22version%22:%222.0%22%7D,%22matrix%22:%22INDEXSALENI%22%7D,%22version%22:%222.0%22%7D%7D";
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



        

        if (time_series.length == 1) {
            chart_title.textContent = `${stat_label} in Northern Ireland ${time_series[0]}`;
        } else {
            chart_title.textContent = `${stat_label} in Northern Ireland (${time_series[0]} to ${time_series[time_series.length - 1]})`;
        }

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

        headline_fig.innerHTML = `<span class = "h1">${headline_value}</span> ${unit_fixed}`;
        headline_stat.innerHTML = `<strong>${stat_label}</strong> in Northern Ireland in <strong>${time_series[time_series.length - 1]}</strong>${other_headline}.`

    } else {
        if (geog_type != "COB_BASIC") {
            map_card.classList.remove("col-xl-6")
        } else {
            const spacer = document.createElement("div");
            spacer.classList.add("col-xl-3");
            map_card.parentElement.insertBefore(spacer, map_card);
        }
        
        title_card.classList.remove("col-xl-6");
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
            

            map_title.textContent = `${stat_label} by ${result.dimension[geog_type].label} (${year})` ;
            map_updated.innerHTML = `Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong>`;

        } else {
            data = data_series;
        }

        table_title.textContent = `${result.label}`;
            page_title.textContent += ` - ${result.label}`;

            nav_theme.textContent = tables[geo_menu.value].theme;        
            nav_subject.textContent = tables[geo_menu.value].subject;    
            nav_product.textContent = tables[geo_menu.value].product;   

        chart_updated.innerHTML = `Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong>`;

        let rows = tables[matrix].rows;

        dp_link.innerHTML = `Showing rows 1-${Math.min(data.length, 10)} of ${rows.toLocaleString("en-GB")}. See this full dataset on <a href = "https://data.nisra.gov.uk/table/${matrix}" target = "_blank">NISRA Data Portal</a> or download it in <a href = "https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/${matrix}/CSV/1.0/en">CSV format</a>.`

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