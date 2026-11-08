/** Squelette (T1). Lit la saisie (chaines), appelle le noyau. Aucun calcul ici. */

import type { DonneesPieux, ResultatPieux } from '../../src/pieux';

export interface SaisieCouche {
  nom: string;
  h: string;
  tauDd: string;
  qs: string[];
}

export interface Saisie {
  execution: string;
  D: string;
  nx: string;
  ny: string;
  s: string;
  eta: string;
  ratioQbBloc: string;
  redistribution: boolean;
  couches: SaisieCouche[];
  qb: string[];
  VG: string;
  VQ: string;
  MG: string;
  MQ: string;
  Eeq: string;
  nu: string;
  Ep: string;
  sAdm: string;
  generation: '1re' | '2e';
  consequences: string;
  methode: string;
  base: string;
  baseTerrain: string;
  resistance: string;
  dAvg: string;
  profilNormatif: string;
  approche1: string;
  risque: string;
  densiteCpt: string;
  rigide: boolean;
  sondageProche: boolean;
}

export interface Calcul {
  saisie: Saisie;
  donnees: DonneesPieux;
}
export type Resultat = ResultatPieux;
export type Lecture = { ok: true; calcul: Calcul } | { ok: false; message: string };

const a = (): never => {
  throw new Error('a ecrire');
};
export const saisieParDefaut = (): Saisie => a();
export const lireSaisie = (_s: Saisie): Lecture => a();
export const verifier = (_c: Calcul): Resultat => a();
export const proposerRendement = (_s: Saisie): string => a();
export const ajouterCouche = (_s: Saisie): Saisie => a();
export const retirerCouche = (_s: Saisie, _i: number): Saisie => a();
export const ajouterProfil = (_s: Saisie): Saisie => a();
export const retirerProfil = (_s: Saisie): Saisie => a();
export const serialiser = (_s: Saisie): string => a();
export const relire = (_t: string): Saisie => a();
