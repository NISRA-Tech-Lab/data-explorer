let top_menu = document.getElementById("top-menu");
let buttons = top_menu.getElementsByTagName("button");
let scrns = document.getElementsByClassName("scrn");

let current_tab = window.location.search.replace("?tab=", "");

if (current_tab == "") {
    current_tab = "graph"
}

for (let i = 0; i < buttons.length; i ++) {

    if (buttons[i].id == current_tab + "-btn") {
        buttons[i].classList.add("selected");
    } else {
        buttons[i].classList.remove("selected");
    }

}

for (let i = 0; i < scrns.length; i ++) {
    if (scrns[i].id == current_tab + "-scrn") {
        scrns[i].style.display = "block";
    } else {
        scrns[i].style.display = "none";
    }
}

async function getData (string) {
    let api_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent(string);

    const response = await fetch(api_url);
    const {result} = await response.json();

    return result;
}

async function barChart(matrix, statistic, geog_type, geog_code) {   

    let api_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":["STATISTIC","' +
            geog_type + '"],"dimension":{"STATISTIC":{"category":{"index":["' +
            statistic + '"]}},"' + geog_type + '":{"category":{"index":["' + geog_code + 
            '"]}}},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"'
            + matrix + '"},"version":"2.0"}}');

    const response = await fetch(api_url);
    const {result} = await response.json();

    let variable = result.dimension.STATISTIC.category.label[statistic];
    let unit = result.dimension.STATISTIC.category.unit[statistic].label;
    let decimals = result.dimension.STATISTIC.category.unit[statistic].decimals;

    document.getElementById("graph-title").innerHTML = result.label;
    document.getElementById("graph-var").innerHTML = "Variable: <strong>" + variable + "</strong>";
    document.getElementById("graph-updated").innerHTML = "Last updated: <strong>" + result.updated.substr(8, 2) + "/" + result.updated.substr(5, 2) + "/" + result.updated.substr(0, 4) + "</strong>";

    let time_var = result.id.filter(function (x) {return x.includes("TLIST")});

    let this_value = result.value.slice(-1)[0];
    let last_value = result.value.slice(-2)[0];

    let area = result.dimension[geog_type].category.label[geog_code];

    if (result.dimension[time_var].category.index.length > 1) {

        this_year = result.dimension[time_var].category.index.slice(-1)[0];
        last_year = result.dimension[time_var].category.index.slice(-2)[0];
    
        let graph_comment;
        if (this_value == last_value) {
            graph_comment = "remained the same";
        } else {
            if (this_value > last_value) {
                graph_comment = "increased";
            } else {
                graph_comment = "decreased";
            }
            graph_comment += " by " + Math.abs(this_value - last_value).toFixed(decimals);
        }  
    
        document.getElementById("graph-commentary").innerHTML = "The " + unit + " of " + variable + " in " + area +
            " has " + graph_comment  + " betweeen " + last_year + " and " + this_year + "."

    }

    const labels = result.dimension[time_var].category.index;

    

    const data = {
        labels: labels,
        datasets: [{
            label: area,
            data: result.value,
            fill: false,
            borderColor: '#3878c5',
            backgroundColor: '#3878c5',
            tension: 0.3
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
      };  

    new Chart("line-chart", config);

}

async function plotMap (matrix, statistic, geog_type) {

    let restful_url = "https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/" + matrix + "/JSON-stat/2.0/en";

    const restful = await fetch(restful_url);
    const fetched_restful = await restful.json();

    let time_var = fetched_restful.id.filter(function (x) {return x.includes("TLIST")});
    let year = fetched_restful.dimension[time_var].category.index.slice(-1);

    let api_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
        encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":["STATISTIC","' +
            time_var + '"],"dimension":{"STATISTIC":{"category":{"index":["' +
            statistic + '"]}},"' + time_var + '":{"category":{"index":["' + year +
            '"]}}},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
            matrix + '"},"version":"2.0"}}');

    const response = await fetch(api_url);
    const {result} = await response.json();

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
    let unit = result.dimension.STATISTIC.category.unit[statistic].label;

    // Create a div for map to sit in
    map_div = document.createElement("div");
    map_div.id = matrix + "-map";
    map_div.classList.add("map");

    let map_container = document.getElementById("map-container");
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

        

}

window.onload = function() {
    if (current_tab == "graph") {
        barChart(config.matrix, config.statistic, config.geog_type, config.geog_code);
    } else if (current_tab == "map") {
        plotMap(config.matrix, config.statistic, config.geog_type, config.year);
    }
}