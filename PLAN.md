# Pieux : plan du noyau

Rédigé le 2026-11-08, maquette validée : `plan-webaedificium/maquette-pieux.html`. Noyau seul ici ; l'interface
aura son plan, sur le gabarit du sol renforcé.

## Spécifications

Entrée : `verifierPieux(donnees)` de `src/pieux.ts`. Types dans ce fichier. Unités : m, kN, kPa ; `Eeq` en MPa, `Ep` en
GPa, tassements en mm.

Résistances q_b, q_s saisies par profil, D_rep = π·D·Σ(τ_dd·h) ; une couche avec τ_dd > 0 ne compte pas en frottement
positif. Semelle rigide : N = V/n ± M·x/Σx².

- **2e génération** (EN 1997-3:2025) : VC1 avec k_F ; 6.6.2.1 à 6.6.2.4, tableaux 6.1, 6.4, 6.6, 6.9, 6.10, 6.12 ;
  γ_F,drag sans k_F. Modèle de pieu (ξ interpolés entre colonnes de n, ajustés par d_avg, ×0,9 ≥ 1 si redistribution)
  ou modèle de terrain (un seul profil). Pointe et fût séparés ou total.
- **1re génération** : DA1 (R1, R4), DA2 (R2), DA3 (R3), tableaux A.6 à A.8 et A.10, ξ/1,1 si redistribution ; ou ANB 2022
  (DA1-1 seule, R4 non déterminant, tableaux A.6 à A.8-bis, A.10 selon densité CPT et rigidité). Vissé et non classé
  refusés hors du cadre de chaque table.
- **Groupe** : R_group = min(η·n·R_c ; R_bloc), bloc = périmètre × Σ(q_s·h) + aire × ratio × q_b, mêmes ξ que le pieu.
  2e : /(1,4 × 1,0). 1re : pointe et fût divisés par γ_b, γ_s.
- **Service** : voir hypothèses de la maquette.

Les tableaux de l'EN 1997-1:2004 sont hors du dossier des normes : à confronter au texte avant publication.

## Tâches

| Tâche | Fichiers | Test |
| --- | --- | --- |
| T1 | `src/pieux.ts` | `pieux.test` |

Attendus de `tests/pieux.test.ts` calculés à part en Python. Hors périmètre : transversal, radier, cyclique, fût béton.
