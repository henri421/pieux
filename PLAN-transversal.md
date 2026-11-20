# PLAN — Pieu sous charge transversale (lot F, étape 10)

Conçu par Claude le 20/11/2026. Maquette validée par l'utilisateur :
`plan-webaedificium/maquette-pieux-transversal.html`. Référence de calcul :
`tests/reference/transversal.py` (attendus : `python tests/reference/attendus.py`).

## 1. Spécifications

### Objectif
Ajouter un onglet « Transversal » à l'outil pieux. Il vérifie un pieu isolé sous effort horizontal,
moment et effort normal en tête, avec des ressorts p-y bilinéaires (EN 1997-3:2025, annexe C.12).
Il rend la résistance transversale du terrain (6.6.2.3), le moment maximal, l'effort tranchant
maximal, les déplacements et la zone plastifiée.

### Décisions (utilisateur, 20/11/2026)
- **Ressorts p-y** : modèle bilinéaire de l'EN 1997-3, C.12. La pression vaut
  p = min(p_f·y/y_f ; p_f) (C.15), sur une largeur B = D.
- **Placement** : un onglet « Transversal » dans l'outil pieux. Le diamètre, les noms et les
  épaisseurs des couches et la norme sont communs avec l'onglet Axial.
- **ELU, 2e génération** : approche par les matériaux, avec les combinaisons (a) et (b) de sol-ec7
  (`combinaisons2g('a+b', cc, profil2g())`).
  - (a) : VC1 + M1. Le tableau 6.9 et la note du tableau 6.10 admettent VC1 à la place de VC4 pour
    la résistance transversale. Avec un modèle non linéaire, on pondère les actions, pas les effets.
  - (b) : VC3 + M2, sur tan φ′, c′ et c_u.
- **ELU, 1re génération** : approches DA1 (DA1-1, DA1-2) et DA3, par `combinaisons1g`. Les actions
  en tête sont des actions de structure, on prend donc le jeu `structure`. Le profil ANB 2022 passe
  en DA1.
  - **DA2 est refusé.** L'EN 1997-1:2004 n'est pas disponible pour sourcer un facteur de résistance
    transversale. Message contenant « DA2 ».
- **Second ordre** : le terme N·y″ (C.21) est pris en compte, avec N de compression constant. Le
  flambement avec imperfection (C.13.3) est hors périmètre.
- **Tête** : libre, ou encastrée (rotation nulle).
- **Sortie** : ELU et moment maximal ; les efforts sont à vérifier dans Colonne EC2 ou Sections EC3.
  Si M_Rd est saisi, on ajoute le taux M_Ed/M_Rd.

### Modèle (à reproduire exactement : les attendus en dépendent)
- **Contrainte verticale effective σ′_v(z)** : exacte par couches. On prend γ au-dessus de la nappe
  et γ_sat − 10 en dessous (γ_w = 10 kN/m³, comme parois).
- **Couche au niveau z** : la première couche dont la base est ≥ z − 1e-9. Une frontière appartient
  donc à la couche du dessus. Sous la dernière couche, on garde la dernière couche.
- **p_f (kPa)**, avec les propriétés de calcul tan φ′/γ_φ, c′/γ_c, c_u/γ_cu :
  - non drainé : p_f = min(k·c_u ; c_u·(2 + (2/3)·z/D) + σ′_v(z)), avec k = 9 (C.16), ou 6 si
    « fluage » (C.17) ; la seconde expression est C.18 ;
  - drainé : p_f = K_q·σ′_v(z*) + K_c·c′ (C.19), avec z* = min(z, 20 D) (note 1 de la figure C.9).
    K_q et K_c sont ceux de Brinch Hansen (1961), à φ′_d et x = z*/D :
    - K_q⁰ = e^((π/2+φ)tanφ)·cosφ·tan(π/4+φ/2) − e^(−(π/2−φ)tanφ)·cosφ·tan(π/4−φ/2) ;
    - K_c⁰ = [e^((π/2+φ)tanφ)·cosφ·tan(π/4+φ/2) − 1]·cotφ ;
    - N_c = [e^(π tanφ)·tan²(π/4+φ/2) − 1]·cotφ ; d_c^∞ = 1,58 + 4,09·tan⁴φ ;
    - K_c^∞ = N_c·d_c^∞ ; K_0 = 1 − sin φ ; K_q^∞ = K_c^∞·K_0·tan φ ;
    - α_q = K_q⁰/(K_q^∞ − K_q⁰)·K_0·sinφ / sin(π/4+φ/2) ; α_c = K_c⁰/(K_c^∞ − K_c⁰)·2·sin(π/4+φ/2) ;
    - K = (K⁰ + K^∞·α·x)/(1 + α·x).
    - Contrôlé contre la figure C.9 : test « lecture de la figure ».
- **y_f** (tableau C.11) : grenu 0,1 D ; fin, long terme 0,12 D ; fin, court terme 0,05 D.
- **Poutre** :
  - Euler-Bernoulli, EI constant, **200 éléments** égaux de 0 à L, où L est la somme des épaisseurs ;
  - matrice élémentaire d'Hermite ;
  - rigidité géométrique cohérente −N/(30h)·[[36, 3h, −36, 3h], [3h, 4h², −3h, −h²],
    [−36, −3h, 36, −3h], [3h, −h², −3h, 4h²]] ;
  - pied libre.
- **Ressorts** : un par nœud, de longueur tributaire h (h/2 aux extrémités). La force du nœud vaut
  R_i = clip(P_i·y_i/Y_i ; −P_i ; P_i)·w_i, avec P_i = p_f·D et Y_i = y_f.
- **Chargement en tête** : H sur le déplacement, −M sur la rotation. **Convention : M > 0 a le sens
  de H appliqué au-dessus de la tête (M = H·e).** Tête encastrée : rotation du nœud 0 bloquée.
- **Résolution** :
  - itération sécante, en partant des raideurs élastiques P/Y ;
  - à chaque pas : k_nouveau = R/y (raideur élastique si |y| ≤ 1e-14), puis
    k ← 0,5·k + 0,5·k_nouveau ;
  - arrêt quand max|y − y_précédent| < 1e-10 m, au plus 5000 itérations ;
  - pas d'équilibre (résultat `null`) si max|y| > 10 L ou sans convergence ;
  - résolution linéaire **en bande** (demi-largeur 3), pas de matrice pleine (temps de calcul) ;
  - pivot ≤ 0 : refus « N dépasse la charge critique du pieu ».
- **Efforts, par la statique** sur les forces des nœuds :
  - M(z_i) = M_0 + H·z_i + N·(y_0 − y_i) − Σ_{j<i} R_j·(z_i − z_j) ;
  - M_0 = M en tête libre ; en tête encastrée, M_0 est tel que M(L) = 0 ;
  - V(z_i) = H − Σ_{j≤i} R_j ;
  - M_Ed = max|M|, avec z_MEd au premier nœud qui l'atteint ; V_Ed = max|V| ;
  - rotation en tête = degré de liberté de rotation du nœud 0 ;
  - zone plastique = Σ w_i sur les nœuds où P_i > 0 et |y_i| ≥ Y_i·(1 − 1e-9).
- **Résistance transversale du terrain** (mécanisme de Brinch Hansen, pieu rigide, p = ±p_fd) :
  - **tête encastrée** : translation, H_ult = ∫₀ᴸ P dz. Taux = H/H_ult (0 si H ≤ 0) ; z_rotation = null ;
  - **tête libre** : point de rotation z_r ; P agit contre H au-dessus de z_r et dans son sens en
    dessous.
    - A(z_r) = ∫₀^{z_r} P − ∫_{z_r}^L P ; B(z_r) = ∫₀^{z_r} P·(L − s) − ∫_{z_r}^L P·(L − s) ;
    - z_r annule g = (M + H·L)·A − H·B (bisection sur ]0 ; L[, 200 pas) ;
    - multiplicateur λ = A/H (ou B/M si H = 0) ; taux = 1/λ ; H_ult = A ;
    - intégration : point milieu sur 2000 cellules, la cellule qui contient z_r étant coupée
      exactement (P de son milieu).
- **Combinaison** : H_d, M_d et N_d = γ_G,dst·G + γ_Q,dst·Q, avec le jeu « structure » de sol-ec7.
  Taux géotechnique = taux du mécanisme ; si l'analyse p-y ne trouve pas d'équilibre, taux = Infinity
  et une alerte est émise.
- **ELS** : charges caractéristiques G + Q, sol non pondéré.
- **Gouvernant** : la combinaison au plus grand taux géotechnique. M_Ed, V_Ed et N_Ed sont les maxima
  des combinaisons ELU ; la combinaison de M_Ed est nommée.

### Interfaces publiques

`src/transversal.ts` (nouveau, PUR) :
```ts
export type Comportement = 'draine' | 'non-draine';
export type ClasseYf = 'grenu' | 'fin-court' | 'fin-long';
export interface CoucheTransversale { nom: string; h: number; gamma: number; gammaSat: number;
  comportement: Comportement; phi: number; c: number; cu: number; yf: ClasseYf }
export interface DonneesTransversal { D: number; EI: number; tete: 'libre' | 'encastree';
  zNappe: number; fluage: boolean; couches: CoucheTransversale[];
  efforts: { HG: number; HQ: number; MG: number; MQ: number; NG: number; NQ: number };
  MRd: number | null; norme: Norme /* celle de pieux.ts */ }
export interface SolDeCalcul { gPhi: number; gC: number; gCu: number }   // diviseurs
export interface Modele { L: number; D: number; EI: number; pf: (z: number) => number /* kPa */; yf: (z: number) => number /* m */ }
export function coefficientsBrinchHansen(phiDeg: number, zSurD: number): { Kq: number; Kc: number };
export function contrainteVerticale(d: Pick<DonneesTransversal, 'couches' | 'zNappe'>, z: number): number;
export function pressionUltime(d: Pick<DonneesTransversal, 'D' | 'couches' | 'zNappe' | 'fluage'>, z: number, sol?: SolDeCalcul): number;
export interface ResultatPY { z: number[]; y: number[]; M: number[]; V: number[]; p: number[]; pf: number[];
  yTete: number; rotationTete: number; Mtete: number; MEd: number; zMEd: number; VEd: number; zonePlastique: number }
export function analysePY(m: Modele, charge: { H: number; M: number; N: number }, tete: 'libre' | 'encastree'): ResultatPY | null;
export function resistanceTransversale(m: Modele, charge: { H: number; M: number }, tete: 'libre' | 'encastree'): { taux: number; H: number; zRotation: number | null };
export interface CombinaisonTransversale { nom: string; coefficients: Coefficient[]; Hd: number; Md: number; Nd: number;
  resistance: { taux: number; H: number; zRotation: number | null }; py: ResultatPY | null; taux: number }
export interface ResultatTransversal { generation: 1 | 2; longueur: number; combinaisons: CombinaisonTransversale[];
  service: ResultatPY | null; gouvernant: { combinaison: string; taux: number };
  MEd: { valeur: number; combinaison: string; z: number }; VEd: number; NEd: number;
  tauxStructure: number | null; alertes: string[] }
export function verifierTransversal(d: DonneesTransversal): ResultatTransversal;
```
Les refus sont des `Error`, en français ; ceux d'une couche nomment la couche :
- D ≤ 0 ; EI ≤ 0 ; aucune couche ; h ≤ 0 ; γ ou γ_sat ≤ 0 ;
- drainé avec φ′ hors de ]0 ; 60] (même borne que parois) ; c′ < 0 ;
- non drainé avec c_u ≤ 0 ;
- DA2 (voir plus haut).

Les `p` et `pf` de `ResultatPY` sont en kPa (pression, pas force par mètre).

`app/src/form.ts` :
- `SaisieCouche` gagne : `gamma`, `gammaSat`, `comportement`, `phi`, `c`, `cu`, `yf` (chaînes).
- `Saisie` gagne : `mode: 'axial' | 'transversal'`, `EI`, `tete`, `zNappe`, `fluage: boolean`,
  `HtG`, `HtQ`, `MtG`, `MtQ`, `NtG`, `NtQ`, `MRd`. Défauts : voir le test T2.
- Un fichier ancien se relit avec ces défauts, y compris dans les couches.
- `lireTransversal(s)` renvoie `{ ok: true; calcul: { saisie; donnees: DonneesTransversal } } | { ok: false; message }` :
  - non drainé : φ′ et c′ ignorés (lus à 0) ; drainé : c_u ignoré (lu à 0) ;
  - M_Rd vide = null ;
  - la norme est celle de `lireSaisie` (même construction) ;
  - un refus nomme la couche et le champ.
- `verifierTr(calcul)` = `verifierTransversal(calcul.donnees)`.
- `lireSaisie` et `verifier` (axial) sont inchangés.

`app/src/note.ts` : `noteTransversale(calcul, r, cartouche): NoteDeCalcul`.
- Cite C.12, Brinch Hansen (1961) et C.21.
- Tableaux : p_f(z) M1/M2 ; « Valeurs le long du pieu… » (z, y, M, V, p, p_f, tous les 0,5 m) ; une
  ligne par combinaison.
- Figure : `dessinTransversal`.
- Vérifications : une « Résistance transversale · <combinaison> » par combinaison ELU, plus
  « M_Ed / M_Rd » si M_Rd est saisi.

`app/src/dessin.ts` :
`dessinTransversal(calcul, r, o: { vue: string; y: boolean; M: boolean; V: boolean; p: boolean }): string`.
- `vue` : nom d'une combinaison ou « ELS ».
- Coupe du pieu et des couches, puis une colonne par diagramme, chacune avec son `data-role` :
  « y », « M », « V », « p » (pression p, et ±p_f dans un élément `data-role="pf"`).
- Combinaison sans équilibre : la coupe seule, avec un message.

`app/index.html`, `app/en/index.html`, `app/src/main.ts`, `app/src/vue.ts`, `app/src/textes.ts`,
`app/src/style.css` : l'onglet Transversal de la maquette, en français et en anglais.
- Boutons d'onglet Axial | Transversal (`saisie.mode`).
- En mode Transversal, champs : pieu (EI, tête, M_Rd), charges en tête (G/Q), nappe, fluage, et
  tableau de sol (comportement, γ/γ_sat, φ′, c′, c_u, y_f).
- Diagrammes avec boutons de vue (combinaisons, ELS) et cases y, M, V, p.
- Cartes : résistance transversale par combinaison, efforts dans le pieu (avec jauge si M_Rd),
  plastification, service.
- Volets : tableau par combinaison, p_f(z), hypothèses.
- Sorties : la note PDF/HTML, le SVG, le CSV et le JSON suivent l'onglet actif.

### Hors périmètre
Effet de groupe (p-multiplicateurs), sol en mouvement (γ_F,tr), flambement avec imperfection
(C.13.3), courbes non linéaires de l'EN ISO 19901-4, EI variable, traction en tête, charges
cycliques, vérification du fût.

## 2. Tâches

| Tâche | Fichiers | Dépend de | Tests |
|---|---|---|---|
| T1 noyau | `src/transversal.ts` | — | `npx vitest run tests/transversal.test.ts` |
| T2 saisie | `app/src/form.ts` | T1 | `npx vitest run tests/app/transversal-app.test.ts -t "T2"` |
| T3 note | `app/src/note.ts` (+ textes) | T2, T4 | `-t "T3"` |
| T4 dessin | `app/src/dessin.ts` | T2 | `-t "T4"` |
| T5 interface | `app/index.html`, `app/en/index.html`, `app/src/main.ts`, `app/src/vue.ts`, `app/src/textes.ts`, `app/src/style.css` | T2-T4 | `npm test`, `npm run typecheck`, `npm run build` ; contrôle au banc (pieux-banc, port 5199) par Claude |

Résultat attendu : `npm test` entièrement vert (les tests existants et les nouveaux),
`npm run typecheck` sans erreur, `npm run build` réussi.

## 3. Règles pour l'exécutant
- Ne jamais modifier `tests/transversal.test.ts`, `tests/app/transversal-app.test.ts`,
  `tests/reference/*` ni aucun test existant. Un test qui paraît faux : s'arrêter et le signaler dans
  `HANDOFF.md`.
- Ne pas toucher au calcul axial (`src/pieux.ts`).
- Aucune valeur numérique nouvelle hors de celles citées ici (formules, tableau C.11, coefficients de
  sol-ec7).
- Décisions laissées à l'exécutant : présentation exacte des cartes, tableaux et dessin, dans le style
  de l'outil ; noms internes.
- Interdit :
  - changer le format du fichier autrement qu'en ajoutant les champs ci-dessus ;
  - changer `lireSaisie` ou `verifier` ;
  - une matrice pleine dans la résolution.
- Consigner chaque tâche dans `HANDOFF.md` (fichiers, décisions, points douteux, tests).
