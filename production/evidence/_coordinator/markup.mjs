// Coordinator helper: dump the exact SVG markup of IDs at their QA keyframes
// (3 ratios × presets incl. es) to a JSON file, for before/after diffs.
//   node production/scratch/coord/markup.mjs out.json LAW-0004,LAW-0008
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {withServer} from '../../../scripts/shot.mjs';

const [out, idList] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const catalog = new Map(fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)).map(e => [e.id, e]));
const KEY = {story: [0.05, 0.3, 0.5, 0.68, 1], mechanism: [0.12, 0.35, 0.55, 0.72, 1], contrast: [0.1, 0.3, 0.55, 0.72, 1], inspect: [0.1, 0.4, 0.6, 0.8, 0.9, 0.95, 1]};
const result = {};
const browser = await chromium.launch();
try {
  await withServer(async base => {
    const page = await browser.newPage({viewport: {width: 800, height: 600}});
    await page.goto(`${base}/tests/harness/host.html`);
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    for (const id of idList.split(',')) {
      const e = catalog.get(id);
      const presets = JSON.parse(fs.readFileSync(path.join(root, e.output.presets), 'utf8')).presets;
      const ts = KEY[e.treatment] || KEY.story;
      result[id] = await page.evaluate(async ([id, presets, ts]) => {
        const def = await window.__lib.load(id);
        const rec = {};
        for (const p of [{name: 'default', params: {}}, ...presets]) {
          for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
            for (const tv of ['all', 'none']) {
              const el = document.createElement('div');
              document.body.appendChild(el);
              const inst = def.create(el, {width: w, height: h, instanceId: 'mk', params: {...p.params, textVisibility: tv}});
              await inst.ready;
              for (const t of ts) { inst.seek(t * inst.durationMs); rec[`${p.name}|${w}x${h}|${tv}|${t}`] = inst.element.outerHTML; }
              inst.destroy(); el.remove();
            }
          }
        }
        return rec;
      }, [id, presets, ts]);
      console.log(id, Object.keys(result[id]).length, 'frames');
    }
  });
} finally { await browser.close(); }
fs.writeFileSync(out, JSON.stringify(result));
