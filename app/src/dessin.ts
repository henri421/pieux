/**
 * Coupe et vue en plan du groupe de pieux, en SVG. PUR : uniquement des coordonnees.
 * Repère de la coupe : x vers la droite, y vers le bas (repère SVG). Une seule échelle
 * en x et en y ; la vue en plan, à droite, a sa propre échelle.
 */

import type { Calcul, Resultat } from './form';
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
  const coupeL = largeurSol * SCALE;
  const planL = largeurSol * PLAN;

  const yTop = PAD.haut + 40 + H_SEMELLE * SCALE;
  const yPointe = yTop + L * SCALE;
  const yBas = yTop + profondeur * SCALE;
  const centre = PAD.gauche + coupeL / 2;
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
