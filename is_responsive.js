const puppeteer = require('puppeteer');
const fs = require('fs');

const check_help = 'Use -h to display the documentation'
const bad_argument = 'Bad argument.\n' + check_help
const missing_argument = 'Missing argument.\n' + check_help
const too_many_argument = 'Too many argument.\n' + check_help
const help = '\nChecks if websites are responsives or not...\n\n' +
	'Options: \n' +
	'-h, --help \n\t To display the manual\n' +
	'--file=<FILE> \n\t Useful to scan several url at the same time. The file must contain one URL per line\n' +
	'--url=<URL> \n\t To scan one url\n' +
	'--with-screenshot, --with-screenshot=no-responsive \n\t To take a screenshot of each URL. \n ' +
	'\t "no-responsive" value enables screenshot only if the website is not responsive.\n' +
	'\t All screenshots will be stored in "screens/" folder\n' +
	'--to-csv \n\t Output the results in a csv (output.csv)\n' +
	'--show-browser \n\t Show the browser while the script is running (the process runs in background by default)'

// Check arguments
var arguments = process.argv.slice();
arguments.shift(); // First argument is the path to node.exe
arguments.shift(); // Second argument is the path to this script

if (arguments.length === 0) {
	return console.error(missing_argument)
} else if (arguments.length > 4) {
	// Max 4 arguments
	return console.error(too_many_argument)
}

var is_file = false;
var is_url = false;
var with_screenshot = false;
var to_csv = false;
var show_browser = false;
var id = 1;

arguments.forEach(function(argument) {
	if (argument === '-h' || argument === '--help') {
		console.log(help);
		process.exit(0);
	}
	if (!argument.startsWith('--')) {
		console.error(bad_argument);
		process.exit(0);
	}
	if (argument.includes('=')) {
		// Option with value
		var option = argument.substring(
			argument.indexOf("-") + 2,
			argument.indexOf("=")
		);
		value = argument.substring(argument.indexOf('=') + 1);

		switch(option) {
			case 'file':
				is_file = true;
				source = value;
				break;
			case 'url':
				is_url = true;
				source = value;
				break;
			case 'with-screenshot':
				if (value === 'no-responsive' || value === 'not-responsive') {
					with_screenshot = 'no-responsive';
				}
				break;
			default:
				console.error(bad_argument);
				process.exit(0);
		}
	} else {
		// Option without value
		switch(argument) {
			case '--with-screenshot':
				with_screenshot = true;
				break;
			case '--to-csv':
				to_csv = true;
				break;
			case '--show-browser':
				show_browser = true;
				break;
			default:
				console.error(bad_argument);
				process.exit(0);
		}
	}
})

if ((is_file && is_url) || (!is_file && !is_url)) {
	return console.error(bad_argument);
}
if (is_file) {
	check_file(source, with_screenshot);
}
if (is_url) {
	check_url(source, with_screenshot);
}

async function check_file(file) {
	if (!fs.existsSync(file)) {
		return console.error('File does not exist');
	}
	const urls = fs.readFileSync(file).toString().split(/\r?\n/);

	const browser = await puppeteer.launch({ headless: !show_browser });
	const page = await browser.newPage();

	// Loop on all urls
	await console.log('\nresponsive ? \n');
	for (let i = 0; i < urls.length; i++) {
		await is_it_responsive(urls[i], page);
	}

	await browser.close();
	return process.exit();
}

async function check_url(url) {
	const browser = await puppeteer.launch({ headless: !show_browser });
	const page = await browser.newPage();

	await console.log('\nresponsive ? \n');
	await is_it_responsive(url, page);

	await browser.close()
	return process.exit();
}

async function is_it_responsive(url, page) {
	const device = puppeteer.devices['iPhone 6'];
	var path_to_screen = '';
	var error = '';

	if (!is_valid_url(url)) {
		console.error(url + ' \t\t not a valid url');
	} else {
		var is_responsive = '';
		try {
			var response = await page.goto(url, {timeout: 0});
			await page.waitForTimeout(100);
			// Puppeteer throw automatically an exception on ERR_NAME_NOT_RESOLVED.
			// If the url is accessible but return a 404, it does not...
			if (response._status === 404) {
				throw new Error('ERR_NAME_NOT_RESOLVED');
			}
			await page.emulate(device);
			await page.waitForTimeout(100);
			is_responsive = await page.evaluate(() => {
				return (document.body.scrollWidth - window.outerWidth) < 30
			});
		} catch (err) {
			error = err.message;
			if (error.includes('ERR_NAME_NOT_RESOLVED') || error.includes('ERR_CONNECTION_TIMED_OUT')) {
				is_responsive = '404';
			} else {
				is_responsive = err;
			}
		}

		if (!error) {
			if (with_screenshot === true || (with_screenshot === 'no-responsive' && !is_responsive)) {
				if (!fs.existsSync('./screens')) {
					fs.mkdirSync('./screens');
				}
				path_to_screen = 'screens/' + id + '_screenshot.png'
				await page.screenshot({path: path_to_screen});
			}
		}

		if (to_csv) {
			data = '';
			if (id === 1) {
				data = 'id, url, responsive';
				if (with_screenshot) {
					data += ', path to screen \n';
				} else {
					data += '\n';
				}
			}
			data += id + ',' + url + ',' + is_responsive;
			if (with_screenshot) {
				data += ',' + path_to_screen + '\n';
			} else {
				data += '\n';
			}
			fs.appendFile('output.csv', data, err => {
				if (err) {
					console.error(err);
					return process.exit(0);
				}
				// File written successfully
			})
		}
		id++;
		if (to_csv) {
			return await console.log(url + ' \t\t written in ./output.csv')
		} else {
			return await console.log(url + ' \t\t ' + is_responsive);
		}
	}
}

function is_valid_url(url) {
	var pattern = new RegExp('^(http(s)?:\\/\\/)[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&\'\\(\\)\\*\\+,;=.]+$')
	return pattern.test(url)
}