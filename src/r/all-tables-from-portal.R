library(jsonlite)
library(dplyr)
library(here)

api_key <- "801aaca4bcf0030599c019f4efa8b89032e5e6aa1de4a629a7f7e9a86db7fb8c"

source(here("src/r/fetch_dataset.R"))

# Get themes from data portal ####

data_portal_nav <- jsonlite::fromJSON(
  txt =
    paste0(
      "https://ws-data.nisra.gov.uk/public/api.jsonrpc",
      "?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:%22",
      "PxStat.System.Navigation.Navigation_API.Read",
      "%22,%22params%22:%7B%22LngIsoCode%22:%22en%22%7D,%22id%22:1%7D"
    )
)

data_portal_structure <- data.frame(
  theme = character(),
  theme_code = numeric(),
  Subject = character(),
  subject_code = numeric(),
  product = character(),
  Product_code = character()
)

themes <- data_portal_nav$result$ThmValue
theme_codes <- data_portal_nav$result$ThmCode

for (i in seq_along(themes)) {

  subjects <- data_portal_nav$result$subject[[i]]$SbjValue
  subject_codes <- data_portal_nav$result$subject[[i]]$SbjCode

  for (j in seq_along(subjects)) {

    products <- data_portal_nav$result$subject[[i]]$product[[j]]$PrcValue
    product_codes <- data_portal_nav$result$subject[[i]]$product[[j]]$PrcCode

    for (k in seq_along(products)) {

      data_portal_structure <- data_portal_structure %>%
        bind_rows(
          data.frame(
            theme = themes[i],
            theme_code = theme_codes[i],
            Subject = subjects[j],
            subject_code = subject_codes[j],
            product = products[k],
            Product_code = product_codes[k]
          )
        )

    }

  }
}

# Get list of tables from data portal ####

data_portal <- jsonlite::fromJSON(
  txt =
    paste0(
      "https://ws-data.nisra.gov.uk/public/api.restful/",
      "PxStat.Data.Cube_API.ReadCollection"
    )
)$link$item

associated_tables <- read.csv("public/data/associated-tables.csv")

tables <- list()

for (i in seq_along(data_portal$label)) {

  time_var <- unlist(data_portal$role$time[i])
  time_series <- data_portal$dimension[[time_var]]$category$index[[i]]

  matrix <- data_portal$extension$matrix[i]

  json_data <- fetch_dataset(matrix, api_key, data_portal$label[i])

  subject <- json_data$extension$subject$value
  product_code <- json_data$extension$product$code

  name <- gsub("\u2013", "-", data_portal$label[i], fixed = TRUE)
  if (name == "Life Expectancy at age 65") name <- "Life Expectancy at Age 65"

  theme <- data_portal_structure %>%
    filter(Product_code == product_code)

  tables[[matrix]] <- list(
    name = name,
    updated = as.Date(substr(data_portal$updated[i], 1, 10)),
    categories = json_data$dimension,
    statistics = json_data$dimension$STATISTIC$category$label,
    time = time_var,
    time_series = time_series,
    theme = theme$theme,
    theme_code = theme$theme_code,
    subject = subject,
    subject_code = theme$subject_code,
    product = json_data$extension$product$value,
    product_code = product_code,
    rows = length(json_data$value)
  )

  associated_product_code <- associated_tables %>%
    filter(MtrCode == matrix) %>%
    pull("prc_code")


  if (length(associated_product_code) > 0) {

    for (j in seq_along(associated_product_code)) {

      associated_theme <- data_portal_structure %>%
        filter(Product_code == associated_product_code[j])

      tables[[paste0(matrix, "_", j)]] <- list(
        name = name,
        updated = as.Date(substr(data_portal$updated[i], 1, 10)),
        categories = json_data$dimension,
        statistics = json_data$dimension$STATISTIC$category$label,
        time = time_var,
        time_series = time_series,
        theme = associated_theme$theme,
        theme_code = associated_theme$theme_code,
        subject = associated_theme$Subject,
        subject_code = associated_theme$subject_code,
        product = associated_theme$product,
        product_code = associated_product_code[j],
        rows = length(json_data$value)
      )

    }

  }

}

tables <- tables[order(names(tables))]

write_json(tables, "public/data/data-portal-tables.json", auto_unbox = TRUE, pretty = TRUE)
