// Rendered-DOM checks for the four "Interrogatorio directo" entries (LAW-0289..0292, hearings-03). The pilot and
// hearings-02 checks (./apertura-audiencia-checks.js, ./exposicion-inicial-checks.js) are imported read-only; this file
// adds the motif's own: no examination rule or assessment in any text, and the es words.
import {test, expect} from '@playwright/test';
import {forAll} from './apertura-audiencia-checks.js';

export const report3 = (ID, name, stats) => console.log(`[hearings-03] ${ID} ${name}: ${JSON.stringify(stats)}`);

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Participant', 'Exhibit', 'Room', 'fictional', 'supplied', 'Sequence', 'Witness', 'witness', 'Questioner', 'Question', 'Answer', 'Open', 'Bounded', 'rail', 'Rail', 'tray', 'lectern', 'Lectern', 'clock', 'configured', 'conclusion', 'Changed', 'Order', 'shown', 'turn', 'Turn'];

/**
 * No text states an examination rule or assesses a turn, a witness or an answer: no leading-question rule, objection,
 * admissibility, credibility, weight, sufficiency or outcome (open question / bounded answer are supplied forms only).
 */
export function examinationFreeTest(ID) {
  test(`${ID}: no text states an examination rule or assesses a turn (leading, objection, admissibility, credibility, weight, outcome)`, async ({page}) => {
    test.setTimeout(400000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = /(leading|sugestiv|objection|objeci[oó]n|objected|sustain|overrul|admissib|admisib|inadmis|credib|cre[ií]ble|believ|reliab|fiable|weight|peso\\b|sufficien|suficien|proven|probad[oa]s?\\b|true\\b|false\\b|verdader|fals[oa]|honest|lying|mient|evasive|evasiv|improper|impropi|allowed|permitid|not allowed|must\\b|debe\\b|correct\\b|incorrect|correct[oa]s?\\b|better|mejor\\b|worse|peor\\b|stronger|weaker|m[aá]s fuerte|m[aá]s d[eé]bil)/i;
      for (const u of [0, 0.3, 0.6, 0.8, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 50) + '"');
      }
      return [...new Set(out)];`, {}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px). */
export const FLOOR_FOR = "if (ratio !== '1:1') return 60; return preset.replace(' (labels hidden)', '') === 'long-labels-stress' ? 45 : 55;";
