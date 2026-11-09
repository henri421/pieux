// Tests d'acceptation de l'interface pieux (PLAN-interface.md). A ne pas modifier.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { constatsAffichage, contenuBalise, definirLangue, texteVisible } from 'aedificium-ui';
import {
  ajouterCouche,
  ajouterProfil,
  lireSaisie,
  proposerRendement,
  relire,
  retirerCouche,
  retirerProfil,
  saisieParDefaut,
  serialiser,
  verifier,
  type Calcul,
  type Resultat,
  type Saisie,
} from '../../app/src/form';
import { coupe } from '../../app/src/dessin';
import { noteDuCalcul } from '../../app/src/note';
import { phrase } from '../../app/src/textes';
import { blocEntrees, blocsResultat, couchesHtml, entreesParSection, messageDErreur, verdictsHtml, voletsHtml } from '../../app/src/vue';

const lire = (c: string): string => readFileSync(fileURLToPath(new URL(c, import.meta.url)), 'utf8');
function calculer(s: Saisie): { calcul: Calcul; r: Resultat } {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  return { calcul: l.calcul, r: verifier(l.calcul) };
}
const refus = (s: Saisie): string => {
  const l = lireSaisie(s);
  if (l.ok) throw new Error('refus attendu');
  return l.message;
};
const def = saisieParDefaut;
const anb = (): Saisie => ({ ...def(), generation: '1re', profilNormatif: 'anb2022' });
const SAISIES: [string, Saisie][] = [
  ['defaut', def()],
  ['CC3 total', { ...def(), consequences: 'CC3', resistance: 'totale' }],
  ['1re DA1', { ...def(), generation: '1re' }],
  ['1re DA3', { ...def(), generation: '1re', approche1: 'DA3' }],
  ['ANB', anb()],
  ['traction', { ...def(), MQ: '4000' }],
  ['isole', { ...def(), nx: '1', ny: '1', MQ: '0' }],
  ['depasse', { ...def(), VG: '9000' }],
];

afterEach(() => definirLangue('fr'));

describe('T1 form', () => {
  it('le cas par defaut de la maquette', () => {
    const { calcul, r } = calculer(def());
    expect(calcul.donnees.pieu).toEqual({ D: 0.6, execution: 'fore' });
    expect(calcul.donnees.couches.map((c) => c.h)).toEqual([3, 5, 6]);
    expect(calcul.donnees.couches[2].qs).toEqual([80, 70, 75]);
    expect(calcul.donnees.qb).toEqual([2800, 2400, 2600]);
    expect(calcul.donnees.efforts).toEqual({ VG: 2000, VQ: 600, MG: 0, MQ: 400 });
    expect(r.generation).toBe(2);
    expect(r.combinaisons[0].nom).toBe('VC1');
  });
  it('virgule et point acceptes ; bascule de generation sans perte', () => {
    expect(calculer({ ...def(), D: '0.6' }).calcul.donnees.pieu.D).toBe(0.6);
    const s = { ...def(), D: '0,8', generation: '1re' as const };
    expect(s.D).toBe('0,8');
    expect(calculer(s).calcul.donnees.pieu.D).toBeCloseTo(0.8);
    expect(calculer(s).calcul.donnees.norme.generation).toBe(1);
  });
  it('ANB passe ses choix au noyau', () => {
    const n = calculer({ ...anb(), densiteCpt: '50', rigide: true }).calcul.donnees.norme;
    expect(n).toMatchObject({ generation: 1, profil: 'anb', densiteCpt: 50, rigide: true });
  });
  it('refus qui nomme le champ', () => {
    expect(refus({ ...def(), D: 'abc' })).toContain('D');
    const s = def();
    s.couches[1].qs[1] = '';
    expect(refus(s)).toContain('Argile');
  });
  it('couches et profils', () => {
    const c = ajouterCouche(def());
    expect(c.couches).toHaveLength(4);
    expect(c.couches[3].qs).toHaveLength(3);
    expect(retirerCouche(c, 3).couches).toHaveLength(3);
    const un = { ...def(), couches: def().couches.slice(0, 1) };
    expect(retirerCouche(un, 0).couches).toHaveLength(1);
    const p = ajouterProfil(def());
    expect(p.qb).toHaveLength(4);
    expect(p.couches.every((x) => x.qs.length === 4)).toBe(true);
    const r = retirerProfil(p);
    expect(r.qb).toEqual(def().qb);
    let u = def();
    for (let i = 0; i < 5; i++) u = retirerProfil(u);
    expect(u.qb).toHaveLength(1);
  });
  it('pas de mutation', () => {
    const s = def();
    ajouterProfil(s);
    ajouterCouche(s);
    expect(s).toEqual(def());
  });
  it('rendement propose', () => {
    expect(proposerRendement(def())).toBe('0,76');
  });
  it('aller-retour et format', () => {
    const s = ajouterProfil({ ...def(), D: '0,8' });
    expect(relire(serialiser(s))).toEqual(s);
    expect(JSON.parse(serialiser(s)).format).toBe('pieux/1');
    expect(() => relire('{"format":"autre/1"}')).toThrow();
  });
});

describe('T2 vue', () => {
  it.each(SAISIES)('%s : ni NaN ni souligne visible', (_n: string, s: Saisie) => {
    const { calcul, r } = calculer(s);
    const html = verdictsHtml(r) + voletsHtml(r);
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
    expect(texteVisible(html)).not.toContain('_');
    expect(blocsResultat(r).length).toBeGreaterThan(1);
    expect(blocEntrees(calcul).length).toBeGreaterThan(5);
  });
  it('groupes, cartes, gouvernant une fois', () => {
    const v = verdictsHtml(calculer(def()).r);
    for (const g of ['isole', 'groupe', 'service']) expect(v).toContain(`data-groupe="${g}"`);
    for (const c of ['compression', 'traction', 'groupe', 'tassement']) expect(v).toContain(`data-verification="${c}"`);
    expect(v.match(/gouvernant/g)).toHaveLength(1);
    expect(v).toContain('VC1');
  });
  it('depassement et pieu isole', () => {
    expect(verdictsHtml(calculer({ ...def(), VG: '9000' }).r)).toContain('depasse');
    const v = verdictsHtml(calculer({ ...def(), nx: '1', ny: '1', MQ: '0' }).r);
    expect(v).not.toContain('data-verification="groupe"');
  });
  it('volets : une ligne par profil, sources, hypotheses', () => {
    const { r } = calculer(def());
    const v = voletsHtml(r);
    expect(v.match(/data-profil=/g)).toHaveLength(3);
    expect(v.match(/data-file=/g)).toHaveLength(3);
    expect(v).toContain('tableau 6.10');
    expect(v).toContain('Converse-Labarre');
  });
  it('entrees : symboles uniques', () => {
    const e = entreesParSection(calculer(def()).calcul);
    const g = e.geometrie.map((l) => l.symbole);
    for (const x of ['D', 's', 'L']) expect(g).toContain(x);
    expect(e.materiaux.map((l) => l.symbole)).toContain('E_eq');
    for (const x of ['V_G', 'V_Q', 'M_G', 'M_Q']) expect(e.charges.map((l) => l.symbole)).toContain(x);
    const tous = [...g, ...e.materiaux.map((l) => l.symbole), ...e.charges.map((l) => l.symbole), ...e.hypotheses.map((l) => l.symbole)];
    expect(new Set(tous).size).toBe(tous.length);
  });
  it('couchesHtml : un champ par valeur', () => {
    const h = couchesHtml(def());
    expect(h.match(/data-couche="/g)!.length).toBeGreaterThanOrEqual(3);
    expect(h.match(/data-qs="/g)).toHaveLength(9);
    expect(h.match(/data-qb="/g)).toHaveLength(3);
    expect(h).toContain('data-action="retirer-couche"');
  });
  it('message d erreur', () => {
    expect(messageDErreur(new Error('Un seul'))).toContain('Un seul');
  });
});

describe('T3 dessin et note', () => {
  const compte = (svg: string, c: string): number => (svg.match(new RegExp(`class="${c}[ "]`, 'g')) ?? []).length;
  const opt = { cotes: true, bloc: true, planNeutre: true };
  it.each(SAISIES)('%s : SVG sans NaN', (_n: string, s: Saisie) => {
    const { calcul, r } = calculer(s);
    const svg = coupe(calcul, r, opt);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('viewBox');
    expect(svg).not.toMatch(/NaN|Infinity|undefined/);
  });
  it('elements du groupe', () => {
    const { calcul, r } = calculer(def());
    const svg = coupe(calcul, r, opt);
    expect(compte(svg, 'pieu')).toBe(3);
    expect(compte(svg, 'plan-pieu')).toBe(6);
    expect(compte(svg, 'zone-drag')).toBe(3);
    expect(compte(svg, 'couche')).toBeGreaterThanOrEqual(3);
    expect(compte(svg, 'semelle')).toBe(1);
  });
  it('options', () => {
    const { calcul, r } = calculer(def());
    const svg = coupe(calcul, r, { cotes: false, bloc: false, planNeutre: false });
    for (const c of ['cote', 'plan-neutre', 'bloc']) expect(compte(svg, c)).toBe(0);
    const t = coupe(calcul, r, opt);
    for (const c of ['cote', 'plan-neutre', 'bloc']) expect(compte(t, c)).toBeGreaterThan(0);
  });
  it('une seule echelle', () => {
    const { calcul, r } = calculer(def());
    const m = /class="pieu"[^>]*?width="([\d.]+)"[^>]*?height="([\d.]+)"/.exec(coupe(calcul, r, opt))!;
    expect(Number(m[2]) / Number(m[1])).toBeCloseTo(14 / 0.6, 0);
  });
  it.each(SAISIES)('%s : note complete, sans verdict global', (_n: string, s: Saisie) => {
    const { calcul, r } = calculer(s);
    const n = noteDuCalcul(calcul, r, { projet: 'P', element: '', date: '2026-11-08' });
    expect(n.cartouche.outil).toBe('pieux');
    expect(n.verifications.length).toBeGreaterThanOrEqual(r.combinaisons.length + 1);
    expect(JSON.stringify(n)).not.toMatch(/NaN|null,"lignes":\[\]/);
  });
});

describe('T1 page', () => {
  const page = lire('../../app/index.html');
  const main = lire('../../app/src/main.ts');
  it('titre, champs, zones, actions', () => {
    expect(contenuBalise(page, 'h1')).toBe('Pieux');
    for (const k of Object.keys(def())) {
      if (['couches', 'qb', 'generation'].includes(k)) continue;
      expect(page).toContain(`data-champ="${k}"`);
    }
    for (const a of ['data-generation="1re"', 'data-generation="2e"', 'data-groupe="1re"', 'data-groupe="2e"', 'data-si-profil="anb2022"', 'data-si-methode="modele-pieu"', 'data-si-methode="modele-terrain"']) expect(page).toContain(a);
    for (const r of ['erreur', 'couches', 'coupe', 'verdicts', 'volets', 'projet', 'element', 'ouvrir']) expect(page).toContain(`data-role="${r}"`);
    for (const a of ['exporter-note', 'exporter-coupe', 'exporter-resultats', 'enregistrer', 'reinitialiser', 'proposer-rendement', 'ajouter-couche', 'ajouter-profil', 'retirer-profil']) expect(page).toContain(`data-action="${a}"`);
    for (const o of ['cotes', 'bloc', 'planNeutre']) expect(page).toContain(`data-option="${o}"`);
    expect(page.indexOf('exporter-note')).toBeLessThan(page.indexOf('exporter-coupe'));
  });
  it('hors perimetre annonce, affichage propre', () => {
    const t = texteVisible(page);
    for (const m of ['transversal', 'radier', 'cyclique', 'fût']) expect(t).toContain(m);
    expect(constatsAffichage(t)).toEqual([]);
  });
  it('main.ts passe par les modules purs et ne calcule rien', () => {
    for (const f of ['lireSaisie(', 'verifier(', 'verdictsHtml(', 'voletsHtml(', 'couchesHtml(', 'coupe(', 'proposerRendement(', 'noteDuCalcul(', 'noteDeCalculHtml(', 'svgAutonome(', 'resultatsEnCsv(', 'ouvrirOuTelecharger(']) expect(main).toContain(f);
    expect(main).toContain("'pieux/saisie'");
    expect(main).not.toContain('verifierPieux');
    for (const f of [main, lire('../../app/src/vue.ts'), lire('../../app/src/note.ts'), lire('../../app/src/form.ts')]) expect(f).not.toMatch(/Math\.(tan|sin|cos|atan|exp|sqrt|log)/);
    const cfg = lire('../../vite.config.ts');
    expect(cfg).toContain('pieux');
    expect(cfg).not.toContain('renforce');
  });
});

describe('T4 anglais', () => {
  const en = lire('../../app/en/index.html');
  it('page anglaise', () => {
    expect(en).toContain('lang="en"');
    expect(contenuBalise(en, 'h1')).toBe('Piles');
    expect(constatsAffichage(texteVisible(en), { langue: 'en' })).toEqual([]);
  });
  it.each(SAISIES)('%s : rien de francais dans le rendu', (_n: string, s: Saisie) => {
    definirLangue('en');
    const { calcul, r } = calculer(s);
    const t = texteVisible(verdictsHtml(r) + voletsHtml(r) + coupe(calcul, r, { cotes: true, bloc: true, planNeutre: true }));
    expect(t).not.toMatch(/\b(tableau|valeur recommandée|gouvernant|pieu|Tassement|combinaison)\b/);
    expect(constatsAffichage(t, { langue: 'en' })).toEqual([]);
  });
  it('phrases du noyau traduites', () => {
    for (const a of ['Un seul profil : les facteurs de corrélation les plus défavorables s’appliquent.', 'Entraxe inférieur à 3 D : effets de groupe importants.', 'La pointe est dans une couche qui tasse.']) {
      definirLangue('en');
      expect(phrase(a)).not.toBe(a);
    }
  });
});
