# Updating data on Black Thrive S\&S dashboard

There are four different data sources used to generate the S\&S dashboard.

1. [Boundaries](\#boundaries) used to display areas on the map view
1. [Boundary intersections](\#boundary-intersections) to link the areas together and to the relevant MP, PCC, and S\&S data
1. [MP and PCC data](\#mp-and-pcc-data) to display people on the area page
1. [Stop and Search data](\#boundary-intersections) the main data source

# Boundaries

You might also need to update the boundary data for the local authority districts (LAD), police force areas (PFA), and constituencies (PCON), especially after the 2024 General Election.

## LAD

This is done using the ./script/generate-local-authorities script and requires a GeoJSON file downloaded from the ONS.

The current boundaries used are:
[https://geoportal.statistics.gov.uk/datasets/ons::local-authority-districts-december-2022-boundaries-uk-bfe/about](https://geoportal.statistics.gov.uk/datasets/ons::local-authority-districts-december-2022-boundaries-uk-bfe/about)

An updated version might be:
[https://geoportal.statistics.gov.uk/datasets/ons::local-authority-districts-may-2024-boundaries-uk-bfe-2/about](https://geoportal.statistics.gov.uk/datasets/ons::local-authority-districts-may-2024-boundaries-uk-bfe-2/about)

When updating the data, you might need to update the script, specifically the jq mappings, e.g., the LAD22\* properties to LAD24\*.

## PFA

This is done using the ./script/generate-police-forces script and requires a GeoJSON file downloaded from the ONS.

The current boundaries used are:
[https://geoportal.statistics.gov.uk/datasets/ons::police-force-areas-december-2022-ew-bfe-2/about](https://geoportal.statistics.gov.uk/datasets/ons::police-force-areas-december-2022-ew-bfe-2/about)

An updated version might be:
[https://geoportal.statistics.gov.uk/datasets/ons::police-force-areas-december-2023-ew-bfe-2/about](https://geoportal.statistics.gov.uk/datasets/ons::police-force-areas-december-2023-ew-bfe-2/about)

When updating the data, you might need to update the script, specifically the jq mappings, e.g., the PFA22\* properties to PFA23\*.

## PCON

This is done using the ./script/generate-constituencies script and requires a GeoJSON file downloaded from the ONS.

The current boundaries used are:
[https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-december-2022-uk-bfe-1/about](https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-december-2022-uk-bfe-1/about) - this 404s and looks to be replaced with this version:
[https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-december-2022-boundaries-uk-bfe-v2-2/about](https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-december-2022-boundaries-uk-bfe-v2-2/about)

An updated version might be:
[https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-july-2024-boundaries-uk-bfe/about](https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-july-2024-boundaries-uk-bfe/about)

When updating the data, you might need to update the script, specifically the jq mappings, e.g., the PCON22\* properties to PCON24\*.

# Boundary intersections

The linked intersections between LAD, PFA, and PCON come from the ONS ArcGIS REST API service. In ./script/generate-database, we retrieve two datasets in JSON format.

The first links LAD22 to PCON22:
[https://ckan.publishing.service.gov.uk/dataset/ward-to-westminster-parliamentary-constituency-to-lad-to-utla-dec-2022-lookup-in-the-uk/resource/8df8a4a0-8088-446a-bbeb-dd099df2a8d0](https://ckan.publishing.service.gov.uk/dataset/ward-to-westminster-parliamentary-constituency-to-lad-to-utla-dec-2022-lookup-in-the-uk/resource/8df8a4a0-8088-446a-bbeb-dd099df2a8d0)
The query used is:
[https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/WD22\_PCON22\_LAD22\_UTLA22\_UK\_LU/FeatureServer/0/query?where=1%3D1\&outFields=LAD22CD,PCON22CD\&returnDistinctValues=true\&f=json](https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/WD22\_PCON22\_LAD22\_UTLA22\_UK\_LU/FeatureServer/0/query?where=1%3D1\&outFields=LAD22CD,PCON22CD\&returnDistinctValues=true\&f=json)

The second links LAD22 to PFA22:
[https://ckan.publishing.service.gov.uk/dataset/lad-to-community-safety-partnership-to-pfa-december-2022-lookup-in-ew/resource/0f7801ea-2902-4fd7-8035-9ee34193c2e5](https://ckan.publishing.service.gov.uk/dataset/lad-to-community-safety-partnership-to-pfa-december-2022-lookup-in-ew/resource/0f7801ea-2902-4fd7-8035-9ee34193c2e5)
The query used is:
[https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD22\_CSP22\_PFA22\_EW\_LU/FeatureServer/0/query?where=1%3D1\&outFields=PFA22CD,LAD22CD\&returnDistinctValues=true\&f=json](https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD22\_CSP22\_PFA22\_EW\_LU/FeatureServer/0/query?where=1%3D1\&outFields=PFA22CD,LAD22CD\&returnDistinctValues=true\&f=json)

If the boundaries are updated to newer versions, then these datasets will also need to be updated.

An updated version to link LAD24 to PCON24 might be:
[https://ckan.publishing.service.gov.uk/dataset/ward-to-westminster-parliamentary-constituency-to-lad-to-utla-july-2024-lookup-in-uk/resource/ab0479a2-fa3c-42e9-b160-893faddaf0a8](https://ckan.publishing.service.gov.uk/dataset/ward-to-westminster-parliamentary-constituency-to-lad-to-utla-july-2024-lookup-in-uk/resource/ab0479a2-fa3c-42e9-b160-893faddaf0a8)

An updated version to link LAD23 to PFA23 might be:
[https://ckan.publishing.service.gov.uk/dataset/lad-to-community-safety-partnership-to-pfa-december-2023-lookup-in-ew/resource/482feb8b-11d8-4e4d-a596-34608191388c](https://ckan.publishing.service.gov.uk/dataset/lad-to-community-safety-partnership-to-pfa-december-2023-lookup-in-ew/resource/482feb8b-11d8-4e4d-a596-34608191388c)
Note: this uses LAD23 instead of LAD24, so there might need to be an additional mapping needed.

When updating the datasets, you might need to update the ./script/generate-database script too, specifically SQL statements to insert data into the database, e.g., the LAD22CD, PCON22CD, and PFA22CD values which are returned from the queries above.

# MP and PCC data

Data for the MPs and Police and Crime Commissioners comes from Wikidata via two SPARQL queries. These queries are in ./script/generate-database. When the script is run, it will fetch the current position holder for the current areas from Wikidata, which is regularly updated with any changes.

Note: It does not take into account the PFA or PCON boundary data fetched in previous steps. I.E the SPARQL queries will fetch the representatives elected in the 2024 General Election even if 2022 boundaries are still used.

# Stop and Search data

The source data comes from the R-package, which is located here:
[https://github.com/BlackThrive/ExtractSS](https://github.com/BlackThrive/ExtractSS)

Specifically, these two files:
[https://github.com/BlackThrive/ExtractSS/blob/main/data/2023-08-21%20-%20LAD\_stop\_search\_all\_metrics\_2019-2021.csv](https://github.com/BlackThrive/ExtractSS/blob/main/data/2023-08-21%20-%20LAD\_stop\_search\_all\_metrics\_2019-2021.csv)
[https://github.com/BlackThrive/ExtractSS/blob/main/data/2023-08-23%20-%20PFA\_stop\_search\_all\_metrics\_2019-2021.csv](https://github.com/BlackThrive/ExtractSS/blob/main/data/2023-08-23%20-%20PFA\_stop\_search\_all\_metrics\_2019-2021.csv)

These are referenced in:
[https://github.com/mysociety/stop-and-search/blob/prototype/script/generate-database](https://github.com/mysociety/stop-and-search/blob/prototype/script/generate-database)

To update the data, you’ll need to:

1. Run the R-package to generate new versions of the LAD and PFA CSV data
1. Add these files to the ExtractSS git repository
1. Inside the stop-and-search repository, update the git submodule reference to the ExtractSS repo in ./vendor/ExtractSS by running: git submodule update
1. Update the generate-database reference to the corresponding CSV data
1. Run the ./script/generate-database script; this should result in changes to ./static/database.sqlite and ./static/database.version
1. Commit these changes to the repo and push to GitHub
1. There is a GitHub action set up to redeploy the site when the site is pushed to GitHub.
