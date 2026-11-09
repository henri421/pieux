# pieux

Vérification d'un **pieu sous charge axiale et d'un groupe sous semelle rigide** selon l'**EN 1997** et
l'**EN 1990**, dans leurs **deux générations** : compression, traction, frottement négatif, résistance
du groupe (rupture en bloc et rendement) et tassement simple. Un bouton bascule d'une génération à
l'autre **sans rien ressaisir**.

Fait partie de la suite [Aedificium web](https://henri421.github.io/WebAedificium/).
Page publiée : <https://henri421.github.io/pieux/> (en anglais : `/en/`).

> **Aide au calcul. L'outil constate, il ne prescrit pas.** Valeurs recommandées des normes. q_b et q_s
> sont saisis par l'utilisateur, couche par couche et profil par profil. La 2ᵉ génération n'est applicable
> qu'une fois son annexe nationale publiée. **Les valeurs ont été comparées à un calcul indépendant, pas
> encore à un logiciel du commerce.** La vérification finale incombe à l'ingénieur du projet.

## Ce que l'outil rend

- **Résistances** par profil (fût, pointe, bloc), valeur représentative avec les facteurs de corrélation
  ξ, résistance de calcul en compression et en traction.
- **Efforts par file** sous l'effort vertical et le moment, frottement négatif compté dans l'action.
- **Groupe** : somme des résistances affectée du rendement saisi (Converse-Labarre proposé par un bouton,
  formule empirique hors Eurocode) et rupture en bloc.
- **2ᵉ génération** : EN 1997-3:2025, clause 6, modèle de pieu ou modèle de terrain, classes de
  conséquences CC1 à CC3.
- **1ʳᵉ génération** : DA1, DA2, DA3, profil recommandé ou NBN EN 1997-1 ANB:2022.
- **Tassement** : estimation simple à partir d'un module équivalent saisi, pieu isolé et semelle équivalente.
- **Coupe** à l'échelle et **vue en plan** ; un taux par vérification, sans verdict global.
- **Sorties** : note de calcul HTML produite par les mêmes fonctions que l'écran, coupe (SVG), résultats
  (CSV), saisie enregistrée (JSON).

## Choix déclarés

- Facteurs ξ interpolés entre les colonnes du tableau selon le nombre de profils.
- Coefficient partiel du frottement négatif appliqué sans k_F.
- Rupture en bloc avec les mêmes facteurs de corrélation que le pieu.
- Pieu vissé coulé en place : classé en déplacement partiel, l'annexe C.1 de l'EN 1997-3 le citant dans
  deux classes (choix prudent).
- Tassement du groupe : estimation simple ; le 6.7 de l'EN 1997-3 demande un modèle d'interaction non linéaire.

## Hors périmètre

Effort transversal (p-y), radier sur pieux, chargement cyclique, méthodes CPT ou pressiométrique (q_b et
q_s sont saisis), résistance structurale du fût : les efforts sont rendus, la vérification du béton se
fait avec l'outil de colonne de la suite.

## Origine des moteurs

Ce dépôt appelle deux paquets de la suite : `sol-ec7` et `aedificium-ui` (interface et note).
L'assemblage est dans `src/pieux.ts`.

## Développement

```bash
npm install
npm run typecheck
npm test
npm run build
```

Licence MIT.
