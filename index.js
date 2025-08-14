
window.onload = function() {
    createMenus();
}

let themes_menu = document.getElementById("theme");
let products_menu = document.getElementById("product");
let subjects_menu = document.getElementById("subject");
let names_menu = document.getElementById("name");
let geo_menu = document.getElementById("geo");
let stats_menu = document.getElementById("stat");

async function createMenus () {
    try {
        const response = await fetch("data-portal-maps.json");
        const responseData = await response.json();
        tables = responseData;
    } catch (error) {
        
    }

    let themes = [];

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        theme = tables[Object.keys(tables)[i]].theme;
        if (!themes.includes(theme)) {
            themes.push(theme);
        }
    }

    themes.sort();    

    for (let i = 0; i < themes.length; i ++) {
        option = document.createElement("option");
        option.value = themes[i];
        option.textContent = themes[i];
        themes_menu.appendChild(option);
    }

    fillSubjectsMenu();
    fillProductsMenu();
    fillNamesMenu();
    fillGeoMenu();
    fillStatMenu();

    themes_menu.onchange = function () {
        fillSubjectsMenu();
        fillProductsMenu();
        fillNamesMenu();
        fillGeoMenu();
        fillStatMenu();
    }

    subjects_menu.onchange = function() {
        fillProductsMenu()
        fillNamesMenu();
        fillGeoMenu();
        fillStatMenu();
    }

    products_menu.onchange = function () {
        fillNamesMenu();
        fillGeoMenu();
        fillStatMenu();
    }

    names_menu.onchange = function () {
        fillGeoMenu();
        fillStatMenu();
    }

    geo_menu.onchange = mapSelections;

    stats_menu.onchange = mapSelections;

}

async function plotMap (matrix, statistic, geog_type) {

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
    other_vars = other_vars.filter(x => ![time_var, "STATISTIC", "LGD2014", "AA"].includes(x));

    let id_vars = `["STATISTIC", "${time_var}"`;
    let select_all = "";

    if (other_vars.length > 0) {
        
        for (let i = 0; i < other_vars.length; i ++) {
            console.log(other_vars[i])
            
        }
    }
    
    
    
    
    id_vars += `]`;   
    

    let api_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":' +
            id_vars + ',"dimension":{"STATISTIC":{"category":{"index":["' +
            statistic + '"]}},"' + time_var + '":{"category":{"index":["' + year +
            '"]}}},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
            matrix + '"},"version":"2.0"}}');

            

    const response = await fetch(api_url);
    const {result} = await response.json();

    console.log(result)

    if (result.dimension[geog_type].category.index.includes("N92000002")) {
        NI_position = result.dimension[geog_type].category.index.indexOf("N92000002")
        result.value.splice(NI_position, 1);
        result.dimension[geog_type].category.index.splice(NI_position, 1);
        delete result.dimension[geog_type].category.label["N92000002"];
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
       tap: false}).setView([54.65, -6.8], 8); // Set initial co-ordinates and zoom

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
        area_var = "LGDNAME"
    } else if (geog_type == "AA") {
        area_var = "PC_NAME"
    }

         // Function to add tool tip to each layer
         function enhanceLayer(f, l){

            if (f.properties){
                  
                  if (data[f.properties['OBJECTID'] - 1] != null) {
                     l.bindTooltip(f.properties[area_var] + " (" + year + "): <b>" + data[f.properties['OBJECTID'] - 1].toLocaleString("en-GB") + "</b> (" + unit + ")");
                  } else {
                     l.bindTooltip(f.properties[area_var] + " (" + year + "): <b>Not available</b>");
                  }

                  // http://leafletjs.com/reference.html#path-options
                  l.setStyle({
                     fillColor: getColor(colours[f.properties['OBJECTID'] - 1]),
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
         }

         if (!document.getElementById(matrix + "-legend")) {
            legend_div = document.createElement("div");
            legend_div.id = matrix + "-legend";
            legend_div.classList.add("map-legend");
            legend_row_1 = document.createElement("div");
            legend_row_1.classList.add("row");

            min_value = document.createElement("div");
            min_value.classList.add("legend-min");
            legend_row_1.appendChild(min_value);

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

        let stat = result.dimension.STATISTIC.category.label[statistic];

        document.getElementById("map-title").innerHTML = result.label + " (" + year + ")" ;
        document.getElementById("map-var").innerHTML = "Variable: <strong>" + stat + "</strong>";
        document.getElementById("map-updated").innerHTML = "Last updated: <strong>" + result.updated.substr(8, 2) + "/" + result.updated.substr(5, 2) + "/" + result.updated.substr(0, 4) + "</strong>";

        highest_area = result.dimension[geog_type].category.label[result.dimension[geog_type].category.index[data.indexOf(Math.max(...data))]];
        lowest_area = result.dimension[geog_type].category.label[result.dimension[geog_type].category.index[data.indexOf(Math.min(...data))]];

        document.getElementById("map-commentary").innerHTML = "In " + year + ", " + highest_area + " had the highest " + unit +  " of " + stat +
            " (" + Math.max(...data).toLocaleString() + ") while " + lowest_area + " had the lowest (" + Math.min(...data).toLocaleString() + ").";

        document.getElementById("dp-link").innerHTML = `<a href = "https://data.nisra.gov.uk/table/${matrix}" target = "_blank">See on NISRA Data Portal</a>`


}

function fillSubjectsMenu () {

    while(subjects_menu.firstChild) {
        subjects_menu.removeChild(subjects_menu.firstChild);
    }

    let subjects = [];

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        theme = tables[Object.keys(tables)[i]].theme;
        subject = tables[Object.keys(tables)[i]].subject;
        if (theme == themes_menu.value & !subjects.includes(subject)) {
            subjects.push(subject);
        }
    }

    subjects.sort();

    for (let i = 0; i < subjects.length; i ++) {
        option = document.createElement("option");
        option.value = subjects[i];
        option.textContent = subjects[i];
        subjects_menu.appendChild(option);
    }

}

function fillProductsMenu () {

    while(products_menu.firstChild) {
        products_menu.removeChild(products_menu.firstChild);
    }

    let products = [];

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        subject = tables[Object.keys(tables)[i]].subject;
        product = tables[Object.keys(tables)[i]].product;
        if (subject == subjects_menu.value & !products.includes(product)) {
            products.push(product);
        }
    }

    products.sort();

    for (let i = 0; i < products.length; i ++) {
        option = document.createElement("option");
        option.value = products[i];
        option.textContent = products[i];
        products_menu.appendChild(option);
    }

}

function fillNamesMenu () {

    while(names_menu.firstChild) {
        names_menu.removeChild(names_menu.firstChild);
    }

    let names = [];

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        subject = tables[Object.keys(tables)[i]].subject;
        product = tables[Object.keys(tables)[i]].product;
        title = tables[Object.keys(tables)[i]].name;
        if (subject == subjects_menu.value & product == products_menu.value & !names.includes(title)) {
            names.push(title);
        }
    }

    names.sort();

    for (let i = 0; i < names.length; i ++) {
        option = document.createElement("option");
        option.value = names[i];
        option.textContent = names[i];
        names_menu.appendChild(option);
    }

}

function fillGeoMenu () {

    while(geo_menu.firstChild) {
        geo_menu.removeChild(geo_menu.firstChild);
    }

    for (let i = 0; i < Object.keys(tables).length; i ++) {
        title = tables[Object.keys(tables)[i]].name;
        categories = tables[Object.keys(tables)[i]].categories;
        if (title == names_menu.value) {
            option = document.createElement("option");
            option.value = Object.keys(tables)[i];
            if (categories.includes("AA")) {
                option.textContent = "Assembly Area";
            } else if (categories.includes("LGD2014")) {
                option.textContent = "Local Government District";
            }
            geo_menu.appendChild(option);
        }
    }

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

    
    mapSelections();

}

function mapSelections () {

    categories = tables[geo_menu.value].categories;
    
    if (categories.includes("LGD2014")) {
        geog_type = "LGD2014";
    } else if (categories.includes("AA")) {
        geog_type = "AA";
    }

    plotMap(geo_menu.value, stats_menu.value, geog_type);
}