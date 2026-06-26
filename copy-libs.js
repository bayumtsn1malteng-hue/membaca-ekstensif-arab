const fs = require('fs');
const path = require('path');

const libs = [
  {
    src: './node_modules/dexie/dist/dexie.js',
    dest: './js/dexie.js'
  },
  {
    src: './node_modules/dexie/dist/dexie.mjs',
    dest: './js/dexie.mjs'
  }
];

libs.forEach(lib => {
  const srcPath = path.join(__dirname, lib.src);
  const destPath = path.join(__dirname, lib.dest);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`[LIB] Copied ${path.basename(srcPath)} to ${path.dirname(destPath)}`);
  } else {
    console.error(`[ERROR] Library not found at ${srcPath}. Did you run npm install?`);
  }
});