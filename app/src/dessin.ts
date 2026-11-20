/**
 * Coupe et vue en plan du groupe de pieux, en SVG. PUR : uniquement des coordonnees.
 * Repère de la coupe : x vers la droite, y vers le bas (repère SVG). Une seule échelle
 * en x et en y ; la vue en plan, à droite, a sa propre échelle.
 */

import type { Calcul, CalculTr, Resultat } from './form';
import type { ResultatPY, ResultatTransversal } from '../../src/transversal';
import { textes } from './textes';

export interface OptionsCoupe {
  cotes: boolean;
  bloc: boolean;
  planNeutre: boolean;
}

/** Échelle de la coupe, en pixels par mètre. */
const SCALE = 24;
/** Échelle de la vue en plan, en pixels par mètre. */
const PLAN = 42;
/** Marges en pixels, pour les textes, les cotes et la charge. */
const PAD = { gauche: 58, droite: 24, haut: 34, bas: 42 };
/** Écart entre la coupe et la vue en plan, en pixels. */
const GAP = 40;
/** Épaisseur de la semelle, en mètres. */
const H_SEMELLE = 0.8;

const ECHAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ECHAP[c] ?? c);

/** Nombre fini, ou 0 : jamais de NaN ni d'Infinity dans un attribut. */
const a = (v: number): string => (Number.isFinite(v) ? String(Number(v.toFixed(2))) : '0');

/** Nombre affiché, ou un tiret : jamais de NaN ni d'Infinity dans un texte. */
const nb = (v: number): string => (Number.isFinite(v) ? String(Number(v.toFixed(2))) : '—');

function texte(x: number, y: number, classe: string, contenu: string, ancrage = 'start'): string {
  return `<text x="${a(x)}" y="${a(y)}" class="${classe}" text-anchor="${ancrage}">${contenu}</text>`;
}

function ligne(x1: number, y1: number, x2: number, y2: number, classe: string): string {
  return `<line class="${classe}" x1="${a(x1)}" y1="${a(y1)}" x2="${a(x2)}" y2="${a(y2)}"/>`;
}

/** Abscisse de la file la plus chargée, lue dans la combinaison la plus sollicitée. */
function fileLaPlusChargee(r: Resultat): number {
  let comb: Resultat['combinaisons'][number] | null = null;
  let taux = -Infinity;
  for (const cb of r.combinaisons) {
    if (Number.isFinite(cb.tauxCompression) && cb.tauxCompression > taux) {
      taux = cb.tauxCompression;
      comb = cb;
    }
  }
  let x = 0;
  let nd = -Infinity;
  for (const e of comb ? comb.efforts : []) {
    if (Number.isFinite(e.Nd) && e.Nd > nd) {
      nd = e.Nd;
      x = e.x;
    }
  }
  return Number.isFinite(x) ? x : 0;
}

export function coupe(c: Calcul, r: Resultat, o: OptionsCoupe): string {
  const t = textes().dessin;
  const d = c.donnees;
  const D = Number.isFinite(d.pieu.D) && d.pieu.D > 0 ? d.pieu.D : 0.6;
  const nx = Number.isFinite(d.groupe.nx) ? Math.max(1, Math.round(d.groupe.nx)) : 1;
  const ny = Number.isFinite(d.groupe.ny) ? Math.max(1, Math.round(d.groupe.ny)) : 1;
  const s = Number.isFinite(d.groupe.s) && d.groupe.s > 0 ? d.groupe.s : 3 * D;

  const couches = d.couches.map((x) => ({
    nom: String(x.nom ?? ''),
    h: Number.isFinite(x.h) && x.h > 0 ? x.h : 0,
    qs: x.qs.map((v) => (Number.isFinite(v) ? v : 0)),
    tauDd: Number.isFinite(x.tauDd) ? x.tauDd : 0,
  }));
  const sommeH = couches.reduce((n, x) => n + x.h, 0);
  const L = Number.isFinite(r.longueur) && r.longueur > 0 ? r.longueur : sommeH;
  const profondeur = Math.max(L, sommeH);

  const groupeL = (nx - 1) * s;
  const largeurSol = Math.max(groupeL + 2 * s, 3 * D, 2.4);
  // Bande de sol prolongée à gauche : les libellés des couches ne passent pas sous les pieux.
  const MARGE_LIBELLES = 130;
  const coupeL = largeurSol * SCALE + MARGE_LIBELLES;
  const planL = largeurSol * PLAN;

  const yTop = PAD.haut + 40 + H_SEMELLE * SCALE;
  const yPointe = yTop + L * SCALE;
  const yBas = yTop + profondeur * SCALE;
  const centre = PAD.gauche + MARGE_LIBELLES + (largeurSol * SCALE) / 2;
  const planCentre = PAD.gauche + coupeL + GAP + planL / 2;
  const planY = (yTop + yPointe) / 2;
  const planHaut = planY - ((ny - 1) / 2) * s * PLAN - (D / 2) * PLAN;
  const planBas = planY + ((ny - 1) / 2) * s * PLAN + (D / 2) * PLAN;

  const xs: number[] = [];
  for (let i = 0; i < nx; i += 1) {
    xs.push(centre + (i - (nx - 1) / 2) * s * SCALE);
  }

  const g: string[] = [];

  // Sol : une bande par couche, une seule échelle.
  g.push(ligne(PAD.gauche, yTop, PAD.gauche + coupeL, yTop, 'terrain'));
  let prof = 0;
  couches.forEach((x, i) => {
    const y = yTop + prof * SCALE;
    if (x.h > 0) {
      g.push(
        `<rect class="couche couche-${i % 3}" x="${a(PAD.gauche)}" y="${a(y)}" width="${a(coupeL)}" height="${a(x.h * SCALE)}"/>`,
      );
      if (x.nom) g.push(texte(PAD.gauche + 8, y + 15, 'texte-coupe', esc(x.nom)));
      const detail =
        x.tauDd > 0
          ? t.coucheTau(nb(x.tauDd))
          : t.coucheQ(x.qs.map((v) => nb(v)).join(' · '));
      g.push(texte(PAD.gauche + 8, y + 30, 'texte-coupe', esc(detail)));
    }
    prof += x.h;
  });

  // Un pieu par file x : la profondeur du groupe cache les rangées y.
  const largeurPieu = D * SCALE;
  for (const cx of xs) {
    g.push(
      `<rect class="pieu" x="${a(cx - largeurPieu / 2)}" y="${a(yTop)}" width="${a(largeurPieu)}" height="${a(L * SCALE)}"/>`,
    );
  }

  // Frottement négatif : une zone par file et par couche qui tasse.
  let profDrag = 0;
  for (const x of couches) {
    if (x.h > 0 && x.tauDd > 0) {
      for (const cx of xs) {
        g.push(
          `<rect class="zone-drag" x="${a(cx - largeurPieu / 2)}" y="${a(yTop + profDrag * SCALE)}" width="${a(largeurPieu)}" height="${a(x.h * SCALE)}"/>`,
        );
      }
    }
    profDrag += x.h;
  }

  // Plan neutre : à la base de la dernière couche qui tasse.
  if (o.planNeutre) {
    let baseNeutre: number | null = null;
    let profNeutre = 0;
    for (const x of couches) {
      profNeutre += x.h;
      if (x.h > 0 && x.tauDd > 0) baseNeutre = profNeutre;
    }
    if (baseNeutre !== null) {
      const y = yTop + baseNeutre * SCALE;
      g.push(ligne(PAD.gauche, y, PAD.gauche + coupeL, y, 'plan-neutre'));
      g.push(texte(PAD.gauche + 8, y - 5, 'texte-coupe', esc(t.planNeutre(nb(baseNeutre)))));
    }
  }

  // Contour du bloc.
  if (o.bloc) {
    const marge = (D / 2 + 0.3) * SCALE;
    const x0 = xs[0] - marge;
    const x1 = xs[xs.length - 1] + marge;
    g.push(
      `<rect class="bloc" x="${a(x0)}" y="${a(yTop)}" width="${a(x1 - x0)}" height="${a(L * SCALE)}"/>`,
    );
  }

  // Semelle, posée sur le sol.
  const semelleL = Math.max(groupeL + 1.2 * D + 0.8, 1.6);
  g.push(
    `<rect class="semelle" x="${a(centre - (semelleL * SCALE) / 2)}" y="${a(yTop - H_SEMELLE * SCALE)}" width="${a(semelleL * SCALE)}" height="${a(H_SEMELLE * SCALE)}"/>`,
  );

  // Charge en tête.
  const e = d.efforts;
  const ySemelle = yTop - H_SEMELLE * SCALE;
  g.push(ligne(centre, ySemelle - 30, centre, ySemelle - 5, 'charge'));
  g.push(
    texte(
      centre + 8,
      PAD.haut + 6,
      'texte-coupe',
      esc(t.charge(nb(e.VG), nb(e.VQ), nb(e.MG), nb(e.MQ))),
    ),
  );

  // Cotes.
  if (o.cotes) {
    const xCote = PAD.gauche + coupeL + 16;
    g.push(ligne(xCote, yTop, xCote, yPointe, 'cote'));
    g.push(ligne(xCote - 4, yTop, xCote + 4, yTop, 'cote'));
    g.push(ligne(xCote - 4, yPointe, xCote + 4, yPointe, 'cote'));
    g.push(texte(xCote + 5, (yTop + yPointe) / 2, 'cote', esc(t.longueur(nb(L)))));

    const yDim = yBas + 16;
    if (nx > 1) {
      const x0 = xs[0];
      const x1 = xs[xs.length - 1];
      g.push(ligne(x0, yDim, x1, yDim, 'cote'));
      g.push(ligne(x0, yDim - 4, x0, yDim + 4, 'cote'));
      g.push(ligne(x1, yDim - 4, x1, yDim + 4, 'cote'));
      g.push(texte((x0 + x1) / 2, yDim + 14, 'cote', esc(t.entraxe(nb(s))), 'middle'));
    } else {
      g.push(ligne(centre - (D * SCALE) / 2, yDim, centre + (D * SCALE) / 2, yDim, 'cote'));
      g.push(texte(centre, yDim + 14, 'cote', esc(t.diametre(nb(D))), 'middle'));
    }
  }

  // Vue en plan, à droite.
  g.push(texte(planCentre, planHaut - 18, 'texte-coupe', esc(t.vuePlan), 'middle'));
  const blocL = groupeL + D + 0.6;
  const blocY = (ny - 1) * s + D + 0.6;
  if (o.bloc) {
    g.push(
      `<rect class="bloc" x="${a(planCentre - (blocL * PLAN) / 2)}" y="${a(planY - (blocY * PLAN) / 2)}" width="${a(blocL * PLAN)}" height="${a(blocY * PLAN)}"/>`,
    );
  }

  const xMax = fileLaPlusChargee(r);
  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const xm = (i - (nx - 1) / 2) * s;
      const ym = (j - (ny - 1) / 2) * s;
      const charge = Math.abs(xm - xMax) < 1e-6;
      g.push(
        `<circle class="${charge ? 'plan-pieu charge-max' : 'plan-pieu'}" cx="${a(planCentre + xm * PLAN)}" cy="${a(planY + ym * PLAN)}" r="${a((D / 2) * PLAN)}"/>`,
      );
    }
  }

  if (o.bloc) {
    g.push(texte(planCentre, planBas + 22, 'texte-coupe', esc(t.bloc(nb(blocL), nb(blocY))), 'middle'));
  }
  const yCaption = planBas + (o.bloc ? 38 : 22);
  g.push(texte(planCentre, yCaption, 'texte-coupe', esc(t.chargesMax), 'middle'));
  g.push(texte(planCentre, yCaption + 16, 'texte-coupe', esc(t.entraxe(nb(s))), 'middle'));

  const largeur = PAD.gauche + coupeL + GAP + planL + PAD.droite;
  const hauteur = Math.max(yBas, yCaption + 16) + PAD.bas;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a(largeur)} ${a(hauteur)}" role="img" aria-label="${esc(t.aria)}">` +
    g.join('') +
    '</svg>'
  );
}

// --- Onglet Transversal ------------------------------------------------------

export interface OptionsTransversal {
  /** Nom d'une combinaison ELU, ou 'ELS'. */
  vue: string;
  y: boolean;
  M: boolean;
  V: boolean;
  p: boolean;
}

/** Résultat p-y de la vue : null si la combinaison n'a pas d'équilibre ou n'existe pas. */
export function resultatDeVue(r: ResultatTransversal, vue: string): ResultatPY | null {
  if (vue === 'ELS') return r.service;
  return (r.combinaisons.find((k) => k.nom === vue) ?? r.combinaisons[0])?.py ?? null;
}

/** Hauteur utile du dessin, en pixels : l'échelle s'adapte à la longueur du pieu. */
const H_TR = 440;
const COL_COUPE = 190;
const COL_DIAG = 150;

/**
 * Coupe du pieu et des couches, puis une colonne par diagramme (y, M, V, p avec ±p_f).
 * Même échelle verticale pour toutes les colonnes ; chaque diagramme a sa propre échelle
 * horizontale, sa valeur extrême est cotée.
 */
export function dessinTransversal(c: CalculTr, r: ResultatTransversal, o: OptionsTransversal): string {
  const t = textes().tr.dessin;
  const d = c.donnees;
  const L = Number.isFinite(r.longueur) && r.longueur > 0 ? r.longueur : 1;
  const S = H_TR / L;
  const yTop = PAD.haut + 46;
  const yBas = yTop + L * S;
  const Y = (z: number): number => yTop + z * S;
  const g: string[] = [];

  // Coupe : couches, nappe, pieu, charge.
  const x0 = PAD.gauche;
  let prof = 0;
  d.couches.forEach((k, i) => {
    const h = Number.isFinite(k.h) && k.h > 0 ? k.h : 0;
    g.push(`<rect class="couche couche-${i % 3}" x="${a(x0)}" y="${a(Y(prof))}" width="${COL_COUPE}" height="${a(h * S)}"/>`);
    if (h * S > 16) g.push(texte(x0 + 6, Y(prof) + 14, 'texte-coupe', esc(k.nom)));
    prof += h;
  });
  g.push(ligne(x0, yTop, x0 + COL_COUPE, yTop, 'terrain'));
  if (Number.isFinite(d.zNappe) && d.zNappe > 0 && d.zNappe < L) {
    g.push(`<g data-role="nappe">${ligne(x0, Y(d.zNappe), x0 + COL_COUPE, Y(d.zNappe), 'plan-neutre')}${texte(x0 + COL_COUPE - 4, Y(d.zNappe) - 4, 'texte-coupe', esc(t.nappe), 'end')}</g>`);
  }
  const cx = x0 + COL_COUPE * 0.62;
  const larg = Math.max(8, Math.min(30, d.D * S));
  g.push(`<rect class="pieu" x="${a(cx - larg / 2)}" y="${a(yTop)}" width="${a(larg)}" height="${a(L * S)}"/>`);
  g.push(ligne(cx - 46, yTop - 10, cx - larg / 2 - 3, yTop - 10, 'charge'));
  g.push(`<path class="charge" d="M${a(cx - larg / 2 - 3)} ${a(yTop - 10)} l-7 -4 m7 4 l-7 4" fill="none"/>`);
  if (d.tete === 'encastree') g.push(texte(cx, yTop - 22, 'texte-coupe', esc(t.encastree), 'middle'));
  const py = resultatDeVue(r, o.vue);
  const comb = r.combinaisons.find((k) => k.nom === o.vue);
  const charge = o.vue === 'ELS'
    ? { H: d.efforts.HG + d.efforts.HQ, M: d.efforts.MG + d.efforts.MQ, N: d.efforts.NG + d.efforts.NQ }
    : comb ? { H: comb.Hd, M: comb.Md, N: comb.Nd } : { H: 0, M: 0, N: 0 };
  g.push(texte(x0, PAD.haut, 'texte-coupe', esc(`${o.vue} · ${t.charge(nb(charge.H), nb(charge.M), nb(charge.N))}`)));
  const xCote = x0 + COL_COUPE + 10;
  g.push(ligne(xCote, yTop, xCote, yBas, 'cote'));
  g.push(texte(xCote + 4, yBas + 14, 'cote', esc(t.longueur(nb(L))), 'middle'));

  let largeur = xCote + 20;
  if (py === null) {
    g.push(texte(x0, yBas + 32, 'texte-coupe', esc(t.sansEquilibre(o.vue))));
    largeur = Math.max(largeur, x0 + 420);
  } else {
    const diagrammes: { role: string; titre: string; v: number[]; fact: number; dec: number }[] = [];
    if (o.y) diagrammes.push({ role: 'y', titre: t.y, v: py.y, fact: 1000, dec: 1 });
    if (o.M) diagrammes.push({ role: 'M', titre: t.M, v: py.M, fact: 1, dec: 1 });
    if (o.V) diagrammes.push({ role: 'V', titre: t.V, v: py.V, fact: 1, dec: 1 });
    if (o.p) diagrammes.push({ role: 'p', titre: t.p, v: py.p, fact: 1, dec: 0 });
    let xc = largeur + 20;
    for (const dg of diagrammes) {
      const v = dg.v.map((x) => (Number.isFinite(x) ? x * dg.fact : 0));
      const bornes = dg.role === 'p' ? py.pf.filter(Number.isFinite) : [];
      const max = Math.max(1e-9, ...v.map(Math.abs), ...bornes);
      const xm = xc + COL_DIAG / 2;
      const k = (COL_DIAG / 2 - 8) / max;
      g.push(texte(xm, yTop - 26, 'texte-coupe', esc(dg.titre), 'middle'));
      g.push(ligne(xm, yTop, xm, yBas, 'cote'));
      if (dg.role === 'p') {
        const droite = py.z.map((z, i) => `${a(xm + py.pf[i] * k)},${a(Y(z))}`).join(' ');
        const gauche = py.z.map((z, i) => `${a(xm - py.pf[i] * k)},${a(Y(z))}`).join(' ');
        g.push(`<g data-role="pf"><polyline class="pf" points="${droite}"/><polyline class="pf" points="${gauche}"/></g>`);
      }
      const pts = [`${a(xm)},${a(yTop)}`, ...py.z.map((z, i) => `${a(xm + v[i] * k)},${a(Y(z))}`), `${a(xm)},${a(yBas)}`].join(' ');
      let iMax = 0;
      for (let i = 1; i < v.length; i += 1) if (Math.abs(v[i]) > Math.abs(v[iMax])) iMax = i;
      const xv = xm + v[iMax] * k;
      g.push(
        `<g data-role="${dg.role}"><polygon class="diagramme diagramme-${dg.role}" points="${pts}"/>` +
          `<circle class="extreme" cx="${a(xv)}" cy="${a(Y(py.z[iMax]))}" r="2.5"/>` +
          texte(xv + (v[iMax] >= 0 ? 4 : -4), Y(py.z[iMax]) - 4, 'texte-coupe', esc(nb(Number(v[iMax].toFixed(dg.dec)))), v[iMax] >= 0 ? 'start' : 'end') +
          '</g>',
      );
      xc += COL_DIAG + 10;
    }
    largeur = xc;
  }
  const hauteur = yBas + 44;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a(largeur + PAD.droite)} ${a(hauteur)}" role="img" aria-label="${esc(t.aria)}">` +
    g.join('') +
    '</svg>'
  );
}
