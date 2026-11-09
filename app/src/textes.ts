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
  dessin: {
    aria: 'Coupe et vue en plan du groupe de pieux',
    vuePlan: 'Vue en plan',
    planNeutre: (d: string) => `plan neutre · ${d} m`,
    longueur: (l: string) => `L = ${l} m`,
    entraxe: (s: string) => `entraxe ${s} m`,
    diametre: (d: string) => `D = ${d} m`,
    bloc: (a: string, b: string) => `bloc ${a} × ${b} m`,
    chargesMax: 'pieux les plus chargés',
    charge: (vg: string, vq: string, mg: string, mq: string) =>
      `VG = ${vg} kN · VQ = ${vq} kN ; MG = ${mg} kN·m ; MQ = ${mq} kN·m`,
    coucheQ: (qs: string) => `qs = ${qs} kPa`,
    coucheTau: (t: string) => `τdd = ${t} kPa`,
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
    couche: 'Couche',
    nom: 'Nom',
    effort: 'Effort',
    resistance: 'Résistance',
    effortMin: 'Effort minimal',
    pourMemoire: 'Pour mémoire',
    tassement: 'Tassement',
    admissible: 'Admissible',
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
  dessin: {
    aria: 'Pile group section and plan view',
    vuePlan: 'Plan view',
    planNeutre: (d: string) => `neutral plane · ${d} m`,
    longueur: (l: string) => `L = ${l} m`,
    entraxe: (s: string) => `spacing ${s} m`,
    diametre: (d: string) => `D = ${d} m`,
    bloc: (a: string, b: string) => `block ${a} × ${b} m`,
    chargesMax: 'most loaded piles',
    charge: (vg: string, vq: string, mg: string, mq: string) =>
      `VG = ${vg} kN · VQ = ${vq} kN; MG = ${mg} kN·m; MQ = ${mq} kN·m`,
    coucheQ: (qs: string) => `qs = ${qs} kPa`,
    coucheTau: (t: string) => `τdd = ${t} kPa`,
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
    couche: 'Layer',
    nom: 'Name',
    effort: 'Force',
    resistance: 'Resistance',
    effortMin: 'Minimum force',
    pourMemoire: 'For information',
    tassement: 'Settlement',
    admissible: 'Allowable',
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
const NOMS_EN: Record<string, string> = {
  'Diamètre D': 'Diameter D',
  'Files selon x': 'Rows along x',
  'Files selon y': 'Rows along y',
  'Entraxe s': 'Spacing s',
  'Rendement η': 'Efficiency η',
  'Rapport q_b,bloc / q_b': 'Ratio q_b,block / q_b',
  'Épaisseur': 'Thickness',
  'τ_dd': 'τ_dd',
  'q_s': 'q_s',
  'V_G': 'V_G',
  'V_Q': 'V_Q',
  'M_G': 'M_G',
  'M_Q': 'M_Q',
  'Module équivalent E_eq': 'Equivalent modulus E_eq',
  'Coefficient de Poisson ν': 'Poisson ratio ν',
  'Module du fût E_p': 'Shaft modulus E_p',
  'Tassement admissible': 'Allowable settlement',
  'Espacement moyen des profils': 'Average profile spacing',
};

function nomEn(nom: string): string {
  return NOMS_EN[nom] ?? nom.replace(/^q_b du profil P(\d+)$/, 'q_b of profile P$1');
}

const EXACTES: Record<string, string> = {
  'γ_G (frottement négatif)': 'γ_G (downdrag)',
  'Un seul profil : les facteurs de corrélation les plus défavorables s’appliquent.':
    'Single profile: the most unfavourable correlation factors apply.',
  'Entraxe inférieur à 3 D : effets de groupe importants.':
    'Spacing less than 3 D: significant group effects.',
  'La pointe est dans une couche qui tasse.':
    'The base is in a settling layer.',
  'Tassement du groupe : estimation simple ; le 6.7 demande un modèle d’interaction non linéaire.':
    'Group settlement: simple estimate; 6.7 requires a non-linear interaction model.',
  'ξ_min gouverne avec moins de 5 profils et un CoV d’au moins 30 % : condition de 6.6.2.4.2 non remplie.':
    'ξ_min governs with fewer than 5 profiles and a CoV of at least 30 %: condition of 6.6.2.4.2 not met.',
  'Au moins une couche est requise.': 'At least one layer is required.',
  'Au moins un profil est requis.': 'At least one profile is required.',
  'Un moment autour de y demande au moins deux files selon x.':
    'A moment about y requires at least two rows along x.',
  'Le modèle de terrain porte sur un seul profil de calcul.':
    'The ground model applies to a single calculation profile.',
  'Pieu non classé : les tableaux de la 1re génération ne le couvrent pas.':
    'Unclassified pile: the 1st-generation tables do not cover it.',
  'Pieu vissé : les tableaux recommandés A.6 à A.8 ne le couvrent pas (profil ANB requis).':
    'Screw pile: the recommended tables A.6 to A.8 do not cover it (ANB profile required).',
  'Aucune résistance sur au moins un profil : q_b et q_s y sont tous nuls.':
    'No resistance on at least one profile: q_b and q_s are both zero there.',
  'Bloc : périmètre × Σ(q_s·h) + aire × q_b,bloc, avec les mêmes facteurs de corrélation que le pieu (choix de l’outil).':
    'Block: perimeter × Σ(q_s·h) + area × q_b,block, with the same correlation factors as the pile (choice of this tool).',
  'EN 1990:2023, tableau A.1.8, valeur recommandée × k_F, EN 1990:2023, tableau A.1.9, valeur recommandée':
    'EN 1990:2023, Table A.1.8, recommended value × k_F, EN 1990:2023, Table A.1.9, recommended value',
  'EN 1990:2023, tableau A.1.8, valeur recommandée':
    'EN 1990:2023, Table A.1.8, recommended value',
  'EN 1997-1:2004, tableau A.10, valeur recommandée':
    'EN 1997-1:2004, Table A.10, recommended value',
  'EN 1997-1:2004, tableau A.3, valeur recommandée, jeu A1':
    'EN 1997-1:2004, Table A.3, recommended value, set A1',
  'EN 1997-1:2004, tableau A.3, valeur recommandée, jeu A2':
    'EN 1997-1:2004, Table A.3, recommended value, set A2',
  'EN 1997-1:2004, tableau A.7, jeu R1, valeur recommandée':
    'EN 1997-1:2004, Table A.7, set R1, recommended value',
  'EN 1997-1:2004, tableau A.7, jeu R3, valeur recommandée':
    'EN 1997-1:2004, Table A.7, set R3, recommended value',
  'EN 1997-1:2004, tableau A.7, jeu R4, valeur recommandée':
    'EN 1997-1:2004, Table A.7, set R4, recommended value',
  'EN 1997-3:2025, tableau 6.10': 'EN 1997-3:2025, Table 6.10',
  'EN 1997-3:2025, tableau 6.10, classe replacement':
    'EN 1997-3:2025, Table 6.10, replacement class',
  'EN 1997-3:2025, tableau 6.12 ; γ_Rd,group = 1,0':
    'EN 1997-3:2025, Table 6.12; γ_Rd,group = 1,0',
  'EN 1997-3:2025, tableau 6.4': 'EN 1997-3:2025, Table 6.4',
  'EN 1997-3:2025, tableau 6.6': 'EN 1997-3:2025, Table 6.6',
  'NBN EN 1997-1 ANB:2022, tableau A.10 ANB':
    'NBN EN 1997-1 ANB:2022, Table A.10 ANB',
  'NBN EN 1997-1 ANB:2022, tableau A.3 ANB, jeu A1':
    'NBN EN 1997-1 ANB:2022, Table A.3 ANB, set A1',
  'NBN EN 1997-1 ANB:2022, tableau A.7 ANB, jeu R1':
    'NBN EN 1997-1 ANB:2022, Table A.7 ANB, set R1',
  'Le rendement η est saisi ; la formule de Converse-Labarre proposée est empirique et hors Eurocode.':
    'The efficiency η is input; the Converse-Labarre formula offered is empirical and outside the Eurocode.',
  'Les résistances unitaires q_b et q_s sont saisies : leur méthode d’obtention relève de l’ingénieur.':
    'Unit resistances q_b and q_s are input: how they are obtained is the engineer’s responsibility.',
  'Non traités : effort transversal, radier sur pieux, chargement cyclique, résistance structurale du fût.':
    'Not covered: transverse load, piled raft, cyclic loading, structural resistance of the shaft.',
  'Semelle rigide : N = V/n ± M·x/Σx².':
    'Rigid cap: N = V/n ± M·x/Σx².',
  'Tassement du pieu isolé : N·L/(E_p·A) + N·(1−ν²)/(E_eq·D), tout l’effort à la pointe. Groupe : semelle équivalente au contour du bloc, raccourcissement ajouté, maximum avec le pieu isolé. Combinaison caractéristique, frottement négatif non compté.':
    'Single pile settlement: N·L/(E_p·A) + N·(1−ν²)/(E_eq·D), all load at the base. Group: equivalent footing on the block outline, shortening added, maximum with the single pile. Characteristic combination, downdrag not counted.',
  'Une couche qui tasse (τ_dd > 0) ne compte pas dans le frottement positif ; D_rep = π·D·Σ(τ_dd·h).':
    'A settling layer (τ_dd > 0) does not count in positive shaft friction; D_rep = π·D·Σ(τ_dd·h).',
};

const REGLES: [RegExp, (_m: string, ...g: string[]) => string][] = [
  [
    /^Tassement du groupe\s*:\s*estimation simple\s*;\s*le 6\.7 demande un modèle d[’'`]interaction non linéaire\.$/,
    () => 'Group settlement: simple estimate; 6.7 requires a non-linear interaction model.',
  ],
  [
    /^Aucun pieu tendu \(N_min = (.+) kN\)\. R_td = (.+) kN pour mémoire\.$/,
    (_m, nMin, rtd) => `No pile in tension (N_min = ${nMin} kN). R_td = ${rtd} kN for information.`,
  ],
  [
    /^Le rendement gouverne \(η·n·R = (.+) kN, R_bloc = (.+) kN\)\.$/,
    (_m, somme, bloc) => `Efficiency governs (η·n·R = ${somme} kN, R_block = ${bloc} kN).`,
  ],
  [
    /^Pieu isolé (.+) mm, semelle équivalente (.+) mm\.$/,
    (_m, isole, semelle) => `Single pile ${isole} mm, equivalent footing ${semelle} mm.`,
  ],
  [
    /^Pieu isolé (.+) mm\.$/,
    (_m, isole) => `Single pile ${isole} mm.`,
  ],
  [
    /^CoV de (.+) % : le tableau 6\.6 suppose un CoV d’au plus 12 %\.$/,
    (_m, cov) => `CoV of ${cov} %: Table 6.6 assumes a CoV of at most 12 %.`,
  ],
  [
    /^Rendement invalide : (.+) \(attendu dans \]0 ; 1\]\)\.$/,
    (_m, v) => `Invalid efficiency: ${v} (expected within ]0; 1]).`,
  ],
  [/^ν invalide : (.+)\.$/, (_m, v) => `Invalid ν: ${v}.`],
  [/^Densité de CPT inconnue : (.+)\.$/, (_m, v) => `Unknown CPT density: ${v}.`],
  [
    /^(.+) invalide : (.+) \(entier ≥ 1 attendu\)\.$/,
    (_m, nom, v) => `Invalid ${nomEn(nom)}: ${v} (integer ≥ 1 expected).`,
  ],
  [
    /^(.+) invalide : (.+) \(attendu (>|≥) (.+)\)\.$/,
    (_m, nom, v, strict, min) => `Invalid ${nomEn(nom)}: ${v} (expected ${strict} ${min}).`,
  ],
  [
    /^(.+) : (.+) valeurs de q_s pour (.+) profils\.$/,
    (_m, nom, nValeurs, nProfils) =>
      `${nomEn(nom)}: ${nValeurs} q_s values for ${nProfils} profiles.`,
  ],
];
const traduire = traducteur(EXACTES, REGLES);
export const phrase = traduire;
