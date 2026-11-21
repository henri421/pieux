/**
 * Cablage de l'interface des pieux.
 *
 * Ce module ne calcule RIEN : il tient la saisie, appelle le noyau par `form`,
 * et confie la mise en forme aux modules purs. La generation, le profil normatif
 * et la methode ne sont que des champs de la saisie : les basculer ne touche a
 * aucune valeur saisie.
 */

import {
  avertissement2eGeneration,
  avertissementAnnexeLu,
  blocsEnTexte,
  definirLangue,
  langueDuDocument,
  noteDeCalculHtml, telechargerNotePdf,
  notationHtml,
  ouvrirOuTelecharger,
  resultatsEnCsv,
  svgAutonome,
  telecharger,
} from 'aedificium-ui';
import {
  ajouterCouche,
  ajouterProfil,
  lireSaisie,
  lireTransversal,
  proposerRendement,
  relire,
  retirerCouche,
  retirerProfil,
  saisieParDefaut,
  serialiser,
  verifier,
  verifierTr,
  type Calcul,
  type CalculTr,
  type Resultat,
  type Saisie,
} from './form';
import { coupe, dessinTransversal, type OptionsCoupe, type OptionsTransversal } from './dessin';
import type { ResultatTransversal } from '../../src/transversal';
import { STYLES_TRACE } from './export';
import { noteDuCalcul, noteTransversale } from './note';
import { textes } from './textes';
import { blocEntrees, blocsCsvTr, blocsResultat, couchesHtml, couchesTrHtml, messageDErreur, verdictsHtml, verdictsTrHtml, voletsHtml, voletsTrHtml } from './vue';
import './style.css';

// La langue d'abord : tout rendu la lit (`index.html` ou `en/index.html`).
definirLangue(langueDuDocument(document));

const CLE_SAISIE = 'pieux/saisie';
const CLE_CARTOUCHE = 'pieux:cartouche';

function exige<T extends Element>(selecteur: string): T {
  const e = document.querySelector<T>(selecteur);
  if (e === null) throw new Error(textes().page.elementAbsent(selecteur));
  return e;
}

const formulaire = exige<HTMLFormElement>('#formulaire');
const zones = {
  erreur: exige<HTMLElement>('[data-role="erreur"]'),
  couches: exige<HTMLElement>('[data-role="couches"]'),
  coupe: exige<HTMLElement>('[data-role="coupe"]'),
  verdicts: exige<HTMLElement>('[data-role="verdicts"]'),
  volets: exige<HTMLElement>('[data-role="volets"]'),
  couchesTr: exige<HTMLElement>('[data-role="couches-tr"]'),
  dessinTr: exige<HTMLElement>('[data-role="dessin-tr"]'),
  vuesTr: exige<HTMLElement>('[data-role="vues-tr"]'),
};
const champProjet = exige<HTMLInputElement>('[data-role="projet"]');
const champElement = exige<HTMLInputElement>('[data-role="element"]');

type Racine = Record<string, unknown>;

function charger(): Saisie | null {
  try {
    const t = window.localStorage.getItem(CLE_SAISIE);
    return t === null ? null : relire(t);
  } catch {
    return null;
  }
}

function memoriser(): void {
  try {
    window.localStorage.setItem(CLE_SAISIE, serialiser(saisie));
  } catch {
    // Stockage indisponible : la page fonctionne sans.
  }
}

function lireCartouche(): { projet: string; element: string } {
  try {
    const t = window.localStorage.getItem(CLE_CARTOUCHE);
    if (t === null) return { projet: '', element: '' };
    const c = JSON.parse(t) as { projet?: unknown; element?: unknown };
    return {
      projet: typeof c.projet === 'string' ? c.projet : '',
      element: typeof c.element === 'string' ? c.element : '',
    };
  } catch {
    return { projet: '', element: '' };
  }
}

let saisie: Saisie = charger() ?? saisieParDefaut();

interface Dernier {
  calcul: Calcul;
  resultat: Resultat;
}
let dernier: Dernier | null = null;

/** Dernier calcul transversal valide, et la vue des diagrammes (combinaison ou 'ELS'). */
let dernierTr: { calcul: CalculTr; resultat: ResultatTransversal } | null = null;
let vueTr = '';

/** Recopie la saisie dans les champs `data-champ`, puis met l'affichage a jour. */
function ecrireSaisie(): void {
  for (const e of formulaire.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-champ]')) {
    const cle = e.dataset.champ;
    if (cle === undefined) continue;
    const v = (saisie as unknown as Racine)[cle];
    if (e instanceof HTMLInputElement && e.type === 'checkbox') e.checked = v === true;
    else e.value = String(v);
  }
  ajusterAffichage();
}

function montrerErreur(message: string | null): void {
  zones.erreur.hidden = message === null;
  zones.erreur.innerHTML = message === null ? '' : notationHtml(message);
}

/** Les lignes qui dependent d'un choix s'affichent avec lui ; leur valeur reste en memoire. */
function ajusterAffichage(): void {
  for (const b of formulaire.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
    b.setAttribute('aria-pressed', String(b.dataset.mode === saisie.mode));
  }
  for (const z of document.querySelectorAll<HTMLElement>('[data-mode-seul]')) {
    z.hidden = z.dataset.modeSeul !== saisie.mode;
  }
  for (const b of formulaire.querySelectorAll<HTMLButtonElement>('[data-generation]')) {
    b.setAttribute('aria-pressed', String(b.dataset.generation === saisie.generation));
  }
  const bandeau = document.querySelector<HTMLElement>('[data-role="bandeau-2e-gen"]');
  if (bandeau !== null) {
    bandeau.hidden = saisie.generation !== '2e';
    bandeau.textContent = avertissement2eGeneration();
  }
  const bandeauLu = document.querySelector<HTMLElement>('[data-role="bandeau-annexe"]');
  if (bandeauLu !== null) {
    bandeauLu.textContent = avertissementAnnexeLu(false);
    bandeauLu.hidden = saisie.generation !== '1re' || saisie.profilNormatif !== 'lu' || bandeauLu.textContent === '';
  }
  for (const g of formulaire.querySelectorAll<HTMLElement>('[data-groupe]')) {
    g.hidden = g.dataset.groupe !== saisie.generation;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-profil]')) {
    z.hidden = z.dataset.siProfil !== saisie.profilNormatif;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-methode]')) {
    z.hidden = z.dataset.siMethode !== saisie.methode;
  }
  // ANB 2022 : l'approche est DA1, liste grisee (`lireSaisie` passe DA1 de toute facon).
  const approche = formulaire.querySelector<HTMLSelectElement>('[data-champ="approche1"]');
  if (approche !== null) {
    const anb = saisie.profilNormatif === 'anb2022';
    approche.disabled = anb;
    approche.value = anb ? 'DA1' : saisie.approche1;
  }
}

/** Les couches et la ligne de pointe dependent du nombre de profils : re-rendues apres chaque action. */
function rendreCouches(): void {
  zones.couches.innerHTML = couchesHtml(saisie);
  zones.couchesTr.innerHTML = couchesTrHtml(saisie);
}

function optionsDessin(): OptionsCoupe {
  return {
    cotes: exige<HTMLInputElement>('[data-option="cotes"]').checked,
    bloc: exige<HTMLInputElement>('[data-option="bloc"]').checked,
    planNeutre: exige<HTMLInputElement>('[data-option="planNeutre"]').checked,
  };
}

function renduDessin(): void {
  zones.coupe.innerHTML = dernier === null ? '' : coupe(dernier.calcul, dernier.resultat, optionsDessin());
}

function optionsTr(): OptionsTransversal {
  const coche = (k: string) => exige<HTMLInputElement>(`[data-option-tr="${k}"]`).checked;
  return { vue: vueTr, y: coche('y'), M: coche('M'), V: coche('V'), p: coche('p') };
}

/** Boutons de vue (combinaisons, ELS) et diagrammes du transversal. */
function renduTr(): void {
  if (dernierTr === null) {
    zones.vuesTr.innerHTML = '';
    zones.dessinTr.innerHTML = '';
    return;
  }
  const r = dernierTr.resultat;
  const vues = [...r.combinaisons.map((k) => k.nom), 'ELS'];
  if (!vues.includes(vueTr)) vueTr = r.MEd.combinaison !== '' ? r.MEd.combinaison : vues[0];
  zones.vuesTr.innerHTML = vues
    .map((v) => `<button type="button" data-vue-tr="${v}" aria-pressed="${v === vueTr}">${v === 'ELS' ? textes().tr.vue.ELS : v}</button>`)
    .join('');
  zones.dessinTr.innerHTML = dessinTransversal(dernierTr.calcul, r, optionsTr());
}

function recalculerTr(): void {
  dernier = null;
  const lecture = lireTransversal(saisie);
  let resultat: ResultatTransversal | null = null;
  let message: string | null = lecture.ok ? null : lecture.message;
  if (lecture.ok) {
    try {
      resultat = verifierTr(lecture.calcul);
    } catch (e) {
      message = messageDErreur(e);
    }
  }
  if (!lecture.ok || resultat === null) {
    montrerErreur(message);
    dernierTr = null;
    zones.verdicts.innerHTML = '';
    zones.volets.innerHTML = '';
    return renduTr();
  }
  montrerErreur(null);
  dernierTr = { calcul: lecture.calcul, resultat };
  zones.verdicts.innerHTML = verdictsTrHtml(resultat, lecture.calcul.donnees.MRd);
  zones.volets.innerHTML = voletsTrHtml(noteTransversale(lecture.calcul, resultat, cartouche()));
  renduTr();
}

function viderResultats(): void {
  dernier = null;
  zones.verdicts.innerHTML = '';
  zones.volets.innerHTML = '';
  renduDessin();
}

function recalculer(): void {
  memoriser();
  ajusterAffichage();
  if (saisie.mode === 'transversal') return recalculerTr();
  dernierTr = null;
  const lecture = lireSaisie(saisie);
  if (!lecture.ok) {
    montrerErreur(lecture.message);
    viderResultats();
    return;
  }
  let resultat: Resultat;
  try {
    resultat = verifier(lecture.calcul);
  } catch (e) {
    montrerErreur(messageDErreur(e));
    viderResultats();
    return;
  }
  montrerErreur(null);
  dernier = { calcul: lecture.calcul, resultat };
  zones.verdicts.innerHTML = verdictsHtml(resultat);
  zones.volets.innerHTML = voletsHtml(resultat);
  renduDessin();
}

/** Entier non negatif d'un attribut `data-...`, ou null. */
function entier(brut: string | undefined): number | null {
  if (brut === undefined) return null;
  const n = Number(brut);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Une saisie dans un champ : la valeur va dans la saisie, puis le calcul se refait. */
function lireEdition(cible: EventTarget | null): void {
  if (!(cible instanceof HTMLInputElement || cible instanceof HTMLSelectElement)) return;
  const d = cible.dataset;
  if (d.champ !== undefined) {
    const v = cible instanceof HTMLInputElement && cible.type === 'checkbox' ? cible.checked : cible.value;
    (saisie as unknown as Racine)[d.champ] = v;
  } else if (d.couche !== undefined && d.sous !== undefined) {
    const i = entier(d.couche);
    if (i === null || i >= saisie.couches.length) return;
    const couche = saisie.couches[i];
    if (d.sous === 'nom') couche.nom = cible.value;
    else if (d.sous === 'h') couche.h = cible.value;
    else if (d.sous === 'tauDd') couche.tauDd = cible.value;
    else if (['gamma', 'gammaSat', 'comportement', 'phi', 'c', 'cu', 'yf'].includes(d.sous)) {
      (couche as unknown as Record<string, string>)[d.sous] = cible.value;
      // Le comportement change les cases grisees du tableau.
      if (d.sous === 'comportement') rendreCouches();
    } else return;
  } else if (d.qs !== undefined) {
    const [i, p] = d.qs.split(':').map((x) => entier(x));
    if (i === null || p === null || i >= saisie.couches.length || p >= saisie.couches[i].qs.length) return;
    saisie.couches[i].qs[p] = cible.value;
  } else if (d.qb !== undefined) {
    const p = entier(d.qb);
    if (p === null || p >= saisie.qb.length) return;
    saisie.qb[p] = cible.value;
  } else {
    return;
  }
  recalculer();
}

formulaire.addEventListener('input', (evenement) => lireEdition(evenement.target));

for (const option of document.querySelectorAll<HTMLInputElement>('[data-option]')) {
  option.addEventListener('input', () => renduDessin());
}
for (const option of document.querySelectorAll<HTMLInputElement>('[data-option-tr]')) {
  option.addEventListener('input', () => renduTr());
}

function cartouche(): { projet: string; element: string; date: string } {
  return {
    projet: champProjet.value,
    element: champElement.value,
    date: new Date().toISOString().slice(0, 10),
  };
}

document.addEventListener('click', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLElement)) return;
  const bouton = cible.closest('button');
  if (bouton === null) return;
  const d = bouton.dataset;

  if (d.generation === '1re' || d.generation === '2e') {
    saisie = { ...saisie, generation: d.generation };
    ajusterAffichage();
    return recalculer();
  }

  if (d.mode === 'axial' || d.mode === 'transversal') {
    saisie = { ...saisie, mode: d.mode };
    return recalculer();
  }
  if (d.vueTr !== undefined) {
    vueTr = d.vueTr;
    return renduTr();
  }

  const action = d.action;
  if (action === undefined) return;

  if (action === 'proposer-rendement') {
    saisie = { ...saisie, eta: proposerRendement(saisie) };
    const champ = formulaire.querySelector<HTMLInputElement>('[data-champ="eta"]');
    if (champ !== null) champ.value = saisie.eta;
    return recalculer();
  }
  if (action === 'ajouter-couche') {
    saisie = ajouterCouche(saisie);
    rendreCouches();
    return recalculer();
  }
  if (action === 'retirer-couche') {
    const i = d.couche === undefined ? saisie.couches.length - 1 : entier(d.couche);
    if (i === null) return;
    saisie = retirerCouche(saisie, i);
    rendreCouches();
    return recalculer();
  }
  if (action === 'ajouter-profil') {
    saisie = ajouterProfil(saisie);
    rendreCouches();
    return recalculer();
  }
  if (action === 'retirer-profil') {
    saisie = retirerProfil(saisie);
    rendreCouches();
    return recalculer();
  }
  if (action === 'enregistrer') {
    return telecharger('pieux.json', serialiser(saisie), 'application/json;charset=utf-8');
  }
  if (action === 'reinitialiser') {
    saisie = saisieParDefaut();
    ecrireSaisie();
    rendreCouches();
    return recalculer();
  }

  if (!action.startsWith('exporter-')) return;
  if (saisie.mode === 'transversal') {
    if (dernierTr === null) return montrerErreur(textes().messages.rienAExporter);
    const tr = dernierTr;
    const note = noteTransversale(tr.calcul, tr.resultat, cartouche());
    if (action === 'exporter-note-pdf') void telechargerNotePdf('pieux-transversal-note.pdf', note, STYLES_TRACE).catch(() => ouvrirOuTelecharger('pieux-transversal-note.html', noteDeCalculHtml(note, STYLES_TRACE)));
    else if (action === 'exporter-note') ouvrirOuTelecharger('pieux-transversal-note.html', noteDeCalculHtml(note, STYLES_TRACE));
    else if (action === 'exporter-coupe') telecharger('pieux-transversal.svg', svgAutonome(dessinTransversal(tr.calcul, tr.resultat, optionsTr()), STYLES_TRACE), 'image/svg+xml;charset=utf-8');
    else if (action === 'exporter-resultats') telecharger('pieux-transversal.csv', resultatsEnCsv(blocsEnTexte(blocsCsvTr(note))), 'text/csv;charset=utf-8');
    return;
  }
  if (dernier === null) return montrerErreur(textes().messages.rienAExporter);
  const e = dernier;
  if (action === 'exporter-note' || action === 'exporter-note-pdf') {
    const note = noteDuCalcul(e.calcul, e.resultat, cartouche());
    const noteCalc = note;
    // PDF construit au clic ; en cas d'echec, la note HTML prend le relais.
    if (action === 'exporter-note-pdf') void telechargerNotePdf('pieux-note.pdf', noteCalc, STYLES_TRACE).catch(() => ouvrirOuTelecharger('pieux-note.html', noteDeCalculHtml(noteCalc, STYLES_TRACE)));
    else ouvrirOuTelecharger('pieux-note.html', noteDeCalculHtml(noteCalc, STYLES_TRACE));
  } else if (action === 'exporter-coupe') {
    const trace = coupe(e.calcul, e.resultat, optionsDessin());
    telecharger('pieux-coupe.svg', svgAutonome(trace, STYLES_TRACE), 'image/svg+xml;charset=utf-8');
  } else if (action === 'exporter-resultats') {
    const blocs = [
      { titre: textes().note.titreEntrees, lignes: blocEntrees(e.calcul), note: null },
      ...blocsResultat(e.resultat),
    ];
    telecharger('pieux-resultats.csv', resultatsEnCsv(blocsEnTexte(blocs)), 'text/csv;charset=utf-8');
  }
});

exige<HTMLInputElement>('[data-role="ouvrir"]').addEventListener('change', async (e) => {
  const entree = e.target as HTMLInputElement;
  const f = entree.files?.[0];
  entree.value = '';
  if (f === undefined) return;
  try {
    saisie = relire(await f.text());
  } catch (err) {
    return montrerErreur(messageDErreur(err));
  }
  ecrireSaisie();
  rendreCouches();
  recalculer();
});

const cartoucheMemorise = lireCartouche();
champProjet.value = cartoucheMemorise.projet;
champElement.value = cartoucheMemorise.element;
for (const champ of [champProjet, champElement]) {
  champ.addEventListener('input', () => {
    try {
      window.localStorage.setItem(
        CLE_CARTOUCHE,
        JSON.stringify({ projet: champProjet.value, element: champElement.value }),
      );
    } catch {
      // Stockage indisponible : la page fonctionne sans.
    }
  });
}

ecrireSaisie();
rendreCouches();
recalculer();

// Hors navigateur (tests), pas de service worker.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void import('./pwa').then((m) => m.enregistrerServiceWorker());
}
