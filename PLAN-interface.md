# Pieux : plan de l'interface

Rédigé le 2026-11-08. Noyau écrit (`src/pieux.ts`). Maquette validée : `plan-webaedificium/maquette-pieux.html`.
Gabarit : `sol-renforce/app/`. Tests : `tests/app/interface.test.ts`, un `describe` par tâche.

Ni `note.ts`, ni `export.ts`, ni les parties `messages`, `clauses`, `verifications`, `note` de `textes.ts` ne se modifient.
L'interface ne calcule rien : le rendement vient de `rendementConverseLabarre` du noyau.

## Contrat

- `form.ts` : types déjà en place. Défauts = cas de la maquette, nombres en virgule sans zéro inutile (`D: '0,6'`, `execution: 'fore'`,
  `nx: '3'`, `ny: '2'`, `s: '1,8'`, `eta: '0,76'`, `ratioQbBloc: '1'`, `redistribution: false`, trois couches `Remblai` h 3, τ 20, qs 0 ;
  `Argile` h 5, qs 40/35/45 ; `Sable` h 6, qs 80/70/75 ; `qb` 2800/2400/2600 ; `VG` 2000, `VQ` 600, `MG` 0, `MQ` 400 ; `Eeq` 60, `nu` 0,3,
  `Ep` 30, `sAdm` 25 ; `generation: '2e'`, `consequences: 'CC2'`, `methode: 'modele-pieu'`, `base: 'sol'`, `baseTerrain: 'etendue'`,
  `resistance: 'separee'`, `dAvg: '30'`, `profilNormatif: 'recommande'`, `approche1: 'DA1'`, `risque: 'normal'`, `densiteCpt: '100'`,
  `rigide: false`, `sondageProche: false`). `lireSaisie` : `lireNombre` commun, refus nommant le champ (ou la couche). `profilNormatif: 'anb2022'` donne
  `profil: 'anb'`. Couches et profils : fonctions pures, jamais moins d'un élément ; `ajouterProfil` recopie le dernier profil.
- `vue.ts` : `data-groupe` `isole`, `groupe`, `service` ; `data-verification` `compression` (combinaison la plus chargée, son nom figure), `traction`
  (sans objet affiché si aucun pieu tendu, R_td pour mémoire), `groupe` (si n > 1), `tassement`. Classe `depasse` si taux > 1, jauge bornée,
  `tauxAffiche`. Le mot gouvernant une seule fois, sur la carte de `r.gouvernant`. Pas de verdict global. Alertes par `phrase`.
  Volets : profils (`data-profil`), efforts (`data-file`, combinaison la plus chargée), coefficients et sources, hypothèses (`textes().note.hypotheses`).
  `couchesHtml` : une carte par couche (`data-couche="i"` sur nom, h, τ_dd ; `data-qs="i:p"`), ligne de pointe (`data-qb="p"`), pas de tableau.
  Symboles d'entrée : `D`, `s`, `L`, `E_eq`, `V_G`, `V_Q`, `M_G`, `M_Q`, uniques entre sections.
- `dessin.ts` : classes de `export.ts`, une seule échelle en coupe, vue en plan à droite ; un `pieu` par file x, un `plan-pieu` par pieu,
  `charge-max` sur la file la plus chargée, une `zone-drag` par file et couche qui tasse.
- `main.ts` : gabarit `sol-renforce/app/src/main.ts`. Clés `'pieux/saisie'`, `'pieux:cartouche'`. Couches ré-rendues après chaque action.
- `index.html` : maquette ; `data-champ` pour chaque valeur simple, boutons `data-generation`, `data-groupe` sur les lignes 1re/2e,
  `data-si-profil`, `data-si-methode`.

## Tâches

| Tâche | Fichiers | Filtre | Gabarit |
| --- | --- | --- | --- |
| T1 | `form.ts`, `index.html`, `main.ts` | `T1` | `sol-renforce/app/src/form.ts`, `main.ts`, `index.html` lignes 1 à 60 |
| T2 | `vue.ts`, `textes.ts` (`vue`, `entrees`, `resultats`) | `T2` | `sol-renforce/app/src/vue.ts` lignes 1 à 120 |
| T3 | `dessin.ts`, fin de `style.css` | `T3` | la maquette, `sol-renforce/app/src/dessin.ts` lignes 1 à 60 |
| T4 | `en/index.html`, `textes.ts` (EN, `phrase`) | `T4` | `sol-renforce/app/en/index.html` |

Banc : `lancer.mjs . interface.test` puis `typecheck.mjs .` ; le fichier ne se charge pas avant T1. Une tâche est finie quand son `describe` (T1, T2...) passe ; les suivants peuvent encore échouer.

## Interdits pour l'exécutant

Modifier `src/`, `tests/`, `note.ts`, `export.ts`, `sol-ec7`, `sol-renforce`, `_banc-local` ; calculer dans `app/` ; ajouter une dépendance ; parcourir
au-delà des fichiers nommés ; `git push`, `git tag`. Pas de fond noir ni d'interface façon tableur. Une tâche par lancement ; `HANDOFF.md` par tâche.
Si un test paraît faux, s'arrêter et le signaler.
