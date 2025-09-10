// Default data to show on page load
export const default_table = "MYE01T02";

// Lookup for geojson files
export const GEOG_PROPS= {
    LGD2014: { url: "map/LGD2014.geo.json", code_var: "LGDCode" },
    LGD:     { url: "map/LGD2014.geo.json", code_var: "LGDCode" },
    LGD1992: { url: "map/LGD1992.geo.json", code_var: "LGD_CODE" },
    AA:      { url: "map/AA.geo.json",      code_var: "PC_ID" },
    AA2024:  { url: "map/AA2024.geo.json",  code_var: "PC_Code" },
    HSCT:    { url: "map/HSCT.geo.json",    code_var: "TrustCode" },
    DEA2014: { url: "map/DEA2014.geo.json", code_var: "DEA_code" },
    SDZ2021: { url: "map/SDZ2021.geo.json", code_var: "SDZ21_code" },
    DZ2021:  { url: "map/DZ2021.geo.json",  code_var: "DZ21_code" },
    Ward2014:{ url: "map/Ward2014.geo.json",code_var: "Ward_Code" },
    SOA:     { url: "map/SOA2011.geo.json", code_var: "SOA_CODE" },
    SA:      { url: "map/SA2011.geo.json",  code_var: "SA2011" },
    LCG:     { url: "map/HSCT.geo.json",    code_var: "TrustName" },
    UR2015:  { url: "map/UR2015.geo.json",  code_var: "UR_CODE" },
    SETTLEMENT:{ url:"map/UR2015.geo.json", code_var: "UR_CODE" },
    NUTS3:   { url: "map/NUTS3.geo.json",   code_var: "NUTS3" },
    ELB:     { url: "map/ELB.geo.json",     code_var: "ELB_Code" },
    COB_BASIC:{ url:"map/COB.geo.json",     code_var: "COB_BASIC" }
  }

  // Colour palette for charts
export const palette = ["#d6e4f6", "#8db2e0", "#3878c5", "#22589c", "#00205b"];
