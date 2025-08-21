
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
let window_title = document.getElementsByTagName("title")[0];
let chart_container = document.getElementById("chart-container");
let table_preview = document.getElementById("table-preview");
let map_subtitle = document.getElementById("map-subtitle");
let page_title = document.getElementsByTagName("title")[0];

let search = window.location.search.replace("?", "").split("&");

async function createMenus () {

    try {
        const response = await fetch("data-portal-maps.json");
        const responseData = await response.json();
        tables = responseData;
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

    let selected_theme = themes[Object.keys(themes)[0]].code;

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
    clearOtherMenus();

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
    while (map_container.firstChild) {
        map_container.removeChild(map_container.firstChild);
    }    

    let restful_url = "https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/" + matrix + "/JSON-stat/2.0/en";

    const restful = await fetch(restful_url);
    const fetched_restful = await restful.json();

    let time_var = fetched_restful.id.filter(function (x) {return x.includes("TLIST")})[0];
    let year = fetched_restful.dimension[time_var].category.index.slice(-1);

    let other_vars = tables[matrix].categories;
    other_vars = other_vars.filter(x => ![time_var, "STATISTIC", "LGD2014", "AA", "HSCT", "DEA2014"].includes(x));

    let id_vars = `["STATISTIC", "${time_var}", "${geog_type}"`;
    let other_selections = "";

    if (other_vars.length > 0) {
        for (let i = 0; i < other_vars.length; i ++) {
            
            id_vars += `, "${other_vars[i]}"`;

            new_menu = document.createElement("div");
            if (i == 0) {
                new_menu.style = "margin-top: 20px; margin-bottom: 10px;";
            } else {
                new_menu.style = "margin-bottom: 10px;"
            }

            if (other == "") {
                new_menu.innerHTML = `<label for = "${other_vars[i]}">${fetched_restful.dimension[other_vars[i]].label}:</label><select id = "${other_vars[i]}" name = "${other_vars[i]}"></select>`

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

    if (result.dimension[geog_type].category.index.includes("N92000002")) {
        NI_position = result.dimension[geog_type].category.index.indexOf("N92000002");
        result.value.splice(NI_position, 1);
        result.dimension[geog_type].category.index.splice(NI_position, 1);
        delete result.dimension[geog_type].category.label["N92000002"];

        while(chart_container.firstChild) {
            chart_container.removeChild(chart_container.firstChild)
        }

        let ni_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent('{"jsonrpc": "2.0", "method": "PxStat.Data.Cube_API.ReadDataset", "params": {"class": "query", "id": ' + id_vars + ', "dimension": { "STATISTIC": {"category": {"index": ["' + statistic +
            '"]}}, "' + geog_type + 
            '": {"category": {"index": ["N92000002"]}}' + other_selections + '},"extension": {"pivot": null,"codes": false,"language": {"code":"en"},"format":{"type": "JSON-stat","version": "2.0"},"matrix": "'+
            matrix + '"},"version": "2.0"}}');   

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
            data: values,
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
            maintainAspectRatio: true,
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

        chart_title = document.createElement("h3");

        if (time_series.length == 1) {
            chart_title.innerHTML = `Northern Ireland ${time_series[0]}`;
        } else {
            chart_title.innerHTML = `Northern Ireland ${time_series[0]} - ${time_series.pop()}`;
        }
        

        chart_container.appendChild(chart_title);

        chart_subtitle = document.createElement("p");
        chart_subtitle.innerHTML = map_subtitle.innerHTML;
        chart_container.appendChild(chart_subtitle);

        // Create a new canvas and render
        const chart_canvas = document.createElement("canvas");
        chart_canvas.id = "line-canvas";
        chart_container.appendChild(chart_canvas);

        // Prefer element or 2D context, not just the id string
        const ctx = chart_canvas.getContext('2d');
        new Chart(ctx, chart_config);


    }

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

    let data = result.value;
    data = data.map(item => item === '-' ? null : item);
    let unit = result.dimension.STATISTIC.category.unit[statistic].label;
    

    // Create a div for map to sit in
    map_div = document.createElement("div");
    map_div.id = matrix + "-map";
    map_div.classList.add("map");

    
    document.getElementById("map-loading").style.display = "none";
    map_container.style.display = "block";
    map_container.appendChild(map_div);

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
       tap: false}).setView([54.67, -6.3], 8); // Set initial co-ordinates and zoom

    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
       maxZoom: 19,
       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map); // Add a background map

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
         
         // geojson data atted to map and enhanceLayer function applied to each feature    
         if (geog_type.includes("LGD")) {
            shapes = L.geoJSON(LGD_map, {onEachFeature:enhanceLayer}).addTo(map);
         } else if (geog_type == "AA") {
            shapes = L.geoJSON(AA_map, {onEachFeature:enhanceLayer}).addTo(map);
         } else if (geog_type == "HSCT") {
            shapes = L.geoJSON(HSCT_map, {onEachFeature:enhanceLayer}).addTo(map);
         } else if (geog_type.includes("DEA")) {
            shapes = L.geoJSON(DEA_map, {onEachFeature:enhanceLayer}).addTo(map);
         }

         if (!document.getElementById(matrix + "-legend")) {
            legend_div = document.createElement("div");
            legend_div.id = matrix + "-legend";
            legend_div.classList.add("map-legend");

            legend_title = document.createElement("div");
            legend_title.textContent = stat_label;
            legend_title.classList.add("legend-title");
            legend_div.appendChild(legend_title);

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
               legend_row_2.appendChild(colour_block);
               if (i == 0) {
                  colour_block.style.marginLeft = "7.5px"
               }
            }

            legend_div.appendChild(legend_row_2);

            map_container.appendChild(legend_div);

         }        

        min_value.innerHTML = range_min.toLocaleString("en-GB");       
        max_value.innerHTML = range_max.toLocaleString("en-GB");         

        document.getElementById("table-title").textContent = `${result.label}`;
        page_title.textContent = `Data Explorer - ${result.label}`;
        document.getElementById("map-title").textContent = `Mapped by ${result.dimension[geog_type].label} (${year})` ;
        document.getElementById("map-updated").innerHTML = `Last updated: <strong>${result.updated.substr(8, 2)}/${result.updated.substr(5, 2)}/${result.updated.substr(0, 4)}</strong>`;

        document.getElementById("dp-link").innerHTML = `<a href = "https://data.nisra.gov.uk/table/${matrix}" target = "_blank">See on NISRA Data Portal</a>`

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

         for (let i = 0; i < Math.min(data.length, 18); i ++) {
            tr = document.createElement("tr");

            stat_cell = document.createElement("td");
            stat_cell.textContent = stat_label;
            tr.appendChild(stat_cell);

            year_cell = document.createElement("td");
            year_cell.textContent = year;
            tr.appendChild(year_cell);

            geog_cell = document.createElement("td");
            geog_cell.textContent = titleCase(Object.values(result.dimension[geog_type].category.label)[i]);
            tr.appendChild(geog_cell);

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
            }
            geo_menu.appendChild(option);
        }
    }

    let selected_geo = geo_menu.options[0].value;

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
    }

    plotMap(geo_menu.value, stats_menu.value, geog_type);
}

function clearOtherMenus () {
    while (other_menu.firstChild) {
        other_menu.removeChild(other_menu.firstChild);
    } 
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