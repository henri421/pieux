// Tests d'acceptation de l'onglet Transversal (PLAN-transversal.md, T2 a T4). Ecrits par Claude
// le 20/11/2026. Purs (aucun jsdom). A ne pas modifier.
import { describe, expect, it } from 'vitest';
import {
  lireSaisie,
  lireTransversal,
  relire,
  saisieParDefaut,
  serialiser,
  verifierTr,
  type Saisie,
} from '../../app/src/form';
import { noteTransversale } from '../../app/src/note';
import { dessinTransversal } from '../../app/src/dessin';

const cartouche = { projet: 'P', element: 'E', date: '2026-11-20' };

function calcul(s: Saisie) {
  const l = lireTransversal(s);
  if (!l.ok) throw new Error(l.message);
  return l.calcul;
}

describe('T2 saisie transversale', () => {
  it('par defaut : onglet axial, valeurs de la maquette pour le transversal', () => {
    const s = saisieParDefaut();
    expect(s.mode).toBe('axial');
    expect([s.EI, s.tete, s.zNappe, s.fluage, s.MRd]).toEqual(['190852', 'libre', '3', false, '']);
    expect([s.HtG, s.HtQ, s.MtG, s.MtQ, s.NtG, s.NtQ]).toEqual(['60', '40', '0', '0', '800', '300']);
    expect(s.couches.map((c) => [c.gamma, c.gammaSat, c.comportement, c.phi, c.c, c.cu, c.yf])).toEqual([
      ['18', '20', 'draine', '30', '0', '', 'grenu'],
      ['19', '19', 'non-draine', '', '', '50', 'fin-court'],
      ['20', '21', 'draine', '35', '0', '', 'grenu'],
    ]);
  });
  it('lecture : donnees du noyau (drainé : c_u ignoré ; non drainé : phi et c ignorés)', () => {
    const d = calcul(saisieParDefaut()).donnees;
    expect([d.D, d.EI, d.tete, d.zNappe, d.fluage, d.MRd]).toEqual([0.6, 190852, 'libre', 3, false, null]);
    expect(d.efforts).toEqual({ HG: 60, HQ: 40, MG: 0, MQ: 0, NG: 800, NQ: 300 });
    expect(d.couches).toEqual([
      { nom: 'Remblai', h: 3, gamma: 18, gammaSat: 20, comportement: 'draine', phi: 30, c: 0, cu: 0, yf: 'grenu' },
      { nom: 'Argile', h: 5, gamma: 19, gammaSat: 19, comportement: 'non-draine', phi: 0, c: 0, cu: 50, yf: 'fin-court' },
      { nom: 'Sable', h: 6, gamma: 20, gammaSat: 21, comportement: 'draine', phi: 35, c: 0, cu: 0, yf: 'grenu' },
    ]);
    const l = lireSaisie(saisieParDefaut());
    expect(l.ok && JSON.stringify(d.norme) === JSON.stringify(l.calcul.donnees.norme)).toBe(true);
  });
  it('verifierTr : le noyau sur le cas par defaut', () => {
    const r = verifierTr(calcul(saisieParDefaut()));
    expect(r.MEd.combinaison).toBe('(a)');
    expect(Math.abs(r.MEd.valeur - 338.8718158885779) / 338.87).toBeLessThan(1e-4);
  });
  it('refus nommant la couche et le champ ; DA2 refuse par le noyau', () => {
    const s = saisieParDefaut();
    s.couches[1].cu = 'x';
    const l = lireTransversal(s);
    expect(l.ok).toBe(false);
    if (!l.ok) expect(l.message).toContain('Argile');
    const e = saisieParDefaut();
    e.EI = '';
    expect(lireTransversal(e).ok).toBe(false);
    const da2 = { ...saisieParDefaut(), generation: '1re' as const, approche1: 'DA2' };
    expect(() => verifierTr(calcul(da2))).toThrow(/DA2/);
  });
  it('M_Rd saisi et tete encastree', () => {
    const s = { ...saisieParDefaut(), MRd: '400', tete: 'encastree' };
    const d = calcul(s).donnees;
    expect(d.MRd).toBe(400);
    expect(d.tete).toBe('encastree');
  });
  it('fichier : aller-retour ; un fichier ancien se relit en axial', () => {
    const s = { ...saisieParDefaut(), mode: 'transversal' as const, MRd: '400' };
    expect(relire(serialiser(s))).toEqual(s);
    const ancien = JSON.parse(serialiser(saisieParDefaut())) as Record<string, unknown>;
    for (const k of ['mode', 'EI', 'tete', 'zNappe', 'fluage', 'HtG', 'HtQ', 'MtG', 'MtQ', 'NtG', 'NtQ', 'MRd']) delete ancien[k];
    for (const c of ancien.couches as Record<string, unknown>[]) for (const k of ['gamma', 'gammaSat', 'comportement', 'phi', 'c', 'cu', 'yf']) delete c[k];
    const r = relire(JSON.stringify(ancien));
    expect(r.mode).toBe('axial');
    expect(typeof r.couches[0].gamma).toBe('string');
    expect(typeof r.couches[0].comportement).toBe('string');
    expect(lireSaisie(r).ok).toBe(true);
  });
});

describe('T3 note de calcul transversale', () => {
  const c = calcul(saisieParDefaut());
  const r = verifierTr(c);
  const n = noteTransversale(c, r, cartouche);
  const texte = JSON.stringify(n);

  it('methode citee : C.12, Brinch Hansen, terme N', () => {
    expect(texte).toContain('C.12');
    expect(texte).toContain('Brinch Hansen');
    expect(texte).toContain('C.21');
    expect(n.cartouche.outil).toBe('pieux');
  });
  it('tableaux et figure', () => {
    expect(texte).toMatch(/"titre":"Valeurs le long du pieu[^"]*"/);
    const figures = Object.values(n.sections).flat().filter((e) => e.type === 'figure');
    expect(figures.length).toBeGreaterThan(0);
  });
  it('conclusions : une resistance transversale par combinaison ; M_Ed / M_Rd si M_Rd saisi', () => {
    expect(n.verifications).toHaveLength(2);
    expect(n.verifications.every((v) => v.nom.includes('(a)') || v.nom.includes('(b)'))).toBe(true);
    const avec = calcul({ ...saisieParDefaut(), MRd: '400' });
    const n2 = noteTransversale(avec, verifierTr(avec), cartouche);
    expect(n2.verifications).toHaveLength(3);
    expect(n2.verifications.some((v) => v.nom.includes('M_Ed'))).toBe(true);
  });
});

describe('T4 dessin transversal', () => {
  const c = calcul(saisieParDefaut());
  const r = verifierTr(c);
  const tout = { vue: '(a)', y: true, M: true, V: true, p: true };

  it('diagrammes y, M, V, p et p_f', () => {
    const svg = dessinTransversal(c, r, tout);
    for (const role of ['y', 'M', 'V', 'p', 'pf']) expect(svg).toContain(`data-role="${role}"`);
    expect(svg).not.toMatch(/NaN|Infinity/);
  });
  it('options et vue ELS', () => {
    const svg = dessinTransversal(c, r, { ...tout, vue: 'ELS', V: false });
    expect(svg).not.toContain('data-role="V"');
    expect(svg).not.toMatch(/NaN|Infinity/);
  });
  it('combinaison sans equilibre : coupe seule, sans NaN', () => {
    const s = saisieParDefaut();
    s.couches = [{ ...s.couches[0], h: '3' }];
    s.zNappe = '10';
    s.HtG = '200'; s.HtQ = '0'; s.NtG = '0'; s.NtQ = '0';
    const cc = calcul(s);
    const rr = verifierTr(cc);
    expect(rr.combinaisons[0].py).toBe(null);
    expect(dessinTransversal(cc, rr, tout)).not.toMatch(/NaN|Infinity/);
  });
});
