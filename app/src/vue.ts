/** Squelette (T2). Mise en forme pure : aucun calcul. */

import type { BlocResultat, LigneResultat } from 'aedificium-ui';
import type { Calcul, Resultat, Saisie } from './form';

const a = (): never => {
  throw new Error('a ecrire');
};
export const entreesParSection = (_c: Calcul): Record<'geometrie' | 'materiaux' | 'charges' | 'hypotheses', LigneResultat[]> => a();
export const blocEntrees = (_c: Calcul): LigneResultat[] => a();
export const blocsResultat = (_r: Resultat): BlocResultat[] => a();
export const verdictsHtml = (_r: Resultat): string => a();
export const voletsHtml = (_r: Resultat): string => a();
export const couchesHtml = (_s: Saisie): string => a();
export const messageDErreur = (_e: unknown): string => a();
