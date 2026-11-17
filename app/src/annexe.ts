/**
 * Annexe nationale luxembourgeoise (lot E, audit R4). Module PUR.
 *
 * Profil 1re generation construit a partir du profil recommande de sol-ec7 et de la table
 * commune `AN_LU` d'aedificium-ui ; les tableaux propres aux pieux (A.6 a A.10) prennent la
 * meme source ILNAS, valeurs recommandees presumees tant que l'annexe n'est pas lue.
 */

import { sourceLu, valeurLu } from 'aedificium-ui';
import { clauseDeSource, profil1g, reetiqueter1g, type Profil1g } from 'sol-ec7';

export function profilLu1g(): Profil1g {
  return reetiqueter1g(
    profil1g(),
    'Luxembourg, ILNAS-EN 1997-1/AN-LU:2020 (valeurs présumées, à vérifier)',
    '2026-11-17',
    (v, chemin) => valeurLu('EN 1997-1', chemin, v, clauseDeSource(v.source)),
  );
}

/** Source luxembourgeoise d'une valeur recommandee des tableaux des pieux (jeu conserve). */
export function sourceLuPieux(sourceRecommandee: string): string {
  const jeu = /jeu R\d/.exec(sourceRecommandee)?.[0];
  return sourceLu('EN 1997-1', `${clauseDeSource(sourceRecommandee)}${jeu === undefined ? '' : `, ${jeu}`}`, true);
}
