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

---

# Pieu sous charge transversale (lot F, PLAN-transversal.md)

Implémenté par Claude (séance maître) les 20 et 21/11/2026, à la demande de l'utilisateur (« Do it here »).

## T1 : noyau (`src/transversal.ts`)

**Fichiers** : `src/transversal.ts` (nouveau).

**Décisions** : solveur en bande (demi-largeur 3), moments par la statique, mécanisme de Brinch Hansen
par bisection avec la cellule de z_r coupée exactement, comme la référence Python.

**Points douteux** : le transtypage du test `tests/transversal.test.ts` est passé à `as unknown as`
(erreur de typage seule, aucune assertion touchée ; consigné dans le message du commit T1).

**Statut** : `npx vitest run tests/transversal.test.ts` : 24/24 passent.

## T2 à T4 : saisie, dessin, note

**Fichiers** : `app/src/form.ts`, `app/src/dessin.ts`, `app/src/note.ts`, `app/src/textes.ts`, `app/src/style.css`.

**Décisions**
- `lireNorme` est extraite de `lireSaisie`, sans changement de comportement, et partagée avec `lireTransversal`.
- Une couche ajoutée reçoit les propriétés transversales du remblai du cas d'exemple.
- Dessin : une échelle verticale commune, une échelle horizontale par diagramme. La colonne p est
  mise à l'échelle sur 2·max|p|, et ±p_f y est écrêté, sinon le p_f profond du sable (plusieurs
  milliers de kPa) écrase p.
- Note : la vue retenue pour la figure et le tableau des valeurs est la combinaison de M_Ed. Le tableau
  p_f M2 prend les facteurs de sol les plus forts des combinaisons.
- Hypothèse « Non traités » de la note axiale : « effort transversal » renvoie à l'onglet Transversal.

**Statut** : `npx vitest run tests/app/transversal-app.test.ts` : 12/12 passent.

## T5 : interface

**Fichiers** : `app/index.html`, `app/en/index.html`, `app/src/main.ts`, `app/src/vue.ts`, `app/src/textes.ts`,
`app/src/style.css`.

**Décisions**
- Boutons « Axial | Transversal » en tête de saisie (`data-mode`). Les zones propres à un onglet portent
  `data-mode-seul`. Un champ caché `data-champ="mode"` satisfait le test de page existant (chaque clé de la
  saisie a son `data-champ`).
- Mode transversal :
  - Pieu : EI, tête, M_Rd.
  - Charges en tête G/Q.
  - Sol : nappe, tableau de sol (nom et h communs, comportement, γ, γ_sat, φ′, c′, c_u, y_f), fluage.
  - Diagrammes : vues (a), (b), ELS et cases y, M, V, p.
  - Cartes : résistance par combinaison, moment maximal (jauge si M_Rd), plastification, service.
  - Volets : les tableaux de la note, les coefficients, les hypothèses.
- Les sorties suivent l'onglet actif : note PDF/HTML, SVG, CSV (blocs et tableaux de la note), JSON.
- **Correction hors périmètre (bug existant)** : dans l'onglet Axial, les champs nom, h et τ_dd des couches
  portaient `data-champ` au lieu de `data-sous`. Leurs saisies étaient perdues (écrites à la racine de la
  saisie). Ils portent maintenant `data-sous`. Vérifié au banc : h du sable passe bien dans la saisie.

**Points douteux**
- La rotation en tête est affichée avec son signe (négative pour H > 0, convention du degré de liberté).
- En 1re génération, DA2 reste dans la liste ; le noyau le refuse avec son message.

**Statut**
- `npm test` : 6 fichiers, 119 tests passent.
- `npm run typecheck` : sans erreur.
- `npm run build` : réussi.
- Banc (pieux-banc, port 5199), FR et EN : cartes (a) 0,061, (b) 0,079 (gouvernant), M_Ed 338,9 kN·m à
  3,5 m ; M_Rd 400 donne 0,847 ; tableau de sol, vues et options ; aucune erreur en console.
