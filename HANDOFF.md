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
