/* Prints the running order and total length. Runs with plain node — no install
   needed — so the pacing can be settled before any footage exists.
       node showreel/plan.mjs */
import { readFileSync } from 'fs';
const src = readFileSync(new URL('./src/projects.ts', import.meta.url), 'utf8');

const num = (k) => Number(src.match(new RegExp(k + '\\s*=\\s*([\\d.]+)'))[1]);
const FPS = num('FPS'), TITLE = num('TITLE_SECONDS'), END = num('END_SECONDS');

const shots = [...src.matchAll(/\{\s*name:\s*'([^']+)',[\s\S]*?kind:\s*'(\w+)',\s*when:\s*'([^']+)',\s*seconds:\s*([\d.]+)([\s\S]*?)\}/g)]
  .map(m => ({ name: m[1], kind: m[2], when: m[3], seconds: +m[4],
               media: (m[5].match(/media:\s*'([^']*)'/) || [,''])[1] }));

const fmt = (s) => `${Math.floor(s/60)}:${String((s%60).toFixed(1)).padStart(4,'0')}`;
let t = TITLE;
console.log(`\n  RUNNING ORDER   ${FPS}fps\n`);
console.log(`  ${fmt(0).padStart(6)}  ${'TITLE CARD'.padEnd(34)} ${TITLE.toFixed(1)}s`);
for (const s of shots) {
  console.log(`  ${fmt(t).padStart(6)}  ${s.name.padEnd(34)} ${s.seconds.toFixed(1)}s  ` +
              `${s.kind.padEnd(14)} ${s.media ? 'media' : 'PLACEHOLDER'}`);
  t += s.seconds;
}
console.log(`  ${fmt(t).padStart(6)}  ${'END CARD'.padEnd(34)} ${END.toFixed(1)}s`);
t += END;
const frames = Math.round(t * FPS);
console.log(`\n  ${shots.length} projects  ·  total ${fmt(t)}  (${frames} frames)`);
console.log(`  missing footage: ${shots.filter(s=>!s.media).length}/${shots.length}\n`);
const overLong = t > 75;
if (overLong) console.log('  NOTE: over 75s — long for social; consider dropping shots.\n');
