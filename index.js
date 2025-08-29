
window.onload = function() {
    createMenus();
}

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
let globalSearchResults = document.getElementById("global-search-results");
let searchIndex = [];
let globalSearchWrap = document.querySelector(".sidebar-search");
let metadata_text = document.getElementById("metadata-text");


let search = window.location.search.replace("?", "").split("&");

async function createMenus () {

    try {
        const response = await fetch("data-portal-maps.json");
        const responseData = await response.json();
        tables = responseData;
        // Build a global search index from all datasets
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
            slug: name.replace(/\s+/g, "-")   // your app uses spaces → hyphens
        };
        });

    } catch (error) {
        
    }

    let themes = {}

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        theme = tables[Object.keys(tables)[i]].theme;
        theme_code = tables[Object.keys(tables)[i]].theme_code;
        if (!Object.keys(themes).includes(theme)) {
            themes[theme] = {"code": theme_code};
        }
    }

    themes = sortObject(themes);

    for (let i = 0; i < Object.keys(themes).length; i ++) {
        option = document.createElement("option");
        option.value = themes[Object.keys(themes)[i]].code;
        option.textContent = Object.keys(themes)[i];
        themes_menu.appendChild(option);
    }

    // let selected_theme = themes[Object.keys(themes)[0]].code;
    let selected_theme = 70;

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("theme=")) {
            search_split = search[i].split("=");
            selected_theme = search_split[1].replaceAll("%20", " ");
            break;
        }
    }

    themes_menu.value = selected_theme;

    fillSubjectsMenu();
    fillProductsMenu();
    fillNamesMenu();
    fillGeoMenu();
    fillStatMenu();

    themes_menu.onchange = function () {
        window.location.search = `?theme=${themes_menu.value}`;
    }

    subjects_menu.onchange = function() {
        window.location.search = `?theme=${themes_menu.value}&subject=${subjects_menu.value}`;
    }

    products_menu.onchange = function () {
        window.location.search = `?theme=${themes_menu.value}&subject=${subjects_menu.value}&product=${products_menu.value}`;
    }

    names_menu.onchange = function () {
        window.location.search = `?theme=${themes_menu.value}&subject=${subjects_menu.value}&product=${products_menu.value}&name=${names_menu.value}`;
    }

    geo_menu.onchange = function () {
        window.location.search = `?theme=${themes_menu.value}&subject=${subjects_menu.value}&product=${products_menu.value}&name=${names_menu.value}&geo=${geo_menu.value}`;
    }

    stats_menu.onchange = function () {
        window.location.search = `?theme=${themes_menu.value}&subject=${subjects_menu.value}&product=${products_menu.value}&name=${names_menu.value}&geo=${geo_menu.value}&stat=${stats_menu.value}`;
    }

}

async function plotMap (matrix, statistic, geog_type, other = "") {

    let map_container = document.getElementById("map-container");

    let restful_url = "https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/" + matrix + "/JSON-stat/2.0/en";

    const restful = await fetch(restful_url);
    const fetched_restful = await restful.json();

    let time_var = fetched_restful.id.filter(function (x) {return x.includes("TLIST")})[0];
    let year = fetched_restful.dimension[time_var].category.index.slice(-1);

    let other_vars = tables[matrix].categories;
    other_vars = other_vars.filter(x => ![time_var, "STATISTIC", "LGD2014", "AA", "HSCT", "DEA2014", "SDZ2021"].includes(x));

    let other_selections = "";
    var other_headline = "";
    let id_vars;

    if (geog_type == "none") {
        document.getElementById("map-card").style.display = "none";
        document.getElementById("chart-card").classList.remove("col-lg-6");
        
        id_vars = `["STATISTIC", "${time_var}"`;

    } else {

        id_vars = `["STATISTIC", "${time_var}", "${geog_type}"`;

    }
        

    if (other_vars.length > 0) {
        other_headline = " for ";
        for (let i = 0; i < other_vars.length; i ++) {
            
            id_vars += `, "${other_vars[i]}"`;

            new_menu = document.createElement("div");

            if (other == "") {
                new_menu.innerHTML = `<label for = "${other_vars[i]}" class = "form-label">${fetched_restful.dimension[other_vars[i]].label}:</label><select id = "${other_vars[i]}" name = "${other_vars[i]}" class = "form-select"></select>`

                options = Object.keys(fetched_restful.dimension[other_vars[i]].category.label);
                labels = Object.values(fetched_restful.dimension[other_vars[i]].category.label);

                other_menu.appendChild(new_menu);

                for (let j = 0; j < labels.length; j ++) {
                    option = document.createElement("option");
                    option.value = options[j];
                    option.textContent = labels[j];
                    document.getElementById(other_vars[i]).appendChild(option);
                }

                new_menu.onchange = function () {
                    plotMap(matrix, statistic, geog_type, other = document.getElementById(other_vars[i]).value);

                }
            }

            
            other_selections += `,"${other_vars[i]}":{"category":{"index":["${document.getElementById(other_vars[i]).value}"]}}`;
            
            if (i == 0) {
                map_subtitle.innerHTML = "";
            }

            map_subtitle.innerHTML += `<strong>${fetched_restful.dimension[other_vars[i]].label}</strong>: ${fetched_restful.dimension[other_vars[i]].category.label[document.getElementById(other_vars[i]).value]}<br>`;

            if (i != 0) {
                if (i == other_vars.length - 1) {
                    other_headline += " and "
                } else {
                    other_headline += ", "
                }
            }
            

            other_headline += `the <strong>${fetched_restful.dimension[other_vars[i]].label}</strong> category <em>"${fetched_restful.dimension[other_vars[i]].category.label[document.getElementById(other_vars[i]).value]}"</em>`
            
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

        document.getElementById("chart-card").style.display = "block";

        if (themes_menu.value != "67" & geog_type != "none") {
            NI_position = result.dimension[geog_type].category.index.indexOf("N92000002");
            result.value.splice(NI_position, 1);
            result.dimension[geog_type].category.index.splice(NI_position, 1);
            delete result.dimension[geog_type].category.label["N92000002"];
        }

        while(chart_container.firstChild) {
            chart_container.removeChild(chart_container.firstChild)
        }

        chart_unit = document.createElement("div");
        chart_unit.classList.add("chart-unit");        
        chart_unit.classList.add("text-secondary");   

        chart_unit.textContent = unit;

        chart_container.appendChild(chart_unit);

        if (themes_menu.value == "67") {
            if (products_menu.value == "RW") {
                ni_url = "https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:%22PxStat.Data.Cube_API.ReadDataset%22,%22params%22:%7B%22class%22:%22query%22,%22id%22:%5B%5D,%22dimension%22:%7B%7D,%22extension%22:%7B%22pivot%22:null,%22codes%22:false,%22language%22:%7B%22code%22:%22en%22%7D,%22format%22:%7B%22type%22:%22JSON-stat%22,%22version%22:%222.0%22%7D,%22matrix%22:%22INDRECWSTENI%22%7D,%22version%22:%222.0%22%7D%7D";
            } else {
                 if (geog_type == "LGD2014") {
                    eq_matrix = matrix.replace("LGD", "EQ");
                } else if (geog_type == "AA") {
                    eq_matrix = matrix.replace("AA", "EQ");
                } else {
                    eq_matrix = matrix;
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
        
        const data_series = ni_result.result.value;
        // Make sure values are numbers
        const values = data_series.map(v => (v === null || v === undefined ? null : Number(v)));

        const time_series = ni_result.result.dimension[time_var].category.index;

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
            tension: 0 // optional: straight lines
        }]
        };

        // Decide chart type dynamically
        const chartType = (values.length === 1) ? 'bar' : 'line';

        // Chart configuration
        const chart_config = {
        type: chartType,
        data: chart_data, // <-- was `chart_data,` before (wrong key)
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
            x: {
                grid: { lineWidth: 0, drawTicks: true, tickWidth: 1 },
                ticks: { minRotation: 0, maxRotation: 0 }
            },
            y: {
                beginAtZero: true,
                ticks: { minRotation: 0, maxRotation: 0 }
            }
            },
            interaction: { intersect: false, mode: "index" }
        },
        plugins: []
        };

        chart_title = document.getElementById("chart-title");

        if (time_series.length == 1) {
            chart_title.textContent = `Northern Ireland ${time_series[0]}`;
        } else {
            chart_title.textContent = `Northern Ireland ${time_series[0]} - ${time_series[time_series.length - 1]}`;
        }

        chart_subtitle = document.getElementById("chart-subtitle");
        chart_subtitle.innerHTML = map_subtitle.innerHTML;

        // Create a new canvas and render
        const chart_canvas = document.createElement("canvas");
        chart_canvas.id = "line-canvas";
        chart_container.appendChild(chart_canvas);

        // Prefer element or 2D context, not just the id string
        const ctx = chart_canvas.getContext('2d');
        new Chart(ctx, chart_config);

        x_axis_label = document.createElement("div");
        x_axis_label.textContent = result.dimension[time_var].label;
        x_axis_label.classList.add("text-secondary");
        x_axis_label.classList.add("text-center");
        chart_container.appendChild(x_axis_label);

        if (unit.toLowerCase() == "number") {
            unit_fixed = "";
        } else {
            unit_fixed = unit;
        }
        
        let headline_value = "Not available";
        if (values[values.length - 1] != null) headline_value = values[values.length - 1].toLocaleString();

        document.getElementById("headline-fig").innerHTML = `<span class = "h1">${headline_value}</span> ${unit_fixed}`;
        document.getElementById("headline-stat").innerHTML = `<strong>${stat_label}</strong> in Northern Ireland in <strong>${time_series[time_series.length - 1]}</strong>${other_headline}.`

    }

    if (geog_type != "none") {

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
        data = data.map(item => item === '-' ? null : item);
        
        let range_min = Math.floor(Math.min(...data));
        let range_max = Math.ceil(Math.max(...data));
            
        let range = range_max - range_min; // Calculate the range of values

        // Create an array colours, where each value is between 0 and 1 depending on where it falls in the range of values
        colours = [];
        for (let i = 0; i < data.length; i++) {
            colours.push((data[i] - range_min) / range);
        }

        // Colour palettes for increasing/decreasing indicators
        let palette = ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"];

        legend_div = document.createElement("div");
        legend_div.id = "map-legend";
        legend_div.classList.add("map-legend");
        legend_div.classList.add("align-self-center");
        legend_div.classList.add("col-6")

        legend_title = document.createElement("div");
        legend_title.textContent = stat_label;
        legend_title.classList.add("legend-title");
        map_container.appendChild(legend_title);

        legend_row_1 = document.createElement("div");
        legend_row_1.classList.add("row");

        min_value = document.createElement("div");
        min_value.classList.add("legend-min");
        legend_row_1.appendChild(min_value);

        unit_value = document.createElement("div");
        unit_value.classList.add("legend-unit");
        if (unit.toLowerCase() != "number") {
            unit_value.innerHTML = `(${unit})`;
        }
        legend_row_1.appendChild(unit_value);

        max_value = document.createElement("div");

        max_value.classList.add("legend-max");
        legend_row_1.appendChild(max_value);

        legend_div.appendChild(legend_row_1);

        legend_row_2 = document.createElement("div");
        legend_row_2.classList.add("row");

        for (let i = 0; i < palette.length; i++) {
            colour_block = document.createElement("div");
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
        map_div = document.createElement("div");
        map_div.id = matrix + "-map";
        map_div.classList.add("map");

        
        map_container.style.display = "block";
        map_container.appendChild(map_div);

        let initialZoom = window.innerWidth < 768 ? 7 : 8; 

        // Create a map
        var map = L.map(matrix + "-map",
        {zoomControl: false, // Turn off zoom controls
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
        tap: false}).setView([54.67, -6.85], initialZoom); // Set initial co-ordinates and zoom

        L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map); // Add a background map

    


        // When called chooses a colour from above palette based on value of colours array
        function getColor(d) {
            if (d < 0) {
                return "#d3d3d3";
            } else {
                return palette[Math.round(d*4)];
            }
        }

        // Variable name to use if geo data is LGD or AA
        if (geog_type.includes("LGD")) {
            area_var = "LGDNAME";
            code_var = "LGDCode";
        } else if (geog_type == "AA") {
            area_var = "PC_NAME";
            code_var = "PC_ID";
        } if (geog_type == "HSCT") {
            area_var = "TrustName";
            code_var = "TrustCode";
        } if (geog_type.includes("DEA")) {
            area_var = "DEA";
            code_var = "DEA_code";
        } else if (geog_type.includes("SDZ")) {
            area_var = "SDZ21_name";
            code_var = "SDZ21_code";
        }

            // Function to add tool tip to each layer
            function enhanceLayer(f, l){

                if (f.properties){

                    let geog_index = result.dimension[geog_type].category.index.indexOf(f.properties[code_var]);
                    
                    if (data[geog_index] != null) {
                        l.bindTooltip(titleCase(f.properties[area_var]) + " (" + year + "): <strong>" + data[geog_index].toLocaleString("en-GB") + "</strong> (" + unit + ")");
                    } else {
                        l.bindTooltip(titleCase(f.properties[area_var]) + " (" + year + "): <strong>Not available</strong>");
                    }

                    // http://leafletjs.com/reference.html#path-options
                    l.setStyle({
                        fillColor: getColor(colours[geog_index]),
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
            
            if (typeof shapes !== "undefined") {
                shapes.clearLayers();
            }
            

            const geojsonData = await loadShapes(geog_type);
            shapes = L.geoJSON(geojsonData, { onEachFeature: enhanceLayer }).addTo(map);                

            min_value.innerHTML = range_min.toLocaleString("en-GB");       
            max_value.innerHTML = range_max.toLocaleString("en-GB");         

             


            document.getElementById("map-title").textContent = `Mapped by ${result.dimension[geog_type].label} (${year})` ;
            document.getElementById("map-updated").innerHTML = `Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong>`;

        } else {
            data = fetched_restful.value;
        }

        document.getElementById("table-title").textContent = `${result.label}`;
            page_title.textContent += ` - ${result.label}`;

            document.getElementById("nav-theme").textContent = tables[matrix].theme;        
            document.getElementById("nav-subject").textContent = tables[matrix].subject;    
            document.getElementById("nav-product").textContent = tables[matrix].product;   

        document.getElementById("chart-updated").innerHTML = `Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong>`;

        let rows = fetched_restful.value.length;

        document.getElementById("dp-link").innerHTML = `Showing rows 1-${Math.min(data.length, 10)} of ${rows.toLocaleString("en-GB")}. See this full dataset on <a href = "https://data.nisra.gov.uk/table/${matrix}" target = "_blank">NISRA Data Portal</a> or download it in <a href = "https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/${matrix}/CSV/1.0/en">CSV format</a>.`

         while (table_preview.firstChild) {
            table_preview.removeChild(table_preview.firstChild)
         }

         header_row = document.createElement("tr");

         let headers = Object.keys(result.dimension);

         for (let i = 0; i < headers.length; i ++) {

           th = document.createElement("th");
           th.textContent = result.dimension[headers[i]].label;
           
           header_row.appendChild(th);

         }

         unit_header = document.createElement("th");
         value_header = document.createElement("th");

         unit_header.textContent = "Unit";
         value_header.textContent = "Value";
         value_header.style.textAlign = "right";

         header_row.appendChild(unit_header);
         header_row.appendChild(value_header);

         table_preview.appendChild(header_row);

         for (let i = 0; i < Math.min(data.length, 10); i ++) {
            tr = document.createElement("tr");

            stat_cell = document.createElement("td");
            stat_cell.textContent = stat_label;
            tr.appendChild(stat_cell);

            year_cell = document.createElement("td");
            year_cell.textContent = year;
            tr.appendChild(year_cell);

            if (geog_type != "none") {
                geog_cell = document.createElement("td");
                geog_cell.textContent = titleCase(Object.values(result.dimension[geog_type].category.label)[i]);
                tr.appendChild(geog_cell);
            }

            for (let j = 0; j < other_vars.length; j ++) {
                other_cell = document.createElement("td");
                other_cell.textContent = Object.values(result.dimension[other_vars[j]].category.label)[0];
                tr.append(other_cell);
            }

            unit_cell = document.createElement("td");
            unit_cell.textContent = unit;
            tr.appendChild(unit_cell);

            value_cell = document.createElement("td");
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
        "<a href='$1' target='_blank'>$2</a>"
        );


         metadata_text.innerHTML = note_cleaned;   
   

}

function fillSubjectsMenu () {

    while(subjects_menu.firstChild) {
        subjects_menu.removeChild(subjects_menu.firstChild);
    }

    let subjects = {};

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        theme = tables[Object.keys(tables)[i]].theme_code;
        subject = tables[Object.keys(tables)[i]].subject;
        subject_code = tables[Object.keys(tables)[i]].subject_code;
        if (theme == themes_menu.value & !Object.keys(subjects).includes(subject)) {
            subjects[subject] = {"code": subject_code};
        }
    }

    subjects = sortObject(subjects);

    for (let i = 0; i < Object.keys(subjects).length; i ++) {
        option = document.createElement("option");
        option.value = subjects[Object.keys(subjects)[i]].code;
        option.textContent = Object.keys(subjects)[i];
        subjects_menu.appendChild(option);
    }

    let selected_subject = subjects[Object.keys(subjects)[0]].code;

    if (window.location.search == "") {
        selected_subject = 153
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("subject")) {
            search_split = search[i].split("=");
            selected_subject = search_split[1];
            break;
        }
    }

    subjects_menu.value = selected_subject;    

}

function fillProductsMenu () {

    while(products_menu.firstChild) {
        products_menu.removeChild(products_menu.firstChild);
    }

    let products = {};

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        theme = tables[Object.keys(tables)[i]].theme_code;
        subject = tables[Object.keys(tables)[i]].subject_code;
        product = tables[Object.keys(tables)[i]].product;
        product_code = tables[Object.keys(tables)[i]].product_code;
        if (theme == themes_menu.value & subject == subjects_menu.value & !Object.keys(products).includes(product)) {
            products[product] = {"code": product_code};
        }
    }

    products = sortObject(products);

    for (let i = 0; i < Object.keys(products).length; i ++) {
        option = document.createElement("option");
        option.value = products[Object.keys(products)[i]].code;
        option.textContent = Object.keys(products)[i];
        products_menu.appendChild(option);
    }

    let selected_product = products[Object.keys(products)[0]].code;

    if (window.location.search == "") {
        selected_product = "PMPE"
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("product=")) {
            search_split = search[i].split("=");
            selected_product = search_split[1];
            break;
        }
    }

    products_menu.value = selected_product;  

}

function fillNamesMenu () {

    while(names_menu.firstChild) {
        names_menu.removeChild(names_menu.firstChild);
    }

    let names = [];

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        theme = tables[Object.keys(tables)[i]].theme_code;
        subject = tables[Object.keys(tables)[i]].subject_code;
        product = tables[Object.keys(tables)[i]].product_code;
        title = tables[Object.keys(tables)[i]].name;
        if (theme == themes_menu.value & subject == subjects_menu.value & product == products_menu.value & !names.includes(title)) {
            names.push(title);
        }
    }

    names.sort();

    for (let i = 0; i < names.length; i ++) {
        option = document.createElement("option");
        option.value = names[i].replaceAll(" ", "-");
        option.textContent = names[i];
        names_menu.appendChild(option);
    }

    let selected_name = names[0].replaceAll(" ", "-");

    if (window.location.search == "") {
        selected_name = "Population-totals";
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("name=")) {
            search_split = search[i].split("=");
            selected_name = search_split[1];
            break;
        }
    }

    names_menu.value = selected_name;  

}

function fillGeoMenu () {

    while(geo_menu.firstChild) {
        geo_menu.removeChild(geo_menu.firstChild);
    }

    let num_options = 0;

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        theme = tables[Object.keys(tables)[i]].theme_code;
        subject = tables[Object.keys(tables)[i]].subject_code;
        title = tables[Object.keys(tables)[i]].name.replaceAll(" ", "-");
        categories = tables[Object.keys(tables)[i]].categories;
        if (theme == themes_menu.value & subject == subjects_menu.value & title == names_menu.value) {
            option = document.createElement("option");
            option.value = Object.keys(tables)[i];
            if (categories.includes("AA")) {
                option.textContent = "Assembly Area";
            } else if (categories.includes("LGD2014")) {
                option.textContent = "Local Government District";
            } else if (categories.includes("HSCT")) {
                option.textContent = "Health and Social Care Trust";
            } else if (categories.includes("DEA2014")) {
                option.textContent = "District Electoral Area";
            } else if (categories.includes("SDZ2021")) {
                option.textContent = "Super Data Zone";
            }
            geo_menu.appendChild(option);
            if (option.textContent != "") num_options += 1;
        }
    }

    if (num_options > 0) document.getElementById("geo").parentElement.style.display = "block";

    let selected_geo = geo_menu.options[0].value;

    if (window.location.search == "") {
        selected_geo = "MYE01T06";
    }

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("geo=")) {
            search_split = search[i].split("=");
            selected_geo = search_split[1];
        }
    }

    geo_menu.value = selected_geo; 

}

function fillStatMenu () {

    while(stats_menu.firstChild) {
        stats_menu.removeChild(stats_menu.firstChild);
    }

    statistics = tables[geo_menu.value].statistics;

    for (let i = 0; i < Object.keys(statistics).length; i ++) {
        option = document.createElement("option");
        option.value = Object.keys(statistics)[i];
        option.textContent = Object.values(statistics)[i];
        stats_menu.appendChild(option);
    }

    let selected_stat = Object.keys(statistics)[0];

    for (let i = 0; i < search.length; i ++) {
        if (search[i].includes("stat=")) {
            search_split = search[i].split("=");
            selected_stat = search_split[1];
            break
        }
    }

    stats_menu.value = selected_stat;  
    
    mapSelections();

}

function mapSelections () {

    categories = tables[geo_menu.value].categories;
    
    if (categories.includes("LGD2014")) {
        geog_type = "LGD2014";
    } else if (categories.includes("AA")) {
        geog_type = "AA";
    } else if (categories.includes("HSCT")) {
        geog_type = "HSCT";
    } else if (categories.includes("DEA2014")) {
        geog_type = "DEA2014";
    } else if (categories.includes("SDZ2021")) {
        geog_type = "SDZ2021";
    } else {
        geog_type = "none";
    }

    plotMap(geo_menu.value, stats_menu.value, geog_type);
}

// A function to sort items alphabetically inside an object based on the object key
function sortObject(o) {
   var sorted = {},
   key, a = [];

   for (key in o) {
         if (o.hasOwnProperty(key)) {
            a.push(key);
         }
   }

   a.sort();

   for (key = 0; key < a.length; key++) {
         sorted[a[key]] = o[a[key]];
   }
   
   return sorted;
}

function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    if (str[i] != "and") {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);     
    }
  }
  return str.join(' ');
}

function filterNamesGlobal(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  return searchIndex.filter(item => words.every(w => item.nameLower.includes(w)));
}

function renderGlobalResults(items) {
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
    a.href = `?theme=${item.theme_code}&subject=${item.subject_code}&product=${item.product_code}&name=${item.slug}`;
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


// Wire up global search input
if (globalSearchInput) {
  const doSearch = () => {
    const q = globalSearchInput.value || "";
    const matches = filterNamesGlobal(q);
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


// Map a geog_type to file paths (GeoJSON works great)
const SHAPE_URLS = {
  LGD2014: "map/LGD2014.geo.json",
  AA:      "map/AA.geo.json",
  HSCT:    "map/HSCT.geo.json",
  DEA2014: "map/DEA2014.geo.json",
  SDZ2021: "map/SDZ2021.geo.json",
};

const shapeCache = new Map();

async function loadShapes(geog_type) {
  if (shapeCache.has(geog_type)) return shapeCache.get(geog_type);

  const url = SHAPE_URLS[geog_type];
  if (!url) throw new Error(`No shape URL for ${geog_type}`);

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const data = await res.json();

  // If you ever switch to .topo.json, this still works:
  const geojson = (data.type === "Topology" && window.topojson)
    ? topojson.feature(data, Object.values(data.objects)[0])
    : data;

  shapeCache.set(geog_type, geojson);
  return geojson;
}


