const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const swPath = path.join(__dirname, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Update SW_VERSION and CACHE_NAME strings using Regex
swContent = swContent.replace(/const SW_VERSION = '.*?';/, `const SW_VERSION = 'v${pkg.version}';`);
swContent = swContent.replace(/const CACHE_NAME = '.*?';/, `const CACHE_NAME = 'meb-cache-v${pkg.version}';`);

fs.writeFileSync(swPath, swContent);

console.log(`[BUMP] Service Worker updated to version ${pkg.version}`);
console.log(`[BUMP] Cache name updated to meb-cache-v${pkg.version}`);