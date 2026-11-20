/**
 * Pieu isole sous charge transversale (PLAN-transversal.md). PUR : aucune entree-sortie.
 *
 * - Ressorts p-y bilineaires de l'EN 1997-3:2025, annexe C.12 : p = min(p_f.y/y_f ; p_f) (C.15),
 *   p_f non draine (C.16 a C.18) ou draine (C.19, coefficients de Brinch Hansen 1961, figure C.9),
 *   y_f du tableau C.11.
 * - Poutre d'Euler-Bernoulli en 200 elements, terme N.y'' (C.21) par la rigidite geometrique.
 * - Resistance transversale du terrain (6.6.2.3) : mecanisme du pieu rigide, p = +-p_fd.
 * - Combinaisons de sol-ec7 : (a) VC1 + M1 et (b) VC3 + M2 ; 1re generation DA1, DA3.
 * Reference : tests/reference/transversal.py. Unites : m, kN, kPa.
 */

import { combinaisons1g, combinaisons2g, profil1g, profil2g, profilAnb2022, type Combinaison } from 'sol-ec7';
import type { Coefficient, Norme } from './pieux';

export type Comportement = 'draine' | 'non-draine';
export type ClasseYf = 'grenu' | 'fin-court' | 'fin-long';

export interface CoucheTransversale {
  nom: string;
  h: number;
  gamma: number;
  gammaSat: number;
  comportement: Comportement;
  phi: number;
  c: number;
  cu: number;
  yf: ClasseYf;
}

export interface DonneesTransversal {
  D: number;
  EI: number;
  tete: 'libre' | 'encastree';
  zNappe: number;
  fluage: boolean;
  couches: CoucheTransversale[];
  efforts: { HG: number; HQ: number; MG: number; MQ: number; NG: number; NQ: number };
  MRd: number | null;
  norme: Norme;
}

/** Diviseurs des proprietes du sol (tan phi', c', c_u). */
export interface SolDeCalcul { gPhi: number; gC: number; gCu: number }

export interface Modele {
  L: number;
  D: number;
  EI: number;
  /** Resistance ultime (kPa). */
  pf: (z: number) => number;
  /** Deplacement de plastification (m). */
  yf: (z: number) => number;
}

export interface ResultatPY {
  z: number[];
  y: number[];
  M: number[];
  V: number[];
  /** Pression mobilisee et resistance ultime (kPa). */
  p: number[];
  pf: number[];
  yTete: number;
  rotationTete: number;
  Mtete: number;
  MEd: number;
  zMEd: number;
  VEd: number;
  zonePlastique: number;
}

export interface ResistanceTransversale { taux: number; H: number; zRotation: number | null }

export interface CombinaisonTransversale {
  nom: string;
  coefficients: Coefficient[];
  Hd: number;
  Md: number;
  Nd: number;
  resistance: ResistanceTransversale;
  py: ResultatPY | null;
  taux: number;
}

export interface ResultatTransversal {
  generation: 1 | 2;
  longueur: number;
  combinaisons: CombinaisonTransversale[];
  service: ResultatPY | null;
  gouvernant: { combinaison: string; taux: number };
  MEd: { valeur: number; combinaison: string; z: number };
  VEd: number;
  NEd: number;
  tauxStructure: number | null;
  alertes: string[];
}

export const GAMMA_W = 10;
const NE = 200;
const SOL_M1: SolDeCalcul = { gPhi: 1, gC: 1, gCu: 1 };
/** Tableau C.11 : y_f / D. */
export const YF: Record<ClasseYf, number> = { grenu: 0.1, 'fin-long': 0.12, 'fin-court': 0.05 };

const rad = (d: number): number => (d * Math.PI) / 180;

/** Brinch Hansen (1961), coefficients K_q et K_c a z/D = x (EN 1997-3, figure C.9). */
export function coefficientsBrinchHansen(phiDeg: number, zSurD: number): { Kq: number; Kc: number } {
  const f = rad(phiDeg);
  const t = Math.tan(f);
  if (t < 1e-12) return { Kq: 0, Kc: 0 };
  const e1 = Math.exp((Math.PI / 2 + f) * t) * Math.cos(f) * Math.tan(Math.PI / 4 + f / 2);
  const Kq0 = e1 - Math.exp(-(Math.PI / 2 - f) * t) * Math.cos(f) * Math.tan(Math.PI / 4 - f / 2);
  const Kc0 = (e1 - 1) / t;
  const Nc = (Math.exp(Math.PI * t) * Math.tan(Math.PI / 4 + f / 2) ** 2 - 1) / t;
  const dc = 1.58 + 4.09 * t ** 4;
  const K0 = 1 - Math.sin(f);
  const Kci = Nc * dc;
  const Kqi = Kci * K0 * t;
  const aq = (Kq0 / (Kqi - Kq0)) * K0 * Math.sin(f) / Math.sin(Math.PI / 4 + f / 2);
  const ac = (Kc0 / (Kci - Kc0)) * 2 * Math.sin(Math.PI / 4 + f / 2);
  const x = zSurD;
  return { Kq: (Kq0 + Kqi * aq * x) / (1 + aq * x), Kc: (Kc0 + Kci * ac * x) / (1 + ac * x) };
}

/** Couche au niveau z : une frontiere appartient a la couche du dessus ; sous la derniere, la derniere. */
function coucheEn(couches: CoucheTransversale[], z: number): CoucheTransversale {
  let t = 0;
  for (const c of couches) {
    t += c.h;
    if (z <= t + 1e-9) return c;
  }
  return couches[couches.length - 1];
}

/** Contrainte verticale effective (kPa), exacte par couches ; gamma_sat - 10 sous la nappe. */
export function contrainteVerticale(d: Pick<DonneesTransversal, 'couches' | 'zNappe'>, z: number): number {
  let total = 0;
  let t = 0;
  for (const c of d.couches) {
    const a = t;
    let b = t + c.h;
    t = b;
    if (a >= z) break;
    b = Math.min(b, z);
    const sec = Math.max(0, Math.min(b, d.zNappe) - a);
    const imm = b - a - sec;
    total += c.gamma * sec + (c.gammaSat - GAMMA_W) * imm;
  }
  return total;
}

/** Resistance ultime p_f (kPa) au niveau z, proprietes divisees par `sol`. */
export function pressionUltime(
  d: Pick<DonneesTransversal, 'D' | 'couches' | 'zNappe' | 'fluage'>,
  z: number,
  sol: SolDeCalcul = SOL_M1,
): number {
  const c = coucheEn(d.couches, z);
  if (c.comportement === 'non-draine') {
    const cu = c.cu / sol.gCu;
    return Math.min((d.fluage ? 6 : 9) * cu, cu * (2 + ((2 / 3) * z) / d.D) + contrainteVerticale(d, z));
  }
  const phi = (Math.atan(Math.tan(rad(c.phi)) / sol.gPhi) * 180) / Math.PI;
  const zz = Math.min(z, 20 * d.D);
  const k = coefficientsBrinchHansen(phi, zz / d.D);
  return k.Kq * contrainteVerticale(d, zz) + (k.Kc * c.c) / sol.gC;
}

/** Modele p-y des donnees, pour un jeu de proprietes du sol. */
export function modeleDe(d: DonneesTransversal, sol: SolDeCalcul = SOL_M1): Modele {
  return {
    L: d.couches.reduce((s, c) => s + c.h, 0),
    D: d.D,
    EI: d.EI,
    pf: (z) => pressionUltime(d, z, sol),
    yf: (z) => YF[coucheEn(d.couches, z).yf] * d.D,
  };
}

/** Matrice symetrique en bande : demi-largeur 3, stockage a[i*7 + (j - i + 3)]. */
const BANDE = 3;
const LARG = 2 * BANDE + 1;

/** Resout K u = F en bande (Gauss sans pivotement) ; pivot <= 0 : charge critique depassee. */
function resoudreBande(Kb: Float64Array, F: Float64Array, m: number): Float64Array {
  const a = Float64Array.from(Kb);
  const b = Float64Array.from(F);
  const at = (i: number, j: number): number => i * LARG + (j - i + BANDE);
  for (let k = 0; k < m; k += 1) {
    const piv = a[at(k, k)];
    if (!(piv > 0)) throw new Error('N dépasse la charge critique du pieu (matrice non définie positive).');
    for (let i = k + 1; i <= Math.min(m - 1, k + BANDE); i += 1) {
      const f = a[at(i, k)] / piv;
      if (f === 0) continue;
      for (let j = k; j <= Math.min(m - 1, k + BANDE); j += 1) a[at(i, j)] -= f * a[at(k, j)];
      b[i] -= f * b[k];
    }
  }
  const u = new Float64Array(m);
  for (let i = m - 1; i >= 0; i -= 1) {
    let s = b[i];
    for (let j = i + 1; j <= Math.min(m - 1, i + BANDE); j += 1) s -= a[at(i, j)] * u[j];
    u[i] = s / a[at(i, i)];
  }
  return u;
}

/** Analyse p-y : null s'il n'existe pas d'equilibre (deplacement > 10 L ou pas de convergence). */
export function analysePY(m: Modele, charge: { H: number; M: number; N: number }, tete: 'libre' | 'encastree'): ResultatPY | null {
  const { L, D, EI } = m;
  const { H, M, N } = charge;
  const n = NE + 1;
  const h = L / NE;
  const z = Array.from({ length: n }, (_, i) => i * h);
  const P = z.map((zi) => m.pf(zi) * D);
  const Y = z.map((zi) => m.yf(zi));
  const w = z.map((_, i) => (i === 0 || i === n - 1 ? h / 2 : h));
  const dof = 2 * n;

  const ke = [
    [12, 6 * h, -12, 6 * h], [6 * h, 4 * h * h, -6 * h, 2 * h * h],
    [-12, -6 * h, 12, -6 * h], [6 * h, 2 * h * h, -6 * h, 4 * h * h],
  ].map((l) => l.map((v) => (EI / h ** 3) * v));
  const kg = [
    [36, 3 * h, -36, 3 * h], [3 * h, 4 * h * h, -3 * h, -h * h],
    [-36, -3 * h, 36, -3 * h], [3 * h, -h * h, -3 * h, 4 * h * h],
  ].map((l) => l.map((v) => (-N / (30 * h)) * v));
  const K0 = new Float64Array(dof * LARG);
  const at = (i: number, j: number): number => i * LARG + (j - i + BANDE);
  for (let e = 0; e < NE; e += 1) {
    for (let a = 0; a < 4; a += 1) for (let b = 0; b < 4; b += 1) K0[at(2 * e + a, 2 * e + b)] += ke[a][b] + kg[a][b];
  }

  const kel = P.map((p, i) => (p / Y[i]) * w[i]);
  let ks = kel.slice();
  let y: number[] = [];
  let u: Float64Array = new Float64Array(dof);
  let precedent: number[] | null = null;
  let converge = false;
  for (let it = 0; it < 5000; it += 1) {
    const K = Float64Array.from(K0);
    for (let i = 0; i < n; i += 1) K[at(2 * i, 2 * i)] += ks[i];
    const F = new Float64Array(dof);
    F[0] = H;
    F[1] = -M; // M = H.e, e > 0 au-dessus de la tete
    if (tete === 'encastree') {
      for (let j = Math.max(0, 1 - BANDE); j <= 1 + BANDE; j += 1) {
        K[at(1, j)] = 0;
        K[at(j, 1)] = 0;
      }
      K[at(1, 1)] = 1;
      F[1] = 0;
    }
    u = resoudreBande(K, F, dof);
    y = Array.from({ length: n }, (_, i) => u[2 * i]);
    if (Math.max(...y.map(Math.abs)) > 10 * L) return null;
    const ksn = y.map((yi, i) => {
      if (Math.abs(yi) <= 1e-14) return kel[i];
      const R = Math.min(P[i], Math.max(-P[i], (P[i] / Y[i]) * yi)) * w[i];
      return R / yi;
    });
    if (precedent !== null && Math.max(...y.map((yi, i) => Math.abs(yi - (precedent as number[])[i]))) < 1e-10) {
      converge = true;
      break;
    }
    precedent = y;
    ks = ks.map((k, i) => 0.5 * k + 0.5 * ksn[i]);
  }
  if (!converge) return null;

  const pm = y.map((yi, i) => Math.min(P[i], Math.max(-P[i], (P[i] / Y[i]) * yi)));
  const R = pm.map((p, i) => p * w[i]);
  let M0 = M;
  if (tete === 'encastree') {
    let s = 0;
    for (let j = 0; j < n - 1; j += 1) s += R[j] * (L - z[j]);
    M0 = -(H * L + N * (y[0] - y[n - 1]) - s);
  }
  const Mz = z.map((zi, i) => {
    let s = 0;
    for (let j = 0; j < i; j += 1) s += R[j] * (zi - z[j]);
    return M0 + H * zi + N * (y[0] - y[i]) - s;
  });
  let cumul = 0;
  const V = R.map((r) => {
    cumul += r;
    return H - cumul;
  });
  let iM = 0;
  for (let i = 1; i < n; i += 1) if (Math.abs(Mz[i]) > Math.abs(Mz[iM])) iM = i;
  let plast = 0;
  for (let i = 0; i < n; i += 1) if (P[i] > 0 && Math.abs(y[i]) >= Y[i] * (1 - 1e-9)) plast += w[i];
  return {
    z, y, M: Mz, V,
    p: pm.map((p) => p / D),
    pf: P.map((p) => p / D),
    yTete: y[0],
    rotationTete: tete === 'encastree' ? 0 : u[1],
    Mtete: M0,
    MEd: Math.abs(Mz[iM]),
    zMEd: z[iM],
    VEd: Math.max(...V.map(Math.abs)),
    zonePlastique: plast,
  };
}

/**
 * Resistance transversale du terrain (6.6.2.3) : pieu rigide, p = +-p_f. Tete encastree :
 * translation. Tete libre : rotation autour de z_r, meme excentricite M/H que les actions.
 */
export function resistanceTransversale(m: Modele, charge: { H: number; M: number }, tete: 'libre' | 'encastree'): ResistanceTransversale {
  const { L, D } = m;
  const { H, M } = charge;
  const nint = 2000;
  const dz = L / nint;
  const zm = Array.from({ length: nint }, (_, k) => (k + 0.5) * dz);
  const P = zm.map((zi) => m.pf(zi) * D);
  if (tete === 'encastree') {
    const cap = P.reduce((s, p) => s + p, 0) * dz;
    return { taux: H > 0 ? H / cap : 0, H: cap, zRotation: null };
  }
  const AB = (zr: number): [number, number] => {
    const k = Math.min(Math.floor(zr / dz), nint - 1);
    const a0 = zr - k * dz;
    let A = 0;
    let B = 0;
    for (let i = 0; i < nint; i += 1) {
      if (i === k) continue;
      const s = i < k ? 1 : -1;
      A += s * P[i];
      B += s * P[i] * (L - zm[i]);
    }
    A = A * dz + P[k] * (a0 - (dz - a0));
    B = B * dz + P[k] * (a0 * (L - (k * dz + a0 / 2)) - (dz - a0) * (L - (zr + (dz - a0) / 2)));
    return [A, B];
  };
  const g = (zr: number): number => {
    const [A, B] = AB(zr);
    return (M + H * L) * A - H * B;
  };
  let a = 1e-9;
  let b = L - 1e-9;
  let ga = g(a);
  for (let i = 0; i < 200; i += 1) {
    const mi = (a + b) / 2;
    const gm = g(mi);
    if (gm > 0 === ga > 0) {
      a = mi;
      ga = gm;
    } else {
      b = mi;
    }
  }
  const zr = (a + b) / 2;
  const [A, B] = AB(zr);
  const lambda = Math.abs(H) > 1e-12 ? A / H : B / M;
  return { taux: 1 / lambda, H: A, zRotation: zr };
}

function controler(d: DonneesTransversal): void {
  if (!(d.D > 0)) throw new Error('Diamètre du pieu : valeur strictement positive attendue.');
  if (!(d.EI > 0)) throw new Error('Rigidité EI du pieu : valeur strictement positive attendue.');
  if (d.couches.length === 0) throw new Error('Au moins une couche est requise.');
  for (const c of d.couches) {
    if (!(c.h > 0)) throw new Error(`${c.nom} : épaisseur strictement positive attendue.`);
    if (!(c.gamma > 0) || !(c.gammaSat > 0)) throw new Error(`${c.nom} : poids volumiques strictement positifs attendus.`);
    if (c.comportement === 'draine') {
      if (!(c.phi > 0 && c.phi <= 60)) throw new Error(`${c.nom} : angle de frottement entre 0 et 60°.`);
      if (!(c.c >= 0)) throw new Error(`${c.nom} : cohésion négative ou invalide.`);
    } else if (!(c.cu > 0)) {
      throw new Error(`${c.nom} : c_u strictement positif attendu (non drainé).`);
    }
  }
}

const co = (nom: string, v: { valeur: number; source: string }): Coefficient => ({ nom, valeur: v.valeur, source: v.source });

/** Combinaisons de la norme ; DA2 refuse (pas de facteur de resistance transversale source). */
function combinaisons(n: Norme): Combinaison[] {
  if (n.generation === 2) return combinaisons2g('a+b', n.cc, profil2g());
  if (n.profil === 'anb') return combinaisons1g('DA1', profilAnb2022(n.risque));
  if (n.approche === 'DA2') {
    throw new Error('DA2 : l’EN 1997-1:2004 n’est pas disponible pour sourcer le facteur de résistance transversale ; choisir DA1 ou DA3.');
  }
  return combinaisons1g(n.approche, n.annexe?.profil ?? profil1g());
}

export function verifierTransversal(d: DonneesTransversal): ResultatTransversal {
  controler(d);
  const L = d.couches.reduce((s, c) => s + c.h, 0);
  const e = d.efforts;
  const alertes: string[] = [];
  const combis = combinaisons(d.norme).map((c): CombinaisonTransversale => {
    const s = c.structure;
    const gG = s.gG_dst.valeur;
    const gQ = s.gQ_dst.valeur;
    const sol: SolDeCalcul = { gPhi: c.sol.gPhi.valeur, gC: c.sol.gC.valeur, gCu: c.sol.gCu.valeur };
    const Hd = gG * e.HG + gQ * e.HQ;
    const Md = gG * e.MG + gQ * e.MQ;
    const Nd = gG * e.NG + gQ * e.NQ;
    const m = modeleDe(d, sol);
    const py = analysePY(m, { H: Hd, M: Md, N: Nd }, d.tete);
    const resistance = resistanceTransversale(m, { H: Hd, M: Md }, d.tete);
    if (py === null) alertes.push(`${c.nom} : pas d’équilibre p-y, la résistance latérale du terrain est dépassée.`);
    return {
      nom: c.nom,
      coefficients: [
        co('γ_G', s.gG_dst), co('γ_Q', s.gQ_dst),
        co('γ_φ', c.sol.gPhi), co('γ_c', c.sol.gC), co('γ_cu', c.sol.gCu),
      ],
      Hd, Md, Nd, resistance, py,
      taux: py === null ? Infinity : resistance.taux,
    };
  });
  const service = analysePY(modeleDe(d), { H: e.HG + e.HQ, M: e.MG + e.MQ, N: e.NG + e.NQ }, d.tete);
  let gouvernant = { combinaison: combis[0].nom, taux: combis[0].taux };
  for (const k of combis) if (k.taux > gouvernant.taux) gouvernant = { combinaison: k.nom, taux: k.taux };
  let MEd = { valeur: 0, combinaison: '', z: 0 };
  let VEd = 0;
  for (const k of combis) {
    if (k.py === null) continue;
    if (k.py.MEd > MEd.valeur) MEd = { valeur: k.py.MEd, combinaison: k.nom, z: k.py.zMEd };
    VEd = Math.max(VEd, k.py.VEd);
  }
  return {
    generation: d.norme.generation,
    longueur: L,
    combinaisons: combis,
    service,
    gouvernant,
    MEd,
    VEd,
    NEd: Math.max(...combis.map((k) => k.Nd)),
    tauxStructure: d.MRd === null ? null : MEd.valeur / d.MRd,
    alertes,
  };
}
