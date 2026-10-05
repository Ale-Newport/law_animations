// LAW-0193 — Consulta de expediente por auxiliar · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion, object anchoring and a transformation that stays
// recognizable with labels hidden (checked on semantic state, which does not depend on text).
// Windows (LAW-0193.js W): hand to the tabs 0.15–0.185 · along the tabs 0.185–0.25 · pinch 0.25–0.265 ·
// swing out about its top edge 0.265–0.285 · carry sideways past the plate post, down and across to the hand-off 0.285–0.37 (right hand arrives 0.33–0.37) · both hold 0.37–0.385 ·
// right hand lays it on the desk 0.385–0.43 · to the cover tab 0.43–0.45 · open 0.45–0.49 · read 0.50–0.58 ·
// to the tab 0.58–0.60 · close 0.60–0.63 · to the edge 0.63–0.645 · stand it up 0.645–0.68 (left hand arrives
// 0.655–0.68) · hand-off back 0.68–0.69 · carry back (across, up beside the cabinet, sideways into its own band) 0.69–0.745 · swing upright into the slot 0.745–0.765 · release
// 0.765–0.80 · notes 0.80–0.85, hold.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0193';

contractSuite(ID, {
  continuity: ['handL', 'handR', 'piece'],
  attach: [
    // the piece hangs from the SOLVED left hand by its tab while it is lifted out and carried
    {from: 0.266, to: 0.384, a: 'handL', b: 'gripL', tol: 1.5},
    // the right hand holds it by its edge from the hand-off to the desk, and back
    {from: 0.371, to: 0.429, a: 'handR', b: 'gripR', tol: 1.5},
    {from: 0.646, to: 0.689, a: 'handR', b: 'gripR', tol: 1.5},
    // the cover follows the right hand on its tab while it is opened and closed
    {from: 0.451, to: 0.489, a: 'handR', b: 'gripR', tol: 1.5},
    {from: 0.601, to: 0.629, a: 'handR', b: 'gripR', tol: 1.5},
    // the left hand carries it back and slides it into its slot
    {from: 0.681, to: 0.764, a: 'handL', b: 'gripL', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.pieceAt === 'slot' && s.slotOfTarget !== null && s.bubble === 0 && s.slots.every(x => x !== null)", label: 'rest: every piece in its numbered slot; nothing asked yet'},
    {at: 0.12, fn: "s.bubble === 1 && s.bubbleWords === 1 && s.pieceAt === 'slot'", label: 'the requester asks (the bubble opens, then its words) before anything moves'},
    {at: 0.22, fn: "s.phase === 'run' && s.openL === 1 && s.pieceAt === 'slot'", label: 'the open hand runs along the tabs'},
    {at: 0.29, fn: "s.pieceAt === 'hand' && s.holder === 'l' && s.slots.includes(null) && s.foreignSlots.length === 0", label: 'the pinched piece is drawn out of its slot sideways (over no other slot); the slot is empty'},
    {at: 0.34, fn: "s.pieceAt === 'hand' && s.holder === 'l' && s.faceClear", label: 'carried by the left hand below the face'},
    {at: 0.38, fn: "s.handoff && s.gripL && s.gripR", label: 'hand-off: both hands hold the piece at a shared point'},
    {at: 0.44, fn: "s.pieceAt === 'desk' && !s.coverOpen && s.cover > 0.5", label: 'laid on the desk, closed'},
    {at: 0.54, fn: "s.pieceAt === 'desk' && s.coverOpen && s.reading && s.tilt < -2", label: 'open on the desk; the assistant bows the head and reads'},
    {at: 0.7, fn: "s.pieceAt === 'hand' && s.holder === 'l'", label: 'carried back by the left hand'},
    {at: 0.8, fn: "s.pieceAt === 'slot' && s.slotOfTarget === s.slots.indexOf(s.slotOfTarget) && s.slots.every(x => x !== null) && s.phase === 'returned'", label: 'main action complete by 0.8: the piece is back in its own numbered slot'},
    {at: 1, fn: "s.beat === 'hold' && s.finalState === 'returned' && s.notesShown === 1 && s.allReached && s.labelsFit", label: 'hold: supplied final state, notes shown, layout fits'},
    {at: 0.3, fn: "s.slotOfTarget === null && s.targetNumber === 3", label: 'the requested number drives which piece is taken'},
    {at: 1, params: {finalState: 'open-on-desk'}, fn: "s.pieceAt === 'desk' && s.coverOpen && s.slots.includes(null) && s.notesShown === 1", label: 'supplied final state open-on-desk: the piece stays open on the desk, its slot empty'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.pieceAt !== 'slot'", label: 'actionProgress freezes the action part-way'},
    {at: 0.54, params: {textVisibility: 'none'}, fn: "s.pieceAt === 'desk' && s.coverOpen && s.reading", label: 'labels hidden: the same take-out, lay-open and reading'},
    {at: 0.29, params: {textVisibility: 'none'}, fn: "s.slots.includes(null) && s.holder === 'l'", label: 'labels hidden: the slot visibly empties'},
    {at: 0.3, params: {props: {pieces: [{number: 1, title: 'A'}, {number: 2, title: 'B'}, {number: 3, title: 'C'}, {number: 4, title: 'D'}, {number: 5, title: 'E'}], target: 5, request: 'Piece 5, please'}}, fn: "s.targetNumber === 5 && s.slots[4] === null", label: 'a different requested number takes a different piece'},
  ],
});

// Every preset × ratio × labels shown / hidden: the carried or lying piece never covers the assistant's face, the
// bubble never covers a face, every hand reaches its target, the layout fits.
ratioChecks(ID, 'faces clear, reach, layout', [
  {at: times(0.15, 0.85, 0.01), fn: 's.faceClear && s.bubbleClear && s.allReached', label: 'no piece or bubble over a face; every hand on its target'},
  {at: [1], fn: 's.labelsFit', label: 'layout fits without cut text'},
  // review round 1: out and back the carried piece never passes over another compartment (no wrong-slot reading)
  {at: times(0.25, 0.8, 0.005), fn: 's.foreignSlots.length === 0', label: 'the carried piece never covers another compartment’s strip band'},
]);

suppliedTextSuite(ID, {
  fields: 'return [...p.actors.map(a => a.name), p.actorLabels.assistant || p.roles.assistant, p.actorLabels.requester || p.roles.requester, ...p.props.pieces.map(q => q.title), p.props.request, p.objectLabels.cabinet, ...p.annotations.map(a => a.text), ...p.relationships.map(r => r.label)]',
  content: 'return [...p.actors.map(a => a.name), ...p.props.pieces.map(q => q.title), p.props.request]',
  captions: 'return ["as supplied", "según lo aportado", "Piece back in its", "Pieza devuelta"]',
});

// Rendered (every preset × ratio, labels shown): at sampled times through the action, no bubble, card, chip or
// carried piece intersects a head; the relation caption is beside its own line (≤ 40 px at 1080p); no line (the
// relation link or a callout leader) passes through a text box other than its own chip.
test.describe(`${ID} rendered layout checks`, () => {
  test(`${ID}: heads uncovered; caption beside its link; links and leaders cross no text`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const k = 1080 / Math.min(w, h) / svg.getScreenCTM().a;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          const R = e => e.getBoundingClientRect();
          const inter = (a, b, p = 0) => a.left < b.right - p && a.right > b.left + p && a.top < b.bottom - p && a.bottom > b.top + p;
          const tag = `${pr.name} ${ratio}`;
          for (const u of [0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.75, 1]) {
            x.seek(u * x.durationMs);
            const heads = ['st-A-head', 'st-V-head'].map(n => svg.querySelector(`[data-node="${n}"]`)).filter(Boolean).map(R);
            const covers = [...svg.querySelectorAll('[data-node="st-bub-body"], [data-node^="note"][data-node$="-chip"], [data-node="chipA"], [data-node="chipV"], [data-node="rel-label"], [data-node="state-tag"], [data-node="key"]')]
              .filter(e => eff(e) > 0.05);
            for (const f of svg.querySelectorAll('[data-node^="st-p"][data-node$="-f"]')) if (eff(f) > 0.05) covers.push(f);
            for (const c of covers) for (const hd of heads) if (inter(R(c), hd, 1)) out.push(`${tag} u=${u}: ${c.getAttribute('data-node')} covers a head`);
          }
          x.seek(x.durationMs);
          const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.05 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
          const line = svg.querySelector('[data-node="rel-line"]');
          const lab = svg.querySelector('[data-node="rel-label"]');
          if (line && lab && eff(lab) > 0.5) {
            const L = line.getTotalLength(), m = line.getScreenCTM();
            const pts = Array.from({length: 60}, (_, i) => line.getPointAtLength(L * i / 59).matrixTransform(m));
            const b = R(lab);
            const d = Math.min(...pts.map(q => Math.hypot(Math.max(b.left - q.x, 0, q.x - b.right), Math.max(b.top - q.y, 0, q.y - b.bottom)))) * k;
            if (d > 40) out.push(`${tag}: link caption ${d.toFixed(1)} px from its line`);
            for (const t of texts) {
              if (lab.contains(t)) continue;
              const tb = R(t);
              if (pts.slice(3, -3).some(q => q.x > tb.left && q.x < tb.right && q.y > tb.top && q.y < tb.bottom)) out.push(`${tag}: link crosses "${t.textContent.slice(0, 24)}"`);
            }
          }
          for (const lead of svg.querySelectorAll('[data-node^="note"][data-node$="-lead"]')) {
            if (eff(lead) < 0.05) continue;
            const grp = lead.parentNode;
            const m = lead.getScreenCTM();
            const A = new DOMPoint(+lead.getAttribute('x1'), +lead.getAttribute('y1')).matrixTransform(m);
            const B = new DOMPoint(+lead.getAttribute('x2'), +lead.getAttribute('y2')).matrixTransform(m);
            const len = Math.hypot(B.x - A.x, B.y - A.y) * k;
            if (len > 140) out.push(`${tag}: leader ${grp.getAttribute('data-node')} is ${len.toFixed(0)} px long`);
            const pts = Array.from({length: 30}, (_, i) => ({x: A.x + (B.x - A.x) * (0.06 + 0.86 * i / 29), y: A.y + (B.y - A.y) * (0.06 + 0.86 * i / 29)}));
            for (const t of texts) {
              if (grp.contains(t)) continue;
              const tb = R(t);
              if (pts.some(q => q.x > tb.left && q.x < tb.right && q.y > tb.top && q.y < tb.bottom)) out.push(`${tag}: leader crosses "${t.textContent.slice(0, 24)}"`);
            }
          }
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Review round 1: (a) through the whole action no text of a piece intersects another visible text (the carried
// piece's title never garbles another title); (b) at the hold no card body (note, chip, tag, key) covers a text
// that is not its own.
test.describe(`${ID} rendered text integrity`, () => {
  test(`${ID}: piece texts never overlap other texts; card bodies cover no foreign text`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          const R = e => e.getBoundingClientRect();
          const inter = (a, b, p = 1) => a.left < b.right - p && a.right > b.left + p && a.top < b.bottom - p && a.bottom > b.top + p;
          const tag = `${pr.name} ${ratio}`;
          const vis = () => [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.05 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]') && R(t).width > 0);
          for (let u = 0.25; u <= 0.8 + 1e-9; u += 0.005) {
            x.seek(u * x.durationMs);
            const ts = vis();
            const pieceTexts = ts.filter(t => t.closest('[data-node^="st-p"]'));
            for (const a of pieceTexts) {
              const ga = a.closest('[data-node^="st-p"]');
              for (const b of ts) {
                if (b === a || ga.contains(b)) continue;
                if (inter(R(a), R(b))) out.push(`${tag} u=${u.toFixed(3)}: "${a.textContent.slice(0, 18)}" overlaps "${b.textContent.slice(0, 18)}"`);
              }
            }
          }
          x.seek(x.durationMs);
          const ts = vis();
          const bodies = [...svg.querySelectorAll('[data-node^="note"][data-node$="-chip"], [data-node="chipA"], [data-node="chipV"], [data-node="rel-label"], [data-node="state-tag"], [data-node="key"], [data-node="st-bub-body"]')].filter(e => eff(e) > 0.05);
          for (const body of bodies) {
            const shapes = [...body.querySelectorAll('path, rect')].filter(e => eff(e) > 0.05).map(R).filter(b => b.width > 0);
            for (const t of ts) {
              if (body.contains(t)) continue;
              // only a body drawn above the text hides it
              if (!(t.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
              if (shapes.some(b => inter(b, R(t)))) out.push(`${tag}: ${body.getAttribute('data-node')} covers "${t.textContent.slice(0, 20)}"`);
            }
          }
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
