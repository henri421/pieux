# Pieux : journal de l'interface

## T1 interface

- **Fichiers modifiés** : `app/src/form.ts`, `app/src/main.ts`, `app/src/textes.ts`, `app/index.html`, `app/en/index.html` (ébauche, à remplacer en T4).
- **Décisions** : aucune consignée, l'exécutant s'est arrêté à sa limite de 30 tours avant d'écrire ce journal.
- **Points douteux** : `main.ts` n'a pas encore été essayé à l'écran, `vue.ts` et `dessin.ts` n'existant pas à ce stade.
- **Statut des tests** (relancés par la séance Claude) : `lancer.mjs . interface.test` : T1 form et T1 page passent, T2 à T4 échouent encore (normal). `typecheck.mjs .` : 0 erreur.

## T2 interface

- **Fichiers modifiés** : `app/src/vue.ts`, `app/src/textes.ts`.
- **Décisions** : aucune consignée, limite de 30 tours atteinte.
- **Points douteux** : un test appelait `expect.arrayContaining`, absent du banc local ; la séance Claude a réécrit cette assertion avec `toContain`, à portée identique.
- **Statut des tests** (relancés par la séance Claude) : T1 et T2 passent, T3 et T4 échouent encore (normal). Typage : 0 erreur.

## T3 interface

- **Fichiers modifiés** : `app/src/dessin.ts` (coupe et vue en plan SVG), `app/src/textes.ts` (section `dessin` en FR et EN), `app/src/style.css` (styles du dessin), `HANDOFF.md`.
- **Décisions** : coupe à une seule échelle (24 px/m), vue en plan à droite à 42 px/m ; un `pieu` par file x ; un `plan-pieu` par pieu ; `charge-max` sur la file au `Nd` maximal de la combinaison au plus fort `tauxCompression` ; `zone-drag` par file et par couche où `tauDd > 0` ; plan neutre à la base de la dernière couche qui tasse ; aucun calcul de résistance, uniquement des coordonnées.
- **Points douteux** : aucun sur T3. Les 9 échecs restants sont tous dans le groupe T4 anglais (traductions), hors périmètre de cette tâche.
- **Statut des tests** : `lancer.mjs . interface.test` → groupe « T3 dessin et note » passe (45 réussis, 9 échecs, tous en T4 anglais). `typecheck.mjs .` → 0 erreur.

## T4 interface et audit

- **Fichiers modifiés** : `app/en/index.html`, `app/src/textes.ts` (exécutant, limite de 30 tours atteinte) ; `app/src/vue.ts`, `app/src/textes.ts`, `app/index.html`, `app/en/index.html` (audit, séance Claude).
- **Corrections d'audit** : balise `script` absente des deux pages (non couverte par les tests) ; signe `≤` affiché malgré un dépassement, remplacé par `>` ; sources et noms de coefficients non traduits ; libellés en dur dans `blocsResultat` ; indices bruts dans le dessin ; `console.log` de diagnostic retiré.
- **Statut des tests** : `lancer.mjs .` : 78 réussis, 0 échec. `typecheck.mjs .` : 0 erreur. Contrôle à l'écran : FR, EN, dépassement, bascule 1re/2e génération.

## Audit final

- `blocsResultat` ne commençait pas par la synthèse attendue par `note.ts`, qui saute le premier bloc : la compression manquait à la note. Bloc de synthèse ajouté.
- Mise en page des couches, des volets et des libellés de la coupe reprise après contrôle à l'écran.
- `lancer.mjs .` : 78 réussis, 0 échec. `typecheck.mjs .` : 0 erreur. Note de calcul produite et contrôlée : les quatre vérifications y figurent.
