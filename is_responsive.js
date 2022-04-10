const puppeteer = require('puppeteer');
const fs = require('fs');

const check_help = 'Use -h to display the documentation'
const bad_argument = 'Bad argument.\n' + check_help
const missing_argument = 'Missing argument.\n' + check_help
const too_many_argument = 'Too many argument.\n' + check_help
const help = '\nChecks if websites are responsives or not...\n\n' +
	'Options: \n' +
	'\t -h | --help \t to display the manual\n' +
	'\t --file=<FILE> \t useful to scan several url at the same time. The file must contain one URL per line\n' +
	'\t --url=<URL> \t to scan one url\n';

// Check arguments
if (process.argv.length <=2) {
	return console.error(missing_argument)
} else if (process.argv.length > 3) {
	return console.error(too_many_argument)
}
var argument = process.argv.slice(2)[0];
if (argument === '-h' || argument === '--help') {
	return console.log(help)
}
if (!argument.startsWith('--') || !argument.includes('=')) {
	return console.error(bad_argument)
}

var option = argument.substring(
	argument.indexOf("-") + 2,
	argument.lastIndexOf("=")
);
var value = argument.substring(argument.indexOf('=') + 1);

switch(option) {
	case 'file':
		return check_file(value)
	case 'url':
		return check_url(value);
	default:
		return console.error(bad_argument)
}

async function check_file(file) {
	if (!fs.existsSync(value)) {
		return console.error('File does not exist')
	}
	const urls = fs.readFileSync(file).toString().split(/\r?\n/);

	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	// Loop on all urls
	await console.log('\nresponsive ? \n');
	for (let i = 0; i < urls.length; i++) {
		await is_it_responsive(urls[i], page);
	}

	await browser.close()
	return process.exit();
}

async function check_url(url) {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	await console.log('\nresponsive ? \n');
	await is_it_responsive(url, page);

	await browser.close()
	return process.exit();
}

async function is_it_responsive(url, page) {
	const device = puppeteer.devices['iPhone 6']

	if (!is_valid_url(url)) {
		console.error(url + ' : not a valid url');
	} else {
		try {
			await page.goto(url, {timeout: 0});
			await page.waitForTimeout(200);
			await page.emulate(device);

			const is_responsive = await page.evaluate(() => {
				return (document.body.scrollWidth - window.outerWidth) < 30
			});

			await console.log(url + ' : ' + is_responsive);
		} catch (err) {
			await console.error(url + ' : 404');
		}
	}
}

function is_valid_url(url) {
	var pattern = new RegExp('^(http(s)?:\\/\\/)[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&\'\\(\\)\\*\\+,;=.]+$')
	return pattern.test(url)
}