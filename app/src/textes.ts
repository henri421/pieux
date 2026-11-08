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
