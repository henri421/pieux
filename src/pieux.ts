/**
 * Noyau de l'outil pieux : portance axiale d'un pieu et d'un groupe sous semelle rigide,
 * frottement negatif, tassement simple. EN 1997-3:2025 (clause 6), ou EN 1997-1:2004 / ANB 2022.
 * Les resistances unitaires q_b et q_s sont saisies : aucune valeur de sol par defaut.
 * Unites : m, kN, kPa ; Eeq en MPa, Ep en GPa, tassements en mm.
 */

import {
  combinaisons1g,
  profil1g,
  profil2g,
  profilAnb2022,
  type Approche,
  type ClasseConsequences,
  type Risque,
} from 'sol-ec7';

export type Execution = 'fore' | 'battu' | 'cfa' | 'visse' | 'non-classe';
export type DensiteCpt = 10 | 50 | 100 | 300 | 1000;

export type Norme2e = {
  generation: 2;
  cc: ClasseConsequences;
  resistance: 'separee' | 'totale';
} & (
  | { methode: 'modele-pieu'; base: 'cpt' | 'pmt' | 'sol'; dAvg: number }
  | { methode: 'modele-terrain'; baseTerrain: 'essais-ultimes' | 'etendue' | 'essais-service' | 'limitee' }
);

export type Norme1re =
  | { generation: 1; profil: 'recommande'; approche: Approche }
  | { generation: 1; profil: 'anb'; risque: Risque; densiteCpt: DensiteCpt; rigide: boolean; sondageProche: boolean };

export type Norme = Norme2e | Norme1re;

export interface Couche {
  nom: string;
  h: number;
  /** q_s par profil (kPa). */
  qs: number[];
  /** tau_dd > 0 : la couche tasse, frottement negatif et pas de frottement positif. */
  tauDd: number;
}

export interface DonneesPieux {
  pieu: { D: number; execution: Execution };
  groupe: { nx: number; ny: number; s: number; eta: number; ratioQbBloc: number; redistribution: boolean };
  couches: Couche[];
  qb: number[];
  efforts: { VG: number; VQ: number; MG: number; MQ: number };
  service: { Eeq: number; nu: number; Ep: number; sAdm: number };
  norme: Norme;
}

export interface Coefficient {
  nom: string;
  valeur: number;
  source: string;
}

export interface ResultatGroupe {
  sommeRep: number;
  blocRep: number;
  mode: 'rendement' | 'bloc';
  Rd: number;
  Fd: number;
  taux: number;
}

export interface ResultatCombinaison {
  nom: string;
  coefficients: Coefficient[];
  xiMoyen: number;
  xiMin: number;
  branche: 'moyenne' | 'minimum';
  Rcrep: number;
  Rcd: number;
  Rtrep: number;
  Rtd: number;
  Vd: number;
  Md: number;
  Dd: number;
  Fcd: number;
  tauxCompression: number;
  Nmin: number;
  Ftd: number;
  tauxTraction: number;
  efforts: { x: number; Nd: number; Fd: number; taux: number }[];
  groupe: ResultatGroupe | null;
}

export interface ResultatPieux {
  generation: 1 | 2;
  longueur: number;
  section: number;
  perimetre: number;
  nPieux: number;
  profils: { Rs: number; Rb: number; Rc: number; Rbloc: number | null }[];
  cov: number;
  Drep: number;
  combinaisons: ResultatCombinaison[];
  tassement: { isole: number; semelle: number | null; s: number; sAdm: number; taux: number };
  gouvernant: { combinaison: string; verification: 'compression' | 'traction' | 'groupe' | 'tassement'; taux: number };
  alertes: string[];
}

interface FacteursPieu {
  gb: Coefficient;
  gs: Coefficient;
  gc: Coefficient | null;
  gst: Coefficient;
  grdC: Coefficient | null;
  grdT: Coefficient | null;
}

const co = (nom: string, valeur: number, source: string): Coefficient => ({ nom, valeur, source });

type Classe = 'full' | 'partial' | 'replacement' | 'unclassified';
const CLASSE: Record<Execution, Classe> = {
  battu: 'full',
  visse: 'partial',
  fore: 'replacement',
  cfa: 'replacement',
  'non-classe': 'unclassified',
};

/** Tableau 6.9, modele de terrain. */
const T69: Record<Classe, { b: number; s: number; c: number; st: number }> = {
  full: { b: 1.2, s: 1.05, c: 1.1, st: 1.2 },
  partial: { b: 1.3, s: 1.1, c: 1.2, st: 1.25 },
  replacement: { b: 1.4, s: 1.15, c: 1.3, st: 1.3 },
  unclassified: { b: 1.5, s: 1.25, c: 1.4, st: 1.5 },
};

/** Tableau 6.10, modele de pieu. */
function t610(c: Classe): { b: number; s: number; c: number; st: number } {
  return c === 'unclassified' ? { b: 1.35, s: 1.25, c: 1.3, st: 1.4 } : { b: 1.2, s: 1.0, c: 1.1, st: 1.15 };
}

/** Tableau 6.4, modele de terrain. */
const T64_TERRAIN = { 'essais-ultimes': 1.15, etendue: 1.3, 'essais-service': 1.35, limitee: 1.55 };
/** Tableau 6.4, modele de pieu : compression, traction. */
const T64_PIEU = { pmt: [1.15, 1.4], cpt: [1.1, 1.1], sol: [1.2, 1.2] };

const XI_N = [1, 2, 3, 4, 5, 7, 10, 20];
/** Tableau 6.6. */
const XI_MOY_2 = [1.4, 1.35, 1.33, 1.31, 1.29, 1.27, 1.25, 1.19];
const XI_MIN_2 = [1.4, 1.27, 1.23, 1.2, 1.15, 1.12, 1.08, 1.06];
/** EN 1997-1:2004, tableau A.10 (n jusqu'a 10). */
const XI_N_1 = [1, 2, 3, 4, 5, 7, 10];
const XI3_1 = [1.4, 1.35, 1.33, 1.31, 1.29, 1.27, 1.25];
const XI4_1 = [1.4, 1.27, 1.23, 1.2, 1.15, 1.12, 1.08];

/** Tableau A.10 ANB : ligne (0 souple ou 1-3 pieux, 1 rigide 4-10, 2 rigide > 10), colonne densite. */
const COL_ANB: DensiteCpt[] = [10, 50, 100, 300, 1000];
const XI_ANB = [
  { x3: [1.25, 1.29, 1.32, 1.36, 1.4], x4: [1.08, 1.17, 1.23, 1.31, 1.4] },
  { x3: [1.15, 1.19, 1.21, 1.25, 1.29], x4: [1.0, 1.07, 1.13, 1.21, 1.29] },
  { x3: [1.14, 1.17, 1.2, 1.24, 1.27], x4: [1.0, 1.06, 1.12, 1.2, 1.27] },
];

type R1re = { b: number; s: number; st: number };
/** EN 1997-1:2004, tableaux A.6 (battu), A.7 (fore), A.8 (tariere). */
const T1RE: Record<'battu' | 'fore' | 'cfa', Record<'R1' | 'R2' | 'R3' | 'R4', R1re>> = {
  battu: {
    R1: { b: 1, s: 1, st: 1.25 },
    R2: { b: 1.1, s: 1.1, st: 1.15 },
    R3: { b: 1, s: 1, st: 1.1 },
    R4: { b: 1.3, s: 1.3, st: 1.6 },
  },
  fore: {
    R1: { b: 1.25, s: 1, st: 1.25 },
    R2: { b: 1.1, s: 1.1, st: 1.15 },
    R3: { b: 1, s: 1, st: 1.1 },
    R4: { b: 1.6, s: 1.3, st: 1.6 },
  },
  cfa: {
    R1: { b: 1.1, s: 1, st: 1.25 },
    R2: { b: 1.1, s: 1.1, st: 1.15 },
    R3: { b: 1, s: 1, st: 1.1 },
    R4: { b: 1.45, s: 1.3, st: 1.6 },
  },
};

/** ANB 2022, jeu R1, tableaux A.6 a A.8-bis. */
const T_ANB: Record<'battu' | 'fore' | 'cfa' | 'visse', { tab: string; r: R1re }> = {
  battu: { tab: 'A.6 ANB', r: { b: 1, s: 1, st: 1 } },
  fore: { tab: 'A.7 ANB', r: { b: 1.2, s: 1, st: 1 } },
  cfa: { tab: 'A.8 ANB', r: { b: 1.1, s: 1, st: 1 } },
  visse: { tab: 'A.8-bis ANB', r: { b: 1.07, s: 1, st: 1 } },
};

function interpoler(xs: number[], ys: number[], x: number): number {
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x <= xs[i + 1]) return ys[i] + ((ys[i + 1] - ys[i]) * (x - xs[i])) / (xs[i + 1] - xs[i]);
  }
  return ys[0];
}

function fini(v: number, nom: string, min: number, strict: boolean): void {
  if (!Number.isFinite(v) || (strict ? v <= min : v < min)) {
    throw new Error(`${nom} invalide : ${v} (attendu ${strict ? '>' : '≥'} ${min}).`);
  }
}

function entier(v: number, nom: string): void {
  if (!Number.isInteger(v) || v < 1) throw new Error(`${nom} invalide : ${v} (entier ≥ 1 attendu).`);
}

function valider(d: DonneesPieux): number {
  fini(d.pieu.D, 'Diamètre', 0, true);
  entier(d.groupe.nx, 'Files selon x');
  entier(d.groupe.ny, 'Files selon y');
  if (d.groupe.nx * d.groupe.ny > 1) fini(d.groupe.s, 'Entraxe', 0, true);
  if (!Number.isFinite(d.groupe.eta) || d.groupe.eta <= 0 || d.groupe.eta > 1) {
    throw new Error(`Rendement invalide : ${d.groupe.eta} (attendu dans ]0 ; 1]).`);
  }
  fini(d.groupe.ratioQbBloc, 'q_b,bloc / q_b', 0, false);
  if (d.couches.length === 0) throw new Error('Au moins une couche est requise.');
  const n = d.qb.length;
  if (n === 0) throw new Error('Au moins un profil est requis.');
  for (const q of d.qb) fini(q, 'q_b', 0, false);
  for (const c of d.couches) {
    fini(c.h, `Épaisseur de ${c.nom}`, 0, true);
    fini(c.tauDd, `τ_dd de ${c.nom}`, 0, false);
    if (c.qs.length !== n) throw new Error(`${c.nom} : ${c.qs.length} valeurs de q_s pour ${n} profils.`);
    for (const q of c.qs) fini(q, `q_s de ${c.nom}`, 0, false);
  }
  fini(d.efforts.VG, 'V_G', 0, false);
  fini(d.efforts.VQ, 'V_Q', 0, false);
  fini(d.efforts.MG, 'M_G', 0, false);
  fini(d.efforts.MQ, 'M_Q', 0, false);
  if (d.groupe.nx === 1 && d.efforts.MG + d.efforts.MQ > 0) {
    throw new Error('Un moment autour de y demande au moins deux files selon x.');
  }
  fini(d.service.Eeq, 'E_eq', 0, true);
  fini(d.service.Ep, 'E_p', 0, true);
  fini(d.service.sAdm, 'Tassement admissible', 0, true);
  if (!Number.isFinite(d.service.nu) || d.service.nu < 0 || d.service.nu >= 0.5) {
    throw new Error(`ν invalide : ${d.service.nu}.`);
  }
  if (d.norme.generation === 2 && d.norme.methode === 'modele-pieu') fini(d.norme.dAvg, 'Espacement des profils', 0, true);
  if (d.norme.generation === 2 && d.norme.methode === 'modele-terrain' && n > 1) {
    throw new Error('Le modèle de terrain porte sur un seul profil de calcul.');
  }
  return n;
}

const moyenne = (l: number[]): number => l.reduce((a, b) => a + b, 0) / l.length;

/** min(moyenne/xi ; minimum/xi), et la part pointe/fut de la branche retenue. */
function representatif(b: number[], s: number[], xm: number, xp: number) {
  const t = b.map((v, i) => v + s[i]);
  const min = Math.min(...t);
  const i = t.indexOf(min);
  const mo = moyenne(t) / xm;
  const mi = min / xp;
  if (mi < mo) return { rep: mi, b: b[i] / xp, s: s[i] / xp, branche: 'minimum' as const };
  return { rep: mo, b: moyenne(b) / xm, s: moyenne(s) / xm, branche: 'moyenne' as const };
}

interface Combi {
  nom: string;
  gG: Coefficient;
  gQ: Coefficient;
  gFav: Coefficient;
  gDrag: Coefficient;
  f: FacteursPieu;
  /** Coefficient de groupe en 2e ; null en 1re (pointe et fut divises par gb, gs). */
  gGroupe: Coefficient | null;
  xiM: number;
  xiP: number;
  xiSources: Coefficient[];
}

function combis2e(d: DonneesPieux, n: Norme2e, nProfils: number, nPieux: number): Combi[] {
  const p = profil2g();
  const kF = p.kF[n.cc];
  const gG = co('γ_G', p.gG.valeur * kF.valeur, `${p.gG.source} × k_F, ${kF.source}`);
  const gQ = co('γ_Q', p.gQ.valeur * kF.valeur, `${p.gQ.source} × k_F, ${kF.source}`);
  const gFav = co('γ_G,fav', p.gG_fav.valeur, p.gG_fav.source);
  const cl = CLASSE[d.pieu.execution];
  const tab = n.methode === 'modele-pieu' ? 'tableau 6.10' : 'tableau 6.9';
  const v = n.methode === 'modele-pieu' ? t610(cl) : T69[cl];
  const src = `EN 1997-3:2025, ${tab}, classe ${cl}`;
  let grdC: number;
  let grdT: number;
  if (n.methode === 'modele-pieu') [grdC, grdT] = T64_PIEU[n.base];
  else grdC = grdT = T64_TERRAIN[n.baseTerrain];
  const s64 = 'EN 1997-3:2025, tableau 6.4';
  let xiM = 1;
  let xiP = 1;
  const xiSources: Coefficient[] = [];
  if (n.methode === 'modele-pieu') {
    const ajuste = (x: number): number => 1 + (n.dAvg / 30) * (x - 1);
    xiM = ajuste(interpoler(XI_N, XI_MOY_2, nProfils));
    xiP = ajuste(interpoler(XI_N, XI_MIN_2, nProfils));
    if (d.groupe.redistribution && nPieux > 1) {
      xiM = Math.max(1, xiM * 0.9);
      xiP = Math.max(1, xiP * 0.9);
    }
    xiSources.push(co('ξ_mean', xiM, 'EN 1997-3:2025, tableau 6.6'), co('ξ_min', xiP, 'EN 1997-3:2025, tableau 6.6'));
  }
  return [{
    nom: 'VC1',
    gG,
    gQ,
    gFav,
    gDrag: co('γ_F,drag', 1.35, `EN 1997-3:2025, ${tab}`),
    f: {
      gb: co('γ_Rb', v.b, src),
      gs: co('γ_Rs', v.s, src),
      gc: n.resistance === 'totale' ? co('γ_Rc', v.c, src) : null,
      gst: co('γ_Rst', v.st, src),
      grdC: co('γ_Rd,pile (compression)', grdC, s64),
      grdT: co('γ_Rd,pile (traction)', grdT, s64),
    },
    gGroupe: co('γ_R,group', 1.4, 'EN 1997-3:2025, tableau 6.12 ; γ_Rd,group = 1,0'),
    xiM,
    xiP,
    xiSources,
  }];
}

function facteurs1re(r: R1re, src: string): FacteursPieu {
  return { gb: co('γ_b', r.b, src), gs: co('γ_s', r.s, src), gc: null, gst: co('γ_s;t', r.st, src), grdC: null, grdT: null };
}

function combis1re(d: DonneesPieux, n: Norme1re, nProfils: number, nPieux: number): Combi[] {
  const ex = d.pieu.execution;
  if (ex === 'non-classe') throw new Error('Pieu non classé : les tableaux de la 1re génération ne le couvrent pas.');

  if (n.profil === 'anb') {
    const p = profilAnb2022(n.risque);
    const { tab, r } = T_ANB[ex];
    const col = COL_ANB.indexOf(n.densiteCpt);
    if (col < 0) throw new Error(`Densité de CPT inconnue : ${String(n.densiteCpt)}.`);
    const ligne = !n.rigide || nPieux <= 3 ? 0 : nPieux <= 10 ? 1 : 2;
    const xiM = n.sondageProche ? 1.08 : XI_ANB[ligne].x3[col];
    const xiP = n.sondageProche ? 1.08 : XI_ANB[ligne].x4[col];
    const sx = 'NBN EN 1997-1 ANB:2022, tableau A.10 ANB';
    return [{
      nom: 'DA1-1',
      gG: co('γ_G', p.A1.gG_dst.valeur, p.A1.gG_dst.source),
      gQ: co('γ_Q', p.A1.gQ_dst.valeur, p.A1.gQ_dst.source),
      gFav: co('γ_G,fav', p.A1.gG_stb.valeur, p.A1.gG_stb.source),
      gDrag: co('γ_G (frottement négatif)', p.A1.gG_dst.valeur, p.A1.gG_dst.source),
      f: facteurs1re(r, `NBN EN 1997-1 ANB:2022, tableau ${tab}, jeu R1`),
      gGroupe: null,
      xiM,
      xiP,
      xiSources: [co('ξ_3', xiM, sx), co('ξ_4', xiP, sx)],
    }];
  }

  if (ex === 'visse') throw new Error('Pieu vissé : les tableaux recommandés A.6 à A.8 ne le couvrent pas (profil ANB requis).');
  const JEU: Record<string, 'R1' | 'R2' | 'R3' | 'R4'> = { 'DA1-1': 'R1', 'DA1-2': 'R4', DA2: 'R2', DA3: 'R3' };
  const TAB = { battu: 'A.6', fore: 'A.7', cfa: 'A.8' };
  let xiM = interpoler(XI_N_1, XI3_1, nProfils);
  let xiP = interpoler(XI_N_1, XI4_1, nProfils);
  if (d.groupe.redistribution && nPieux > 1) {
    xiM = Math.max(1, xiM / 1.1);
    xiP = Math.max(1, xiP / 1.1);
  }
  const sx = 'EN 1997-1:2004, tableau A.10, valeur recommandée';
  return combinaisons1g(n.approche, profil1g()).map((c) => {
    const jeu = JEU[c.nom];
    return {
      nom: c.nom,
      gG: co('γ_G', c.structure.gG_dst.valeur, c.structure.gG_dst.source),
      gQ: co('γ_Q', c.structure.gQ_dst.valeur, c.structure.gQ_dst.source),
      gFav: co('γ_G,fav', c.structure.gG_stb.valeur, c.structure.gG_stb.source),
      gDrag: co('γ_G (frottement négatif)', c.geotechnique.gG_dst.valeur, c.geotechnique.gG_dst.source),
      f: facteurs1re(T1RE[ex][jeu], `EN 1997-1:2004, tableau ${TAB[ex]}, jeu ${jeu}, valeur recommandée`),
      gGroupe: null,
      xiM,
      xiP,
      xiSources: [co('ξ_3', xiM, sx), co('ξ_4', xiP, sx)],
    };
  });
}

export function verifierPieux(d: DonneesPieux): ResultatPieux {
  const nProfils = valider(d);
  const { D } = d.pieu;
  const { nx, ny, s, eta, ratioQbBloc } = d.groupe;
  const nPieux = nx * ny;
  const groupe = nPieux > 1;
  const section = (Math.PI * D * D) / 4;
  const perimetre = Math.PI * D;
  const longueur = d.couches.reduce((a, c) => a + c.h, 0);

  const somme: number[] = Array.from({ length: nProfils }, (_, i) =>
    d.couches.reduce((a, c) => a + (c.tauDd > 0 ? 0 : c.h * c.qs[i]), 0));
  const Rs = somme.map((v) => perimetre * v);
  const Rb = d.qb.map((q) => q * section);
  const Rc = Rs.map((v, i) => v + Rb[i]);
  if (Math.min(...Rc) <= 0) throw new Error('Aucune résistance sur au moins un profil : q_b et q_s y sont tous nuls.');

  const B = groupe ? (nx - 1) * s + D : D;
  const Lb = groupe ? (ny - 1) * s + D : D;
  const aire = B * Lb;
  const perimBloc = 2 * (B + Lb);
  const blocS = somme.map((v) => perimBloc * v);
  const blocB = d.qb.map((q) => aire * ratioQbBloc * q);

  const mo = moyenne(Rc);
  const cov = nProfils > 1 ? Math.sqrt(Rc.reduce((a, v) => a + (v - mo) ** 2, 0) / (nProfils - 1)) / mo : 0;
  const Drep = perimetre * d.couches.reduce((a, c) => a + c.h * c.tauDd, 0);

  const xs = Array.from({ length: nx }, (_, i) => (i - (nx - 1) / 2) * s);
  const sx2 = ny * xs.reduce((a, x) => a + x * x, 0);
  const xmax = nx > 1 ? ((nx - 1) * s) / 2 : 0;
  const flexion = (M: number, x: number): number => (sx2 > 0 ? (M * x) / sx2 : 0);

  const { VG, VQ, MG, MQ } = d.efforts;
  const alertes: string[] = [];
  const liste = d.norme.generation === 2
    ? combis2e(d, d.norme, nProfils, nPieux)
    : combis1re(d, d.norme, nProfils, nPieux);

  const combinaisons = liste.map((c): ResultatCombinaison => {
    const rep = representatif(Rb, Rs, c.xiM, c.xiP);
    const f = c.f;
    const kc = f.grdC?.valeur ?? 1;
    const kt = f.grdT?.valeur ?? 1;
    const Rcd = f.gc ? rep.rep / (f.gc.valeur * kc) : rep.b / (f.gb.valeur * kc) + rep.s / (f.gs.valeur * kc);
    const Rtrep = Math.min(moyenne(Rs) / c.xiM, Math.min(...Rs) / c.xiP);
    const Rtd = Rtrep / (f.gst.valeur * kt);

    const Vd = c.gG.valeur * VG + c.gQ.valeur * VQ;
    const Md = c.gG.valeur * MG + c.gQ.valeur * MQ;
    const Dd = c.gDrag.valeur * Drep;
    const Fcd = Vd / nPieux + flexion(Md, xmax) + Dd;
    const Nmin = (c.gFav.valeur * VG) / nPieux - flexion(Md, xmax);
    const Ftd = Math.max(0, -Nmin);

    const efforts = xs.map((x) => {
      const Nd = Vd / nPieux + flexion(Md, x);
      const Fd = Nd + Dd;
      return { x, Nd, Fd, taux: Fd / Rcd };
    });

    let g: ResultatGroupe | null = null;
    if (groupe) {
      const bl = representatif(blocB, blocS, c.xiM, c.xiP);
      const Fd = Vd + nPieux * Dd;
      const sommeRep = eta * nPieux * rep.rep;
      const parSomme = c.gGroupe ? sommeRep / c.gGroupe.valeur : eta * nPieux * Rcd;
      const parBloc = c.gGroupe ? bl.rep / c.gGroupe.valeur : bl.b / f.gb.valeur + bl.s / f.gs.valeur;
      const Rd = Math.min(parSomme, parBloc);
      g = { sommeRep, blocRep: bl.rep, mode: parSomme <= parBloc ? 'rendement' : 'bloc', Rd, Fd, taux: Fd / Rd };
    }

    if (d.norme.generation === 2 && d.norme.methode === 'modele-pieu' && rep.branche === 'minimum' && nProfils < 5 && cov >= 0.3) {
      alertes.push('ξ_min gouverne avec moins de 5 profils et un CoV d’au moins 30 % : condition de 6.6.2.4.2 non remplie.');
    }

    const coefficients = [c.gG, c.gQ, c.gFav, c.gDrag, f.gb, f.gs, ...(f.gc ? [f.gc] : []), f.gst,
      ...(f.grdC ? [f.grdC] : []), ...(f.grdT ? [f.grdT] : []), ...c.xiSources, ...(c.gGroupe && groupe ? [c.gGroupe] : [])];

    return {
      nom: c.nom, coefficients, xiMoyen: c.xiM, xiMin: c.xiP, branche: rep.branche, Rcrep: rep.rep, Rcd, Rtrep, Rtd,
      Vd, Md, Dd, Fcd, tauxCompression: Fcd / Rcd, Nmin, Ftd, tauxTraction: Ftd / Rtd, efforts, groupe: g,
    };
  });

  // Service : combinaison caracteristique, frottement negatif non compte.
  const { Eeq, nu, Ep, sAdm } = d.service;
  const rigidite = section * Ep * 1e6;
  const Qmax = (VG + VQ) / nPieux + flexion(MG + MQ, xmax);
  const isole = ((Qmax * longueur) / rigidite + (Qmax * (1 - nu * nu)) / (Eeq * 1000 * D)) * 1000;
  let semelle: number | null = null;
  let tass = isole;
  if (groupe) {
    const q = (VG + VQ) / aire;
    semelle = ((q * Math.min(B, Lb) * (1 - nu * nu)) / (Eeq * 1000)) * 1000;
    tass = Math.max(isole, semelle + (((VG + VQ) / nPieux) * longueur * 1000) / rigidite);
  }
  const tassement = { isole, semelle, s: tass, sAdm, taux: tass / sAdm };

  if (nProfils === 1) alertes.push('Un seul profil : les facteurs de corrélation les plus défavorables s’appliquent.');
  if (d.norme.generation === 2 && d.norme.methode === 'modele-pieu' && cov > 0.12) {
    alertes.push(`CoV de ${(cov * 100).toFixed(1).replace('.', ',')} % : le tableau 6.6 suppose un CoV d’au plus 12 %.`);
  }
  if (groupe && s < 3 * D - 1e-9) alertes.push('Entraxe inférieur à 3 D : effets de groupe importants.');
  if (d.couches[d.couches.length - 1].tauDd > 0) alertes.push('La pointe est dans une couche qui tasse.');
  if (groupe) alertes.push('Tassement du groupe : estimation simple ; le 6.7 demande un modèle d’interaction non linéaire.');

  let gouvernant: ResultatPieux['gouvernant'] = { combinaison: 'service', verification: 'tassement', taux: tassement.taux };
  for (const c of combinaisons) {
    const candidats: [ResultatPieux['gouvernant']['verification'], number][] = [
      ['compression', c.tauxCompression], ['traction', c.tauxTraction], ['groupe', c.groupe ? c.groupe.taux : 0]];
    for (const [verification, taux] of candidats) {
      if (taux > gouvernant.taux) gouvernant = { combinaison: c.nom, verification, taux };
    }
  }

  return {
    generation: d.norme.generation, longueur, section, perimetre, nPieux,
    profils: Rc.map((v, i) => ({ Rs: Rs[i], Rb: Rb[i], Rc: v, Rbloc: groupe ? blocS[i] + blocB[i] : null })),
    cov, Drep, combinaisons, tassement, gouvernant, alertes: [...new Set(alertes)],
  };
}
