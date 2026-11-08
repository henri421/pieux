/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui). PUR : aucun calcul.
 * Ecrit par la seance de conception ; l'executant ne le modifie pas.
 */

import { type ElementNote, type LigneResultat, type NoteDeCalcul, type VerificationNote, nombreAffiche, tauxAffiche } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { coupe } from './dessin';
import { phrase, ponctuer, textes } from './textes';
import { blocsResultat, entreesParSection } from './vue';

const NORME_1RE = 'EN 1997-1:2004';
const NORME_1RE_ANB = 'EN 1997-1:2004, NBN EN 1997-1 ANB:2022';
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
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? n.element : cartouche.element,
      date: cartouche.date,
      norme: norme.generation === 2 ? NORMES_2E : norme.profil === 'anb' ? NORME_1RE_ANB : NORME_1RE,
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
    avertissements: r.alertes.map((a) => phrase(a)),
  };
}
