# Validation — pieu foré dimensionné sur un profil CPT, exemple A.8 du rapport JRC EUR 26227 EN (2013)

**Source externe.** A. J. Bond, B. Schuppener, G. Scarpelli, T. L. L. Orr, *Eurocode 7: Geotechnical
Design — Worked examples*, rapport JRC EUR 26227 EN, 2013, annexe A.8, deuxième exemple « Pile
foundation designed from soil test profile ». Exemples du workshop EC7 de Dublin (juin 2013),
publiés par le Centre commun de recherche de la Commission européenne. Les valeurs attendues sont
celles du rapport ; elles n'ont pas été recalculées de notre côté.

Cas figé par `tests/validation-jrc-a8.test.ts`.

## Données (rapport)

- Pieu foré isolé, D = 0,45 m ; G_k = 300 kN, Q_k = 150 kN.
- Couches lâches et molles jusqu'à 16,5 m, sans frottement retenu ; dessous, sable moyennement
  dense à dense : p_b = 2,5 MPa et p_s = 0,1 MPa (tableaux D.3 et D.4 de l'EN 1997-2, q_c = 12,5 MPa).
- Un seul profil : ξ₃ = ξ₄ = 1,4. Coefficients recommandés de l'EN 1997-1 (pieux forés).
- Inconnue : longueur L_s dans la couche porteuse telle que R_c;d = F_c;d.

## Saisie dans l'outil

Pieu foré D = 0,45 ; groupe 1 × 1 ; couche 1 : 16,5 m, q_s = 0 ; couche 2 : L_s, q_s = 100 kPa ;
q_b = 2 500 kPa ; V_G = 300, V_Q = 150 kN ; EN 1997-1:2004, valeurs recommandées. L_s est
cherché par dichotomie jusqu'à un taux de compression de 1.

## Résultats

| Grandeur | Rapport JRC | Outil | Écart |
| --- | --- | --- | --- |
| R_b;cal = A_b p_b | 398 kN | 397,6 kN | −0,1 % |
| R_s;cal par mètre de couche porteuse | 141 kN/m | 141,4 kN/m | +0,3 % |
| F_c;d DA1-1 / DA1-2 / DA2 | 630 / 495 / 630 kN | 630 / 495 / 630 kN | 0 |
| **L_s DA1-1** (A1 + M1 + R1) | 3,99 m | 3,989 m | 0 |
| **L_s DA1-2** (A2 + M1 + R4) | 4,08 m | 4,087 m | +0,2 % |
| **L_s DA2** (A1 + M1 + R2) | 4,05 m | 4,050 m | 0 |

L'écart de DA1-2 vient de l'arrondi du rapport, qui prend R_b;k = 284 kN et R_s;k = 101 L_s
au lieu de 397,6 / 1,4 = 284,0 et 141,4 / 1,4 = 101,0 L_s.

## Conclusion

Résistances de pointe et de fût, facteurs ξ pour un profil, coefficients partiels des trois
combinaisons et longueur nécessaire retrouvés. **Validé sur ce cas** (pieu foré isolé, 1re
génération, valeurs recommandées). Le premier exemple de l'A.8 (essais de chargement statique) et
le troisième (paramètres du sol, annexes irlandaise et allemande) ne sont pas repris : l'outil ne
part pas d'essais de chargement, et le troisième emploie des facteurs de modèle nationaux.
