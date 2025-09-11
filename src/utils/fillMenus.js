import { mapSelections } from "./mapSelections.js";
import { default_table } from "../config/config.js";
import {themes_menu, subjects_menu, search, products_menu, names_menu, geo_menu, stats_menu} from "./elements.js";

export function fillSubjectsMenu (structure, tables) {

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

export function fillProductsMenu (structure, tables) {

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

export function fillNamesMenu (structure, tables) {

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

export function fillGeoMenu (structure, tables) {

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
        geo_menu.parentElement.classList.add("d-block");
        geo_menu.parentElement.classList.remove("d-none");
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

export function fillStatMenu (tables) {

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
    
    mapSelections(Object.keys(tables[geo_menu.value].categories), tables);

}