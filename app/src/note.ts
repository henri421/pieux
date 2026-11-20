/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui). PUR : aucun calcul.
 * Ecrit par la seance de conception ; l'executant ne le modifie pas.
 */

import { avertissement2eGeneration, avertissementAnnexeLu, type ElementNote, type LigneResultat, type NoteDeCalcul, type VerificationNote, nombreAffiche, tauxAffiche } from 'aedificium-ui';
import type { Calcul, CalculTr, Resultat } from './form';
import { pressionUltime, type ResultatTransversal, type SolDeCalcul } from '../../src/transversal';
import { coupe, dessinTransversal, resultatDeVue } from './dessin';
import { phrase, ponctuer, textes } from './textes';
import { blocsResultat, entreesParSection } from './vue';
import { VERSION_OUTIL } from './version';

const NORME_1RE = 'EN 1997-1:2004';
const NORME_1RE_ANB = 'EN 1997-1:2004, NBN EN 1997-1 ANB:2022';
const NORME_1RE_LU = 'EN 1997-1:2004, ILNAS-EN 1997-1/AN-LU:2020';
const NORMES_2E = 'EN 1997-3:2025, EN 1990:2023';

const bloc = (titre: string, lignes: LigneResultat[]): ElementNote => ({ type: 'bloc', bloc: { titre, lignes, note: null } });

function verificationsDe(r: Resultat): VerificationNote[] {
  const t = textes();
  const v = t.verifications;
  const cl = t.clauses[r.generation];
  const nom = (verification: string, combinaison: string) => ponctuer(`${verification}, ${phrase(combinaison)}`);
  const ligne = (n: string, clause: string, taux: number): VerificationNote => ({ nom: n, clause, taux, ok: taux <= 1 });
  const liste: VerificationNote[] = r.combinaisons.flatMap((c) => [
    ligne(nom(v.compression, c.nom), cl.compression, c.tauxCompression),
    ...(c.Ftd > 0 ? [ligne(nom(v.traction, c.nom), cl.traction, c.tauxTraction)] : []),
    ...(c.groupe ? [ligne(nom(v.groupe, c.nom), cl.groupe, c.groupe.taux)] : []),
  ]);
  liste.push(ligne(v.tassement, cl.tassement, r.tassement.taux));
  return liste;
}

function blocsCoefficients(r: Resultat): ElementNote[] {
  const t = textes();
  return r.combinaisons.map((c) =>
    bloc(
      ponctuer(`${t.note.coefficients}, ${phrase(c.nom)}`),
      c.coefficients.map((k) => ({ symbole: k.nom, libelle: phrase(k.source), valeur: nombreAffiche(k.valeur, 3) })),
    ),
  );
}

function tableaux(r: Resultat): ElementNote[] {
  const n = textes().note;
  const profils: ElementNote = {
    type: 'tableau',
    titre: n.profils,
    entetes: [...n.colonnesProfils],
    lignes: r.profils.map((p, i) => [
      `P${i + 1}`,
      nombreAffiche(p.Rs, 0),
      nombreAffiche(p.Rb, 0),
      nombreAffiche(p.Rc, 0),
      p.Rbloc === null ? '—' : nombreAffiche(p.Rbloc, 0),
    ]),
  };
  const efforts = r.combinaisons.map((c): ElementNote => ({
    type: 'tableau',
    titre: n.efforts(phrase(c.nom)),
    entetes: [...n.colonnesEfforts],
    lignes: c.efforts.map((e) => [nombreAffiche(e.x, 2), nombreAffiche(e.Nd, 1), nombreAffiche(e.Fd, 1), tauxAffiche(e.taux)]),
  }));
  return [profils, ...efforts];
}

export function noteDuCalcul(calcul: Calcul, r: Resultat, cartouche: { projet: string; element: string; date: string }): NoteDeCalcul {
  const n = textes().note;
  const entrees = entreesParSection(calcul);
  const [, ...detail] = blocsResultat(r);
  const norme = calcul.donnees.norme;
  return {
    cartouche: {
      version: VERSION_OUTIL,
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? n.element : cartouche.element,
      date: cartouche.date,
      norme: norme.generation === 2 ? NORMES_2E : norme.profil === 'anb' ? NORME_1RE_ANB : norme.annexe !== undefined ? NORME_1RE_LU : NORME_1RE,
      outil: 'pieux',
    },
    sections: {
      geometrie: [
        bloc(n.titreEntrees, entrees.geometrie),
        { type: 'figure', svg: coupe(calcul, r, { cotes: true, bloc: true, planNeutre: true }), legende: n.legendeCoupe },
      ],
      materiaux: [bloc(n.titreEntrees, entrees.materiaux)],
      hypotheses: [bloc(n.titreEntrees, entrees.hypotheses), { type: 'liste', items: [...n.hypotheses] }],
      charges: [bloc(n.titreEntrees, entrees.charges)],
      combinaisons: [{ type: 'liste', items: [...n.combinaisons[r.generation]] }, ...blocsCoefficients(r)],
      calculs: [...tableaux(r), ...detail.map((b): ElementNote => ({ type: 'bloc', bloc: b }))],
    },
    verifications: verificationsDe(r),
    avertissements: [
      ...(norme.generation === 2 ? [avertissement2eGeneration()] : []),
      ...(norme.generation === 1 && norme.profil === 'recommande' && norme.annexe !== undefined ? [avertissementAnnexeLu(false)].filter((a) => a !== '') : []), ...r.alertes.map((a) => phrase(a))],
  };
}

// --- Onglet Transversal ------------------------------------------------------

/** Indices des nœuds les plus proches de chaque multiple de 0,5 m (et de la pointe). */
function tousLesDemiMetres(z: number[]): number[] {
  const L = z[z.length - 1];
  const idx: number[] = [];
  for (let k = 0; k * 0.5 <= L + 1e-9; k += 1) {
    let best = 0;
    for (let i = 1; i < z.length; i += 1) if (Math.abs(z[i] - k * 0.5) < Math.abs(z[best] - k * 0.5)) best = i;
    if (!idx.includes(best)) idx.push(best);
  }
  if (!idx.includes(z.length - 1)) idx.push(z.length - 1);
  return idx;
}

/** Facteurs de sol les plus forts parmi les combinaisons (jeu M2), sinon M1. */
function solM2(r: ResultatTransversal): SolDeCalcul {
  let m: SolDeCalcul = { gPhi: 1, gC: 1, gCu: 1 };
  for (const k of r.combinaisons) {
    const v = (nom: string) => k.coefficients.find((x) => x.nom === nom)?.valeur ?? 1;
    if (v('γ_φ') > m.gPhi) m = { gPhi: v('γ_φ'), gC: v('γ_c'), gCu: v('γ_cu') };
  }
  return m;
}

export function noteTransversale(calcul: CalculTr, r: ResultatTransversal, cartouche: { projet: string; element: string; date: string }): NoteDeCalcul {
  const tt = textes();
  const n = tt.tr.note;
  const e = tt.tr.entrees;
  const d = calcul.donnees;
  const norme = d.norme;
  const vue = r.MEd.combinaison !== '' ? r.MEd.combinaison : r.combinaisons[0].nom;
  const py = resultatDeVue(r, vue);
  const f = (v: number, dec: number) => nombreAffiche(v, dec);

  const geometrie: LigneResultat[] = [
    { symbole: 'D', libelle: tt.entrees.diametre, valeur: `${f(d.D, 2)} m` },
    { symbole: 'L', libelle: tt.entrees.longueur, valeur: `${f(r.longueur, 2)} m` },
    { symbole: 'EI', libelle: e.EI, valeur: `${f(d.EI, 0)} kN·m²` },
    { symbole: '', libelle: e.tete, valeur: d.tete === 'encastree' ? e.encastree : e.libre },
    ...(d.MRd === null ? [] : [{ symbole: 'M_Rd', libelle: e.MRd, valeur: `${f(d.MRd, 1)} kN·m` }]),
  ];
  const sol: ElementNote = {
    type: 'tableau',
    entetes: [tt.resultats.couche, 'h (m)', 'γ / γ_sat', '', 'φ′ (°)', 'c′ (kPa)', 'c_u (kPa)', 'y_f'],
    lignes: d.couches.map((k) => [
      k.nom, f(k.h, 2), `${f(k.gamma, 1)} / ${f(k.gammaSat, 1)}`, e.comportement[k.comportement],
      k.comportement === 'draine' ? f(k.phi, 1) : '—', k.comportement === 'draine' ? f(k.c, 1) : '—',
      k.comportement === 'draine' ? '—' : f(k.cu, 1), e.yf[k.yf],
    ]),
  };
  const sols: LigneResultat[] = [
    { symbole: 'z_w', libelle: e.zNappe, valeur: `${f(d.zNappe, 2)} m` },
    { symbole: '', libelle: e.fluage, valeur: d.fluage ? e.oui : e.non },
  ];
  const ef = d.efforts;
  const charges: LigneResultat[] = [
    { symbole: 'H_G / H_Q', libelle: tt.refus.champs.HtG.replace(/_G/, ''), valeur: `${f(ef.HG, 1)} / ${f(ef.HQ, 1)} kN` },
    { symbole: 'M_G / M_Q', libelle: tt.refus.champs.MtG.replace(/_G/, ''), valeur: `${f(ef.MG, 1)} / ${f(ef.MQ, 1)} kN·m` },
    { symbole: 'N_G / N_Q', libelle: tt.refus.champs.NtG.replace(/_G/, ''), valeur: `${f(ef.NG, 1)} / ${f(ef.NQ, 1)} kN` },
  ];

  const m2 = solM2(r);
  const pasPf = Math.max(0.5, Math.ceil(r.longueur / 30 / 0.5) * 0.5);
  const lignesPf: string[][] = [];
  let base = 0;
  const bases = d.couches.map((k) => (base += k.h));
  for (let z = 0; z <= r.longueur + 1e-9; z += pasPf) {
    const i = bases.findIndex((b) => z <= b + 1e-9);
    lignesPf.push([f(z, 2), d.couches[i < 0 ? d.couches.length - 1 : i].nom, f(pressionUltime(d, z), 1), f(pressionUltime(d, z, m2), 1)]);
  }
  const tableauPf: ElementNote = { type: 'tableau', titre: n.pf, entetes: [...n.colonnesPf], lignes: lignesPf };
  const tableauComb: ElementNote = {
    type: 'tableau',
    titre: n.combinaisons,
    entetes: [...n.colonnesCombinaisons],
    lignes: [
      ...r.combinaisons.map((k) => [
        phrase(k.nom), f(k.Hd, 1), f(k.Md, 1), f(k.Nd, 1), f(k.resistance.H, 0), tauxAffiche(k.taux),
        k.py ? f(k.py.MEd, 1) : '—', k.py ? f(k.py.yTete * 1000, 1) : '—',
      ]),
      [n.service, f(ef.HG + ef.HQ, 1), f(ef.MG + ef.MQ, 1), f(ef.NG + ef.NQ, 1), '—', '—',
        r.service ? f(r.service.MEd, 1) : '—', r.service ? f(r.service.yTete * 1000, 1) : '—'],
    ],
  };
  const valeurs: ElementNote[] = py === null ? [] : [{
    type: 'tableau',
    titre: n.valeurs(phrase(vue)),
    entetes: [...n.colonnesValeurs],
    lignes: tousLesDemiMetres(py.z).map((i) => [
      f(py.z[i], 2), f(py.y[i] * 1000, 2), f(py.M[i], 1), f(py.V[i], 1), f(py.p[i], 1), f(py.pf[i], 1),
    ]),
  }];
  const coefficients = r.combinaisons.map((k) =>
    bloc(ponctuer(`${tt.note.coefficients}, ${phrase(k.nom)}`), k.coefficients.map((x) => ({ symbole: x.nom, libelle: phrase(x.source), valeur: nombreAffiche(x.valeur, 3) }))),
  );

  const verifications: VerificationNote[] = r.combinaisons.map((k) => ({
    nom: n.verification(phrase(k.nom)), clause: n.clauseTr[r.generation], taux: k.taux, ok: k.taux <= 1,
  }));
  if (r.tauxStructure !== null) verifications.push({ nom: n.verificationM, clause: n.clauseM, taux: r.tauxStructure, ok: r.tauxStructure <= 1 });

  return {
    cartouche: {
      version: VERSION_OUTIL,
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? n.element : cartouche.element,
      date: cartouche.date,
      norme: norme.generation === 2 ? NORMES_2E : norme.profil === 'anb' ? NORME_1RE_ANB : norme.annexe !== undefined ? NORME_1RE_LU : NORME_1RE,
      outil: 'pieux',
    },
    sections: {
      geometrie: [
        bloc(tt.note.titreEntrees, geometrie),
        { type: 'figure', svg: dessinTransversal(calcul, r, { vue, y: true, M: true, V: true, p: true }), legende: n.legende(phrase(vue)) },
      ],
      materiaux: [sol, bloc(tt.note.titreEntrees, sols)],
      hypotheses: [{ type: 'liste', items: [...n.hypotheses] }],
      charges: [bloc(tt.note.titreEntrees, charges)],
      combinaisons: [{ type: 'liste', items: [...(r.generation === 2 ? n.combinaisons2 : n.combinaisons1)] }, ...coefficients],
      calculs: [tableauComb, tableauPf, ...valeurs],
    },
    verifications,
    avertissements: [
      ...(norme.generation === 2 ? [avertissement2eGeneration()] : []),
      ...(norme.generation === 1 && norme.profil === 'recommande' && norme.annexe !== undefined ? [avertissementAnnexeLu(false)].filter((a) => a !== '') : []),
      ...r.alertes.map((a) => phrase(a)),
    ],
  };
}
