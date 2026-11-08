/** Squelette (T3). Coupe et vue en plan, en SVG. PUR : uniquement des coordonnees. */

import type { Calcul, Resultat } from './form';

export interface OptionsCoupe {
  cotes: boolean;
  bloc: boolean;
  planNeutre: boolean;
}

export function coupe(_c: Calcul, _r: Resultat, _o: OptionsCoupe): string {
  throw new Error('a ecrire');
}
