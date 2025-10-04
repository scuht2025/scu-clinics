/*
  Generates assets/logo.ico from available PNG sources in assets/.
  Uses png-to-ico which accepts multiple sizes for best results.
*/
const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

async function main() {
  const assetsDir = path.resolve(__dirname, '..', 'assets');
  const outputIcoPath = path.join(assetsDir, 'logo.ico');

  const candidatePngNames = [
    'icon-512.png',
    'icon_256x256.png',
    'icon_128x128.png',
    'icon_64x64.png',
    'icon_48x48.png',
    'icon_32x32.png',
    'icon_16x16.png',
  ];

  const existingPngPaths = candidatePngNames
    .map((name) => path.join(assetsDir, name))
    .filter((filePath) => fs.existsSync(filePath));

  if (existingPngPaths.length === 0) {
    console.log('[build-ico] No PNG sources found in assets/. Skipping ICO generation.');
    // If logo.ico already exists, treat as success; otherwise warn.
    if (fs.existsSync(outputIcoPath)) return;
    console.warn('[build-ico] assets/logo.ico does not exist and no PNG inputs were found.');
    return;
  }

  try {
    const icoBuffer = await pngToIco(existingPngPaths);
    fs.writeFileSync(outputIcoPath, icoBuffer);
    console.log(`[build-ico] Wrote ${path.relative(process.cwd(), outputIcoPath)} from ${existingPngPaths.length} PNGs.`);
  } catch (error) {
    console.error('[build-ico] Failed to generate ICO:', error);
    // Do not hard fail to avoid breaking builds when icon generation is non-critical
    process.exitCode = 0;
  }
}

main();


