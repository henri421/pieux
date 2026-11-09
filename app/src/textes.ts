/**
 * Les textes affiches, en francais et en anglais. PUR.
 * Aucun texte ne se lit au chargement d'un module : toujours `textes()` ou `phrase()` au moment du rendu.
 * Les indices s'ecrivent en notation (`F_d`, `γ_Rd,pile`) : `notationHtml` les met en `<sub>` au rendu.
 *
 * `messages`, `clauses`, `verifications` et `note` ne changent pas (note.ts les lit). L'executant ajoute
 * `refus` et `page` (T1), `vue`, `entrees`, `resultats` (T2), `dessin` (T3), a FR et a EN, et les regles
 * de `phrase` (T4).
 */

import { langueCourante, traducteur } from 'aedificium-ui';

const FR = {
  messages: {
    rienAExporter: 'Aucun calcul valide à exporter : corriger la saisie.',
    nouvelleVersion: 'Une nouvelle version est disponible. Recharger maintenant ?',
  },
  clauses: {
    1: { compression: 'EN 1997-1:2004, 7.6.2', traction: 'EN 1997-1:2004, 7.6.3', groupe: 'EN 1997-1:2004, 7.6.2.1', tassement: 'EN 1997-1:2004, 7.6.4' },
    2: { compression: 'EN 1997-3:2025, 6.6.2.1', traction: 'EN 1997-3:2025, 6.6.2.2', groupe: 'EN 1997-3:2025, 6.5.5 et 6.6.3', tassement: 'EN 1997-3:2025, 6.7' },
  },
  refus: {
    nombre: (champ: string, brut: string) => `Le champ « ${champ} » n’est pas un nombre lisible (« ${brut} »).`,
    couche: (couche: string, champ: string, brut: string) =>
      `Couche « ${couche} » : le champ « ${champ} » n’est pas un nombre lisible (« ${brut} »).`,
    format: (recu: string, attendu: string) => `Format de fichier inconnu (« ${recu} ») : attendu « ${attendu} ».`,
    champs: {
      D: 'Diamètre D',
      nx: 'Files selon x',
      ny: 'Files selon y',
      s: 'Entraxe s',
      eta: 'Rendement η',
      ratioQbBloc: 'Rapport q_b,bloc / q_b',
      h: 'Épaisseur',
      tauDd: 'τ_dd',
      qs: 'q_s',
      qb: (p: number) => `q_b du profil P${p}`,
      VG: 'V_G',
      VQ: 'V_Q',
      MG: 'M_G',
      MQ: 'M_Q',
      Eeq: 'Module équivalent E_eq',
      nu: 'Coefficient de Poisson ν',
      Ep: 'Module du fût E_p',
      sAdm: 'Tassement admissible',
      dAvg: 'Espacement moyen des profils',
    },
  },
  page: {
    elementAbsent: (selecteur: string) => `Élément de page absent : ${selecteur}.`,
  },
  vue: {
    nonCalculable: 'non calculable',
    sansObjet: 'Sans objet',
    isole: 'Pieu isolé',
    groupe: 'Groupe',
    service: 'Service',
    gouvernant: 'gouvernant',
    compression: 'Compression',
    traction: 'Traction',
    resistance: 'Résistance verticale',
    tassement: 'Tassement',
    alertes: 'Alertes',
    compressionCorps: (fd: string, rd: string) => `F_cd = ${fd} kN ≤ R_cd = ${rd} kN.`,
    tractionCorps: (ftd: string, rtd: string) => `F_td = ${ftd} kN ≤ R_td = ${rtd} kN.`,
    tractionSansObjet: (nmin: string, rtd: string) =>
      `Aucun pieu tendu (N_min = ${nmin} kN). R_td = ${rtd} kN pour mémoire.`,
    groupeCorps: (fd: string, rd: string) => `F_d = ${fd} kN ≤ R_group,d = ${rd} kN.`,
    groupeRendement: (somme: string, bloc: string) =>
      `Le rendement gouverne (η·n·R = ${somme} kN, R_bloc = ${bloc} kN).`,
    groupeBloc: (somme: string, bloc: string) =>
      `Le bloc gouverne (η·n·R = ${somme} kN, R_bloc = ${bloc} kN).`,
    tassementCorps: (s: string, sAdm: string) => `s = ${s} mm ≤ ${sAdm} mm.`,
    tassementSemelle: (isole: string, semelle: string) =>
      `Pieu isolé ${isole} mm, semelle équivalente ${semelle} mm.`,
    tassementIsole: (isole: string) => `Pieu isolé ${isole} mm.`,
  },
  entrees: {
    geometrie: 'Géométrie',
    materiaux: 'Matériaux',
    charges: 'Charges',
    hypotheses: 'Hypothèses',
    diametre: 'Diamètre',
    entraxe: 'Entraxe',
    longueur: 'Longueur',
    moduleEquiv: 'Module équivalent',
    modulePieu: 'Module du fût',
    poisson: 'Coefficient de Poisson',
    vg: 'Effort vertical permanent',
    vq: 'Effort vertical variable',
    mg: 'Moment permanent',
    mq: 'Moment variable',
  },
  resultats: {
    profils: 'Résistances par profil',
    efforts: 'Efforts par file',
    coefficients: 'Coefficients et sources',
    hypotheses: 'Hypothèses',
    taux: 'Taux',
    colonneX: 'x',
  },
  verifications: {
    compression: 'Compression du pieu le plus chargé',
    traction: 'Traction du pieu le plus tendu',
    groupe: 'Résistance verticale du groupe',
    tassement: 'Tassement (estimation simple)',
  },
  note: {
    titreEntrees: 'Données',
    element: 'Pieux',
    legendeCoupe: 'Coupe à l’échelle et vue en plan du groupe.',
    coefficients: 'Coefficients',
    profils: 'Résistances par profil (kN)',
    colonnesProfils: ['Profil', 'R_s', 'R_b', 'R_c,calc', 'R_bloc'],
    efforts: (combinaison: string) => `Efforts par file, ${combinaison}`,
    colonnesEfforts: ['x (m)', 'N_d (kN)', 'F_d (kN)', 'taux'],
    hypotheses: [
      'Les résistances unitaires q_b et q_s sont saisies : leur méthode d’obtention relève de l’ingénieur.',
      'Une couche qui tasse (τ_dd > 0) ne compte pas dans le frottement positif ; D_rep = π·D·Σ(τ_dd·h).',
      'Semelle rigide : N = V/n ± M·x/Σx².',
      'Bloc : périmètre × Σ(q_s·h) + aire × q_b,bloc, avec les mêmes facteurs de corrélation que le pieu (choix de l’outil).',
      'Le rendement η est saisi ; la formule de Converse-Labarre proposée est empirique et hors Eurocode.',
      'Tassement du pieu isolé : N·L/(E_p·A) + N·(1−ν²)/(E_eq·D), tout l’effort à la pointe. Groupe : semelle équivalente au contour du bloc, raccourcissement ajouté, maximum avec le pieu isolé. Combinaison caractéristique, frottement négatif non compté.',
      'Non traités : effort transversal, radier sur pieux, chargement cyclique, résistance structurale du fût.',
    ],
    combinaisons: {
      1: ['Combinaisons de l’approche retenue : EN 1997-1:2004, 2.4.7.3.4 ; avec l’ANB 2022, DA1 combinaison 1, le jeu R4 n’étant pas déterminant.'],
      2: ['VC1 (EN 1997-3:2025, tableaux 6.9 et 6.10), approche par les résistances ; frottement négatif multiplié par γ_F,drag.'],
    },
  },
};

export type Textes = typeof FR;

const EN: Textes = {
  messages: {
    rienAExporter: 'No valid calculation to export: correct the input.',
    nouvelleVersion: 'A new version is available. Reload now?',
  },
  clauses: FR.clauses,
  refus: {
    nombre: (champ: string, brut: string) => `Field “${champ}” is not a readable number (“${brut}”).`,
    couche: (couche: string, champ: string, brut: string) =>
      `Layer “${couche}”: field “${champ}” is not a readable number (“${brut}”).`,
    format: (recu: string, attendu: string) => `Unknown file format (“${recu}”); expected “${attendu}”.`,
    champs: {
      D: 'Diameter D',
      nx: 'Rows along x',
      ny: 'Rows along y',
      s: 'Spacing s',
      eta: 'Efficiency η',
      ratioQbBloc: 'Ratio q_b,block / q_b',
      h: 'Thickness',
      tauDd: 'τ_dd',
      qs: 'q_s',
      qb: (p: number) => `q_b of profile P${p}`,
      VG: 'V_G',
      VQ: 'V_Q',
      MG: 'M_G',
      MQ: 'M_Q',
      Eeq: 'Equivalent modulus E_eq',
      nu: 'Poisson ratio ν',
      Ep: 'Shaft modulus E_p',
      sAdm: 'Allowable settlement',
      dAvg: 'Average profile spacing',
    },
  },
  page: {
    elementAbsent: (selecteur: string) => `Missing page element: ${selecteur}.`,
  },
  vue: {
    nonCalculable: 'not calculable',
    sansObjet: 'Not applicable',
    isole: 'Single pile',
    groupe: 'Group',
    service: 'Serviceability',
    gouvernant: 'governing',
    compression: 'Compression',
    traction: 'Tension',
    resistance: 'Vertical resistance',
    tassement: 'Settlement',
    alertes: 'Warnings',
    compressionCorps: (fd: string, rd: string) => `F_cd = ${fd} kN ≤ R_cd = ${rd} kN.`,
    tractionCorps: (ftd: string, rtd: string) => `F_td = ${ftd} kN ≤ R_td = ${rtd} kN.`,
    tractionSansObjet: (nmin: string, rtd: string) =>
      `No pile in tension (N_min = ${nmin} kN). R_td = ${rtd} kN for information.`,
    groupeCorps: (fd: string, rd: string) => `F_d = ${fd} kN ≤ R_group,d = ${rd} kN.`,
    groupeRendement: (somme: string, bloc: string) =>
      `Efficiency governs (η·n·R = ${somme} kN, R_block = ${bloc} kN).`,
    groupeBloc: (somme: string, bloc: string) =>
      `The block governs (η·n·R = ${somme} kN, R_block = ${bloc} kN).`,
    tassementCorps: (s: string, sAdm: string) => `s = ${s} mm ≤ ${sAdm} mm.`,
    tassementSemelle: (isole: string, semelle: string) =>
      `Single pile ${isole} mm, equivalent footing ${semelle} mm.`,
    tassementIsole: (isole: string) => `Single pile ${isole} mm.`,
  },
  entrees: {
    geometrie: 'Geometry',
    materiaux: 'Materials',
    charges: 'Loads',
    hypotheses: 'Assumptions',
    diametre: 'Diameter',
    entraxe: 'Spacing',
    longueur: 'Length',
    moduleEquiv: 'Equivalent modulus',
    modulePieu: 'Shaft modulus',
    poisson: 'Poisson ratio',
    vg: 'Permanent vertical load',
    vq: 'Variable vertical load',
    mg: 'Permanent moment',
    mq: 'Variable moment',
  },
  resultats: {
    profils: 'Resistances per profile',
    efforts: 'Forces per row',
    coefficients: 'Factors and sources',
    hypotheses: 'Assumptions',
    taux: 'Ratio',
    colonneX: 'x',
  },
  verifications: {
    compression: 'Compression of the most loaded pile',
    traction: 'Tension of the most tensioned pile',
    groupe: 'Vertical resistance of the group',
    tassement: 'Settlement (simple estimate)',
  },
  note: {
    titreEntrees: 'Input',
    element: 'Piles',
    legendeCoupe: 'Section to scale and plan of the group.',
    coefficients: 'Factors',
    profils: 'Resistances per profile (kN)',
    colonnesProfils: ['Profile', 'R_s', 'R_b', 'R_c,calc', 'R_block'],
    efforts: (combinaison: string) => `Forces per row, ${combinaison}`,
    colonnesEfforts: ['x (m)', 'N_d (kN)', 'F_d (kN)', 'ratio'],
    hypotheses: [
      'Unit resistances q_b and q_s are input: how they are obtained is the engineer’s responsibility.',
      'A settling layer (τ_dd > 0) does not count in positive shaft friction; D_rep = π·D·Σ(τ_dd·h).',
      'Rigid cap: N = V/n ± M·x/Σx².',
      'Block: perimeter × Σ(q_s·h) + area × q_b,block, with the same correlation factors as the pile (choice of this tool).',
      'The efficiency η is input; the Converse-Labarre formula offered is empirical and outside the Eurocode.',
      'Single pile settlement: N·L/(E_p·A) + N·(1−ν²)/(E_eq·D), all load at the base. Group: equivalent footing on the block outline, shortening added, maximum with the single pile. Characteristic combination, downdrag not counted.',
      'Not covered: transverse load, piled raft, cyclic loading, structural resistance of the shaft.',
    ],
    combinaisons: {
      1: ['Combinations of the chosen approach: EN 1997-1:2004, 2.4.7.3.4; with ANB 2022, DA1 combination 1, set R4 not being decisive.'],
      2: ['VC1 (EN 1997-3:2025, Tables 6.9 and 6.10), Resistance Factor Approach; drag force multiplied by γ_F,drag.'],
    },
  },
};

export function textes(): Textes {
  return langueCourante() === 'en' ? EN : FR;
}

export function ponctuer(s: string): string {
  return langueCourante() === 'en' ? s.replace(/ ([:;])(?=\s)/g, '$1') : s;
}

/** Phrases du noyau (refus, alertes, sources) traduites en anglais : regles ajoutees en T4. */
const EXACTES: Record<string, string> = {};
const REGLES: [RegExp, (_m: string, ...g: string[]) => string][] = [];
export const phrase = traducteur(EXACTES, REGLES);
