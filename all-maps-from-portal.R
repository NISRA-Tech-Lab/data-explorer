library(jsonlite)
library(dplyr)

api_key <- "801aaca4bcf0030599c019f4efa8b89032e5e6aa1de4a629a7f7e9a86db7fb8c"

# Get themes from data portal ####

data_portal_nav <- jsonlite::fromJSON(
  "https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:%22PxStat.System.Navigation.Navigation_API.Read%22,%22params%22:%7B%22LngIsoCode%22:%22en%22%7D,%22id%22:1%7D"
  )

data_portal_structure <- data.frame(
  theme = character(),
  theme_code = numeric(),
  Subject = character(),
  subject_code = numeric()
)

themes <- data_portal_nav$result$ThmValue
theme_codes <- data_portal_nav$result$ThmCode

for (i in seq_along(themes)) {
  
  subjects <- data_portal_nav$result$subject[[i]]$SbjValue
  subject_codes <- data_portal_nav$result$subject[[i]]$SbjCode
  
  for (j in seq_along(subjects)) {

    data_portal_structure <- data_portal_structure %>% 
      bind_rows(
        data.frame(
          theme = themes[i],
          theme_code = theme_codes[i],
          Subject = subjects[j],
          subject_code = subject_codes[j]
          )
      )
    
  }
}

# Get list of tables from data portal ####

data_portal <- jsonlite::fromJSON(txt = "https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadCollection")$link$item

tables <- list()

for (i in 1:length(data_portal$label)) {
  if (any(c("AA", "LGD2014", "HSCT", "DEA2014") %in% unlist(data_portal$id[i]))) {

    time_var <- unlist(data_portal$role$time[i])
    time_series <- data_portal$dimension[[time_var]]$category$index[[i]]
    latest_date <- tail(time_series, 1)

    matrix <- data_portal$extension$matrix[i]

    fetch_error <- TRUE

    while (fetch_error) {

      json_data <- jsonlite::fromJSON(txt = paste0("https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:%22PxStat.Data.Cube_API.ReadDataset%22,%22params%22:%7B%22class%22:%22query%22,%22id%22:%5B%22TLIST(A1)%22%5D,%22dimension%22:%7B%22",
                                                   time_var, "%22:%7B%22category%22:%7B%22index%22:%5B%22", gsub(" ", "%20", latest_date, fixed = TRUE),
                                                   "%22%5D%7D%7D%7D,%22extension%22:%7B%22pivot%22:null,%22codes%22:false,%22language%22:%7B%22code%22:%22en%22%7D,%22format%22:%7B%22type%22:%22JSON-stat%22,%22version%22:%222.0%22%7D,%22matrix%22:%22",
                                                   matrix, "%22%7D,%22version%22:%222.0%22%7D%7D&apiKey=", api_key))

      fetch_error <- "error" %in% names(json_data)

      if (fetch_error) print(paste0("Error fetching ", data_portal$label[i], ". Trying again..."))

    }
    
    subject <- json_data$result$extension$subject$value
    
    if (subject == "Crime") subject <- "Recorded crime"
    
    theme <- data_portal_structure %>% 
      filter(Subject == subject)

    tables[[data_portal$extension$matrix[i]]] <- list(
      name = gsub("\u2013", "-", data_portal$label[i], fixed = TRUE),
      updated = as.Date(substr(data_portal$updated[i], 1, 10)),
      categories = unlist(data_portal$id[i]),
      statistics = json_data$result$dimension$STATISTIC$category$label,
      time = time_var,
      time_series = time_series,
      theme = theme$theme,
      theme_code = theme$theme_code,
      subject = subject,
      subject_code = theme$subject_code,
      product = json_data$result$extension$product$value,
      product_code = json_data$result$extension$product$code
    )
  }
}

tables <- tables[order(names(tables))]

write_json(tables, "data-portal-maps.json", auto_unbox = TRUE, pretty = TRUE)
