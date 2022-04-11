# responsive_website_checker
NodeJS script (using Puppeteer) that scans a list of websites URLs to determine if they exist and if they are responsives or not. It is also possible to take a screenshot, etc.

## How does it works
The scripts uses Puppeteer to navigate to the given url. It simulates a smartphone navigation.
Then it compares the width of the page content with the width of the screen. If the page content is larger than the screen, it means that the site is not responsive.

## Installation
```
npm install
```
To install Puppeteer library.

## How to use it
```
node is_responsive.js -h
```
Run this command to show the manual.

### Options
- **-h | --help**
    
    Show the manual.
- **--file=_file_**
    
    Use it to scan several URLs at the same time. The file must contains one URL per line.
- **--url=_url_**
    
    Use it to scan only one URL.
- **--with-screenshot**
    
    Add this option the take a screenshot of each website.
    All screens will be stored in ./screens folder
- **--with-screenshot=no-responsive**
    
    If you add "no-responsive" to the this option, it will only take a screenshot if the website is not responsive.
- **--to-csv**
    
    Use it to output the results in a CSV file (./output.csv)
- **--show-browser**
    
    Show the browser while the script is running (the process runs in background by default)

**You must at least use the --file or --url option to run the script**

## Error handling
Errors are thrown if the website does not respond correctly (e.g. 404, certificate error, timeout, etc.) but the script keeps running. Errors will be written as an output.
