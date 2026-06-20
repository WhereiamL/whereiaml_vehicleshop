#!/usr/bin/env node
// Fetch transparent vehicle thumbnails into web/images/<model>.png
//
// Source: https://github.com/matthias18771/v-vehicle-images (images/<model>.png)
// Images are served locally by the UI; nothing is fetched at runtime.
//
// Usage:
//   node scripts/fetch-images.js adder blista sultan      # specific models
//   node scripts/fetch-images.js --file models.txt        # one model per line
//   node scripts/fetch-images.js --all                    # every image in the source repo (~120MB)
//
// Re-run any time you add new vehicles to your catalog. Existing files are skipped
// unless you pass --force.

const fs = require('fs');
const path = require('path');
const https = require('https');

const RAW = 'https://raw.githubusercontent.com/matthias18771/v-vehicle-images/main/images';
const API = 'https://api.github.com/repos/matthias18771/v-vehicle-images/git/trees/main?recursive=1';
const OUT = path.join(__dirname, '..', 'web', 'images');

const args = process.argv.slice(2);
const force = args.includes('--force');
const all = args.includes('--all');

function get(url, asBuffer) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'whereiaml_vehicleshop' } }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(asBuffer ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')));
        }).on('error', reject);
    });
}

async function resolveModels() {
    if (all) {
        const tree = JSON.parse(await get(API, false));
        return tree.tree
            .map((e) => e.path)
            .filter((p) => p.startsWith('images/') && p.endsWith('.png'))
            .map((p) => p.slice('images/'.length, -'.png'.length));
    }
    const fileFlag = args.indexOf('--file');
    if (fileFlag !== -1 && args[fileFlag + 1]) {
        return fs.readFileSync(args[fileFlag + 1], 'utf8')
            .split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    }
    return args.filter((a) => !a.startsWith('--'));
}

(async () => {
    const models = await resolveModels();
    if (models.length === 0) {
        console.log('No models given. See usage at top of this file.');
        process.exit(1);
    }
    fs.mkdirSync(OUT, { recursive: true });
    let ok = 0, skip = 0, miss = 0;
    for (const model of models) {
        const dest = path.join(OUT, `${model}.png`);
        if (!force && fs.existsSync(dest)) { skip++; continue; }
        try {
            const buf = await get(`${RAW}/${model}.png`, true);
            fs.writeFileSync(dest, buf);
            ok++;
            process.stdout.write(`\r  fetched ${ok}  skipped ${skip}  missing ${miss}   `);
        } catch (e) {
            miss++;
        }
    }
    console.log(`\nDone. fetched=${ok} skipped=${skip} missing=${miss} -> ${OUT}`);
    if (miss > 0) console.log('Missing models have no image in the source repo; the UI falls back to a text card.');
})();
