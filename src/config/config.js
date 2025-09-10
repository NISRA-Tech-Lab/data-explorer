// Default data to show on page load
export const default_table = "MYE01T02";

// Lookup for geojson files
export const GEOG_PROPS= {
    LGD2014: { url: "public/map/LGD2014.geo.json", code_var: "LGDCode" },
    LGD:     { url: "public/map/LGD2014.geo.json", code_var: "LGDCode" },
    LGD1992: { url: "public/map/LGD1992.geo.json", code_var: "LGD_CODE" },
    AA:      { url: "public/map/AA.geo.json",      code_var: "PC_ID" },
    AA2024:  { url: "public/map/AA2024.geo.json",  code_var: "PC_Code" },
    HSCT:    { url: "public/map/HSCT.geo.json",    code_var: "TrustCode" },
    DEA2014: { url: "public/map/DEA2014.geo.json", code_var: "DEA_code" },
    SDZ2021: { url: "public/map/SDZ2021.geo.json", code_var: "SDZ21_code" },
    DZ2021:  { url: "public/map/DZ2021.geo.json",  code_var: "DZ21_code" },
    Ward2014:{ url: "public/map/Ward2014.geo.json",code_var: "Ward_Code" },
    SOA:     { url: "public/map/SOA2011.geo.json", code_var: "SOA_CODE" },
    SA:      { url: "public/map/SA2011.geo.json",  code_var: "SA2011" },
    LCG:     { url: "public/map/HSCT.geo.json",    code_var: "TrustName" },
    UR2015:  { url: "public/map/UR2015.geo.json",  code_var: "UR_CODE" },
    SETTLEMENT:{ url:"public/map/UR2015.geo.json", code_var: "UR_CODE" },
    NUTS3:   { url: "public/map/NUTS3.geo.json",   code_var: "NUTS3" },
    ELB:     { url: "public/map/ELB.geo.json",     code_var: "ELB_Code" },
    COB_BASIC:{ url:"public/map/COB.geo.json",     code_var: "COB_BASIC" }
  }

  // Colour palette for charts
export const palette = ["#d6e4f6", "#8db2e0", "#3878c5", "#22589c", "#00205b"];
