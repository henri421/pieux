// Lot E (audit R4) : profil luxembourgeois de la 1re generation (valeurs recommandees presumees, sources AN-LU).
import { describe, expect, it } from 'vitest';
import { noteDeCalculHtml, texteVisible } from 'aedificium-ui';
import { lireSaisie, relire, saisieParDefaut, serialiser, verifier } from '../../app/src/form';
import { sourceLuPieux } from '../../app/src/annexe';
import { noteDuCalcul } from '../../app/src/note';

describe('annexe luxembourgeoise (pieux)', () => {
  it('source des tableaux des pieux : clause et jeu conserves', () => {
    expect(sourceLuPieux('EN 1997-1:2004, tableau A.7, jeu R2, valeur recommandée')).toBe(
      'ILNAS-EN 1997-1/AN-LU:2020, tableau A.7, jeu R2 : valeur recommandée présumée retenue, non vérifiée sur l’annexe',
    );
  });

  it('meme resultat que le profil recommande, note et sources luxembourgeoises', () => {
    const base = { ...saisieParDefaut(), generation: '1re' as const };
    const lu = { ...base, profilNormatif: 'lu' };
    expect(relire(serialiser(lu)).profilNormatif).toBe('lu');
    const lr = lireSaisie(base);
    const ll = lireSaisie(lu);
    if (!lr.ok || !ll.ok) throw new Error('saisie refusee');
    const rr = verifier(lr.calcul);
    const rl = verifier(ll.calcul);
    expect(JSON.stringify(rl)).toContain('ILNAS-EN 1997-1/AN-LU:2020, tableau A.');
    const note = noteDuCalcul(ll.calcul, rl, { projet: 'P', element: 'E', date: '2026-11-17' });
    expect(note.cartouche.norme).toContain('AN-LU:2020');
    expect(note.avertissements?.some((a) => /^Annexe nationale luxembourgeoise/.test(a))).toBe(true);
    // Profil choisi en bloc : l'avertissement ne promet pas de modifier chaque coefficient.
    expect(note.avertissements?.some((a) => /ne permet pas de les modifier un à un/.test(a))).toBe(true);
    expect(note.avertissements?.some((a) => /vous pouvez modifier/.test(a))).toBe(false);
    const texte = texteVisible(noteDeCalculHtml(note, ''));
    expect(texte).toContain('ILNAS-EN 1997-1/AN-LU:2020');
    // Valeurs presumees egales aux recommandees : memes verdicts.
    expect(rl.gouvernant).toEqual(rr.gouvernant);
    expect(rl.combinaisons.map((c) => c.nom)).toEqual(rr.combinaisons.map((c) => c.nom));
  });
});
