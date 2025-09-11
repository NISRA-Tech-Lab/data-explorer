# NISRA Data Explorer

This repository contains the source code and assets for the **NISRA Data Explorer** web application.  
The app provides an interactive interface for browsing, visualising, and downloading official statistics.

---

## 📁 Project Structure

assets/ _Static front-end assets_\
├── css/ _Stylesheets_\
│ └── styles.css _Custom CSS for layout, typography, branding_\
└── img/ _Images and icons_\
├── icon/ _Favicons and Apple/Android touch icons_\
└── logo/ _Logos and social media icons_

public/ _Publicly served data and maps_\
├── data/ _Data files generated externally_\
│ ├── associated-tables.csv\
│ └── data-portal-tables.json _Main JSON powering menus & search_\
└── map/ _GeoJSON boundaries for maps_\
├── AA.geo.json\
├── LGD2014.geo.json\
└── … (other geography files)

src/ _Application source code_\
├── config/ _App-wide configuration_\
│ └── config.js _Default settings and geography properties_\
├── utils/ _Modular JavaScript utilities_\
│ ├── createMenus.js _Build dropdown menus from JSON_\
│ ├── elements.js _Central place for DOM element refs_\
│ ├── fillMenus.js _Logic to populate menu options_\
│ ├── firstKey.js _Helper to return first key of object_\
│ ├── getColour.js _Map data → colour scale for maps_\
│ ├── initSideBarPersistence.js _Persists sidebar open/closed state_\
│ ├── loadShapes.js _Fetch & cache GeoJSON map layers_\
│ ├── loadTables.js _Fetch & cache tables JSON (with TTL)_\
│ ├── mapSelections.js _Handle selection state & calls plotMap_\
│ ├── plotMap.js _Main map + chart rendering logic_\
│ ├── quantile.js _Helper for quintile calculations_\
│ ├── sortObject.js _Recursively sort nested objects_\
│ ├── syncDraggingToZoom.js _Leaflet: control drag based on zoom_\
│ ├── titleCase.js _Utility to normalise labels/titles_\
│ ├── wireSearch.js _Global search input wiring_\
│ ├── wrapLabel.js _Line wrapping for axis labels_\
│ └── yAxisLabelPlugin.js _Chart.js plugin for Y-axis label drawing_\
├── index.js _Main entrypoint (imports and wires everything)_\
└── r/ _R scripts for data preparation_\
└── all-tables-from-portal.R _Downloads & builds data-portal-tables.json_

index.html _Main HTML document_\
data portal maps.Rproj _RStudio project file for working with R scripts_

---

## 🔑 Key Concepts

- **`index.html`** is the only HTML page; it loads `src/index.js` (ES module).
- **`src/index.js`** is the coordinator: imports modules from `utils/`, wires events, and bootstraps the app.
- **`utils/`** contains small single-purpose modules. Each utility handles a well-defined task (menus, search, maps, charts).
- **`public/data/`** and **`public/map/`** are data sources fetched at runtime by the browser.  
  - `data-portal-tables.json` is regenerated regularly by the R script.
  - `map/*.geo.json` provides geography shapes for Leaflet maps.
- **`assets/`** contains branding resources (CSS, images, icons). These don’t change dynamically.
- **`src/r/all-tables-from-portal.R`** is run by GitHub Actions to refresh `data-portal-tables.json`.

---

## ⚙️ Workflow

1. **Development**
   - Edit `index.html`, `src/` JS modules, or `assets/css/styles.css`.
   - Static data (e.g. JSON, GeoJSON) lives under `public/`.

2. **Data refresh**
   - The R script `src/r/all-tables-from-portal.R` pulls the latest table metadata.
   - A GitHub Actions workflow runs this script on schedule and commits updates.

3. **Deployment**
   - Serve the root directory (`index.html`) through a static site host (e.g. GitHub Pages, Netlify).
   - Ensure `public/` and `assets/` are both accessible.

---

## 🧭 Conventions

- **CSS**: Custom styles live in `assets/css/styles.css`.
- **Images**:  
  - `assets/img/logo/` → logos and social icons  
  - `assets/img/icon/` → favicons and app icons  
- **Modules**: Use ES modules (`export` / `import`) for reusability.
- **Data**: Place static/fetched data under `public/`.

---

## 🚀 Getting Started

### Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/) installed
- [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for VS Code

### Run locally
1. Open **VS Code**. In the **Welcome** tab, click **Clone Git Repository**.  
   - Paste in the repository URL (e.g. `https://github.com/NISRA-Tech-Lab/data-portal-maps`).  
   - Choose a local folder where you want the project saved.  
   - Once the clone finishes, VS Code will ask if you want to open the project — click **Open**.

2. In VS Code, make sure you can see `index.html` in the Explorer sidebar.  
   (All files such as `assets/`, `public/`, and `src/` should also be visible there.)

3. Start the local development server by clicking the **Go Live** button in the bottom-right corner of the VS Code window.  
   - This launches the **Live Server** extension.  
   - A browser window will open (usually at `http://127.0.0.1:5500/`) with the Data Explorer running locally.

4. Any changes you make to HTML, CSS, or JavaScript files will automatically reload in the browser.

---

### Notes
- `public/data/data-portal-tables.json` is required for menus and search to work. If you’re running without the GitHub Action refresh, make sure this file exists.
- Leaflet maps rely on the GeoJSON files in `public/map/`.

---

