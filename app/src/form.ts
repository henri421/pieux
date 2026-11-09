/**
 * La saisie, en chaines, et sa conversion en donnees du noyau. PUR.
 *
 * Une seule saisie pour les deux generations : basculer ne change aucune valeur saisie.
 * Les champs propres a un choix restent saisis quand l'autre est actif ; seuls ceux du
 * choix retenu sont lus. Aucun calcul ici : le noyau fait foi.
 */

import { lireNombre, nombreAffiche } from 'aedificium-ui';
import type { Approche, ClasseConsequences, Risque } from 'sol-ec7';
import {
  rendementConverseLabarre,
  verifierPieux,
  type DensiteCpt,
  type DonneesPieux,
  type Execution,
  type ResultatPieux,
} from '../../src/pieux';
import { textes } from './textes';

export interface SaisieCouche {
  nom: string;
  h: string;
  tauDd: string;
  qs: string[];
}

export interface Saisie {
  execution: string;
  D: string;
  nx: string;
  ny: string;
  s: string;
  eta: string;
  ratioQbBloc: string;
  redistribution: boolean;
  couches: SaisieCouche[];
  qb: string[];
  VG: string;
  VQ: string;
  MG: string;
  MQ: string;
  Eeq: string;
  nu: string;
  Ep: string;
  sAdm: string;
  generation: '1re' | '2e';
  consequences: string;
  methode: string;
  base: string;
  baseTerrain: string;
  resistance: string;
  dAvg: string;
  profilNormatif: string;
  approche1: string;
  risque: string;
  densiteCpt: string;
  rigide: boolean;
  sondageProche: boolean;
}

export interface Calcul {
  saisie: Saisie;
  donnees: DonneesPieux;
}
export type Resultat = ResultatPieux;
export type Lecture = { ok: true; calcul: Calcul } | { ok: false; message: string };

/** Format du fichier enregistre. */
const FORMAT = 'pieux/1';

/** Le cas de la maquette, nombres ecrits a la francaise. */
export function saisieParDefaut(): Saisie {
  return {
    execution: 'fore',
    D: '0,6',
    nx: '3',
    ny: '2',
    s: '1,8',
    eta: '0,76',
    ratioQbBloc: '1',
    redistribution: false,
    couches: [
      { nom: 'Remblai', h: '3', tauDd: '20', qs: ['0', '0', '0'] },
      { nom: 'Argile', h: '5', tauDd: '0', qs: ['40', '35', '45'] },
      { nom: 'Sable', h: '6', tauDd: '0', qs: ['80', '70', '75'] },
    ],
    qb: ['2800', '2400', '2600'],
    VG: '2000',
    VQ: '600',
    MG: '0',
    MQ: '400',
    Eeq: '60',
    nu: '0,3',
    Ep: '30',
    sAdm: '25',
    generation: '2e',
    consequences: 'CC2',
    methode: 'modele-pieu',
    base: 'sol',
    baseTerrain: 'etendue',
    resistance: 'separee',
    dAvg: '30',
    profilNormatif: 'recommande',
    approche1: 'DA1',
    risque: 'normal',
    densiteCpt: '100',
    rigide: false,
    sondageProche: false,
  };
}

class Refus extends Error {}

/** Lit un nombre, ou refuse en nommant le champ. */
function nb(brut: string, champ: string): number {
  const v = lireNombre(brut);
  if (v === null) throw new Refus(textes().refus.nombre(champ, brut));
  return v;
}

/** Lit un nombre d'une couche, ou refuse en nommant la couche et le champ. */
function nbCouche(brut: string, nom: string, champ: string): number {
  const v = lireNombre(brut);
  if (v === null) throw new Refus(textes().refus.couche(nom, champ, brut));
  return v;
}

function choix<T extends string | number>(valeur: string | number, autorisees: readonly T[], defaut: T): T {
  return (autorisees as readonly (string | number)[]).includes(valeur) ? (valeur as T) : defaut;
}

const EXECUTIONS: readonly Execution[] = ['fore', 'battu', 'cfa', 'visse', 'non-classe'];
const CONSEQUENCES: readonly ClasseConsequences[] = ['CC1', 'CC2', 'CC3'];
const APPROCHES: readonly Approche[] = ['DA1', 'DA2', 'DA3'];
const RISQUES: readonly Risque[] = ['faible', 'normal', 'eleve'];
const DENSITES: readonly DensiteCpt[] = [10, 50, 100, 300, 1000];

/** Convertit la saisie ; refuse en nommant le premier champ ou la premiere couche illisible. */
export function lireSaisie(s: Saisie): Lecture {
  try {
    const c = textes().refus.champs;

    const pieu: DonneesPieux['pieu'] = {
      D: nb(s.D, c.D),
      execution: choix(s.execution, EXECUTIONS, 'fore'),
    };
    const groupe: DonneesPieux['groupe'] = {
      nx: nb(s.nx, c.nx),
      ny: nb(s.ny, c.ny),
      s: nb(s.s, c.s),
      eta: nb(s.eta, c.eta),
      ratioQbBloc: nb(s.ratioQbBloc, c.ratioQbBloc),
      redistribution: s.redistribution,
    };

    const couches: DonneesPieux['couches'] = s.couches.map((couche) => ({
      nom: couche.nom,
      h: nbCouche(couche.h, couche.nom, c.h),
      tauDd: nbCouche(couche.tauDd, couche.nom, c.tauDd),
      qs: couche.qs.map((q) => nbCouche(q, couche.nom, c.qs)),
    }));
    const qb = s.qb.map((q, p) => nb(q, c.qb(p + 1)));

    const efforts: DonneesPieux['efforts'] = {
      VG: nb(s.VG, c.VG),
      VQ: nb(s.VQ, c.VQ),
      MG: nb(s.MG, c.MG),
      MQ: nb(s.MQ, c.MQ),
    };
    const service: DonneesPieux['service'] = {
      Eeq: nb(s.Eeq, c.Eeq),
      nu: nb(s.nu, c.nu),
      Ep: nb(s.Ep, c.Ep),
      sAdm: nb(s.sAdm, c.sAdm),
    };

    let norme: DonneesPieux['norme'];
    if (s.generation === '1re') {
      if (s.profilNormatif === 'anb2022') {
        norme = {
          generation: 1,
          profil: 'anb',
          risque: choix(s.risque, RISQUES, 'normal'),
          densiteCpt: choix(Number(s.densiteCpt) as DensiteCpt, DENSITES, 100),
          rigide: s.rigide,
          sondageProche: s.sondageProche,
        };
      } else {
        norme = {
          generation: 1,
          profil: 'recommande',
          approche: choix(s.approche1, APPROCHES, 'DA1'),
        };
      }
    } else {
      const commun = {
        generation: 2 as const,
        cc: choix(s.consequences, CONSEQUENCES, 'CC2'),
        resistance: s.resistance === 'totale' ? ('totale' as const) : ('separee' as const),
      };
      norme =
        s.methode === 'modele-terrain'
          ? {
              ...commun,
              methode: 'modele-terrain',
              baseTerrain: choix(
                s.baseTerrain,
                ['essais-ultimes', 'etendue', 'essais-service', 'limitee'] as const,
                'etendue',
              ),
            }
          : {
              ...commun,
              methode: 'modele-pieu',
              base: choix(s.base, ['cpt', 'pmt', 'sol'] as const, 'sol'),
              dAvg: nb(s.dAvg, c.dAvg),
            };
    }

    return {
      ok: true,
      calcul: { saisie: s, donnees: { pieu, groupe, couches, qb, efforts, service, norme } },
    };
  } catch (e) {
    if (e instanceof Refus) return { ok: false, message: e.message };
    throw e;
  }
}

/** Verification du noyau. Leve si le noyau refuse la saisie ; le message est celui du noyau. */
export function verifier(calcul: Calcul): Resultat {
  return verifierPieux(calcul.donnees);
}

/**
 * Rendement propose par la formule de Converse-Labarre (noyau), ecrit a la francaise.
 * Une geometrie illisible ou absurde laisse le rendement saisi en place.
 */
export function proposerRendement(s: Saisie): string {
  const D = lireNombre(s.D);
  const entraxe = lireNombre(s.s);
  const nx = lireNombre(s.nx);
  const ny = lireNombre(s.ny);
  if (D === null || entraxe === null || nx === null || ny === null) return s.eta;
  if (!(D > 0 && entraxe > 0 && nx >= 1 && ny >= 1)) return s.eta;
  return nombreAffiche(rendementConverseLabarre(D, entraxe, nx, ny), 2);
}

/** Ajoute une couche neutre, avec une valeur par profil. */
export function ajouterCouche(s: Saisie): Saisie {
  const n = s.couches.length + 1;
  return {
    ...s,
    couches: [
      ...s.couches,
      { nom: `Couche ${n}`, h: '0', tauDd: '0', qs: s.qb.map(() => '0') },
    ],
  };
}

/** Retire une couche ; il en reste toujours au moins une. */
export function retirerCouche(s: Saisie, i: number): Saisie {
  if (s.couches.length <= 1) return { ...s, couches: [...s.couches] };
  return { ...s, couches: s.couches.filter((_, j) => j !== i) };
}

/** Ajoute un profil en recopiant le dernier, pour la pointe et chaque couche. */
export function ajouterProfil(s: Saisie): Saisie {
  const dernierQb = s.qb[s.qb.length - 1] ?? '0';
  return {
    ...s,
    qb: [...s.qb, dernierQb],
    couches: s.couches.map((c) => ({
      ...c,
      qs: [...c.qs, c.qs[c.qs.length - 1] ?? '0'],
    })),
  };
}

/** Retire le dernier profil ; il en reste toujours un. */
export function retirerProfil(s: Saisie): Saisie {
  if (s.qb.length <= 1) {
    return { ...s, qb: [...s.qb], couches: s.couches.map((c) => ({ ...c, qs: [...c.qs] })) };
  }
  return {
    ...s,
    qb: s.qb.slice(0, -1),
    couches: s.couches.map((c) => ({ ...c, qs: c.qs.slice(0, -1) })),
  };
}

export function serialiser(s: Saisie): string {
  return JSON.stringify({ format: FORMAT, ...s }, null, 2);
}

function texteOu(valeur: unknown, defaut: string): string {
  return typeof valeur === 'string' ? valeur : defaut;
}

function boolOu(valeur: unknown, defaut: boolean): boolean {
  return typeof valeur === 'boolean' ? valeur : defaut;
}

function choixOu<T extends string>(valeur: unknown, autorisees: readonly T[], defaut: T): T {
  return typeof valeur === 'string' && (autorisees as readonly string[]).includes(valeur) ? (valeur as T) : defaut;
}

function tableauTexteOu(valeur: unknown, defaut: string[]): string[] {
  if (!Array.isArray(valeur) || valeur.length === 0) return [...defaut];
  return valeur.map((v) => String(v));
}

function couchesOu(valeur: unknown, defaut: SaisieCouche[]): SaisieCouche[] {
  if (!Array.isArray(valeur) || valeur.length === 0) return defaut.map((c) => ({ ...c, qs: [...c.qs] }));
  return valeur.map((brut, i) => {
    const o = (typeof brut === 'object' && brut !== null ? brut : {}) as Record<string, unknown>;
    const d = defaut[Math.min(i, defaut.length - 1)];
    return {
      nom: texteOu(o.nom, d.nom),
      h: texteOu(o.h, d.h),
      tauDd: texteOu(o.tauDd, d.tauDd),
      qs: tableauTexteOu(o.qs, d.qs),
    };
  });
}

/** Relit un document enregistre ; les champs absents prennent la valeur par defaut. */
export function relire(contenu: string): Saisie {
  const brut = JSON.parse(contenu) as Record<string, unknown>;
  if (brut.format !== FORMAT) {
    throw new Error(textes().refus.format(String(brut.format), FORMAT));
  }
  const d = saisieParDefaut();
  return {
    execution: choixOu(brut.execution, EXECUTIONS, 'fore'),
    D: texteOu(brut.D, d.D),
    nx: texteOu(brut.nx, d.nx),
    ny: texteOu(brut.ny, d.ny),
    s: texteOu(brut.s, d.s),
    eta: texteOu(brut.eta, d.eta),
    ratioQbBloc: texteOu(brut.ratioQbBloc, d.ratioQbBloc),
    redistribution: boolOu(brut.redistribution, d.redistribution),
    couches: couchesOu(brut.couches, d.couches),
    qb: tableauTexteOu(brut.qb, d.qb),
    VG: texteOu(brut.VG, d.VG),
    VQ: texteOu(brut.VQ, d.VQ),
    MG: texteOu(brut.MG, d.MG),
    MQ: texteOu(brut.MQ, d.MQ),
    Eeq: texteOu(brut.Eeq, d.Eeq),
    nu: texteOu(brut.nu, d.nu),
    Ep: texteOu(brut.Ep, d.Ep),
    sAdm: texteOu(brut.sAdm, d.sAdm),
    generation: choixOu(brut.generation, ['1re', '2e'] as const, d.generation),
    consequences: choixOu(brut.consequences, ['CC1', 'CC2', 'CC3'] as const, d.consequences),
    methode: choixOu(brut.methode, ['modele-pieu', 'modele-terrain'] as const, d.methode),
    base: choixOu(brut.base, ['sol', 'cpt', 'pmt'] as const, d.base),
    baseTerrain: choixOu(
      brut.baseTerrain,
      ['essais-ultimes', 'etendue', 'essais-service', 'limitee'] as const,
      d.baseTerrain,
    ),
    resistance: choixOu(brut.resistance, ['separee', 'totale'] as const, d.resistance),
    dAvg: texteOu(brut.dAvg, d.dAvg),
    profilNormatif: choixOu(brut.profilNormatif, ['recommande', 'anb2022'] as const, d.profilNormatif),
    approche1: choixOu(brut.approche1, ['DA1', 'DA2', 'DA3'] as const, d.approche1),
    risque: choixOu(brut.risque, ['faible', 'normal', 'eleve'] as const, d.risque),
    densiteCpt: choixOu(brut.densiteCpt, ['10', '50', '100', '300', '1000'] as const, d.densiteCpt),
    rigide: boolOu(brut.rigide, d.rigide),
    sondageProche: boolOu(brut.sondageProche, d.sondageProche),
  };
}
