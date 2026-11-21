/** Presentation du resultat : cartes de verification, volets, couches. Mise en forme pure : aucun calcul. */

import { type BlocResultat, echapper, type ElementNote, type LigneResultat, type NoteDeCalcul, nombreAffiche, notationHtml, tauxAffiche } from 'aedificium-ui';
import type { ResultatTransversal } from '../../src/transversal';
import type { Calcul, Resultat, Saisie } from './form';
import { phrase, textes } from './textes';

type Combinaison = Resultat['combinaisons'][number];

/** Nombre affiche ; une valeur non finie ne sort jamais en clair. */
const aff = (v: number, d: number): string => (Number.isFinite(v) ? nombreAffiche(v, d) : textes().vue.nonCalculable);
/** Taux affiche : tauxAffiche rend « hors domaine » pour un taux infini ou NaN. */
const taux = (v: number): string => tauxAffiche(v);
/** Symbole de notation mis en forme (indices). */
const sym = (s: string): string => notationHtml(s);
/** Texte du noyau traduit au besoin, notation et echappement pour le HTML. */
const texte = (s: string): string => notationHtml(phrase(s));
/** Valeur brute pour un champ de saisie (la saisie garde les chaines telles quelles). */
const brut = (v: string): string => echapper(v);

/** Largeur de jauge, bornee a 100 ; 100 pour un taux infini, 0 pour NaN. */
function largeur(v: number): string {
  if (Number.isNaN(v)) return '0';
  if (!Number.isFinite(v)) return v > 0 ? '100' : '0';
  return String(Math.min(100, Math.max(0, Math.round(v * 1000) / 10)));
}

/** Premier element de valeur maximale, ou undefined si la liste est vide. */
function pire<T>(liste: readonly T[], valeur: (x: T) => number): T | undefined {
  let m: T | undefined;
  for (const x of liste) if (m === undefined || valeur(x) > valeur(m)) m = x;
  return m;
}

const jauge = (v: number): string => `<div class="jauge"><i style="width:${largeur(v)}%"></i></div>`;

const gouvernant = (r: Resultat, verification: string, combinaison?: string): boolean =>
  r.gouvernant.verification === verification && (combinaison === undefined || r.gouvernant.combinaison === combinaison);

interface Carte {
  groupe: 'isole' | 'groupe' | 'service';
  verification: 'compression' | 'traction' | 'groupe' | 'tassement';
  titre: string;
  corps: string;
  controle: number | null;
  estGouvernant: boolean;
}

function rendreCarte(c: Carte): string {
  const classes = ['verdict'];
  if (c.controle !== null && c.controle > 1) classes.push('depasse');
  if (c.controle === null) classes.push('constat');
  const badge = c.estGouvernant ? ` <span class="badge">${textes().vue.gouvernant}</span>` : '';
  const barre = c.controle === null ? '' : `${jauge(c.controle)}<span class="taux">${taux(c.controle)}</span>`;
  return `<div class="${classes.join(' ')}" data-groupe="${c.groupe}" data-verification="${c.verification}">` +
    `<h3>${c.titre}${badge}</h3>${barre}<p>${c.controle !== null && c.controle > 1 ? c.corps.replace('≤', '&gt;') : c.corps}</p></div>`;
}

const ligne = (symbole: string, libelle: string, valeur: string): LigneResultat => ({ symbole, libelle, valeur });

// ---------------------------------------------------------------------------------------------
// Entrees
// ---------------------------------------------------------------------------------------------

export const entreesParSection = (c: Calcul): Record<'geometrie' | 'materiaux' | 'charges' | 'hypotheses', LigneResultat[]> => {
  const d = c.donnees;
  const e = textes().entrees;
  const m = (v: number): string => `${aff(v, 3)} m`;
  // Longueur totale : somme des epaisseurs de couches, seule presentation ici.
  const longueur = d.couches.reduce((t, couche) => t + couche.h, 0);

  const geometrie: LigneResultat[] = [
    ligne('D', e.diametre, m(d.pieu.D)),
    ligne('s', e.entraxe, m(d.groupe.s)),
    ligne('L', e.longueur, m(longueur)),
  ];
  const materiaux: LigneResultat[] = [
    ligne('E_eq', e.moduleEquiv, `${aff(d.service.Eeq, 1)} MPa`),
    ligne('E_p', e.modulePieu, `${aff(d.service.Ep, 1)} MPa`),
    ligne('ν', e.poisson, aff(d.service.nu, 3)),
  ];
  const charges: LigneResultat[] = [
    ligne('V_G', e.vg, `${aff(d.efforts.VG, 1)} kN`),
    ligne('V_Q', e.vq, `${aff(d.efforts.VQ, 1)} kN`),
    ligne('M_G', e.mg, `${aff(d.efforts.MG, 1)} kN·m`),
    ligne('M_Q', e.mq, `${aff(d.efforts.MQ, 1)} kN·m`),
  ];
  return { geometrie, materiaux, charges, hypotheses: [] };
};

export const blocEntrees = (c: Calcul): LigneResultat[] => {
  const e = entreesParSection(c);
  return [...e.geometrie, ...e.materiaux, ...e.charges, ...e.hypotheses];
};

// ---------------------------------------------------------------------------------------------
// Resultats
// ---------------------------------------------------------------------------------------------

export const blocsResultat = (r: Resultat): BlocResultat[] => {
  const v = textes().verifications;
  const c = pire(r.combinaisons, (x) =>
    Math.max(x.tauxCompression, x.tauxTraction, x.groupe?.taux ?? 0));
  if (c === undefined) return [];
  const l = textes().resultats;
  const g = r.gouvernant;
  const blocs: BlocResultat[] = [
    {
      titre: l.synthese,
      note: null,
      lignes: [
        ligne('taux', l.tauxGouvernant, taux(g.taux)),
        ligne('gouvernant', l.verificationGouvernante, [v[g.verification], g.combinaison].filter((x) => x).join(', ')),
      ],
    },
    {
      titre: `${v.compression} · ${c.nom}`,
      note: null,
      lignes: [
        ligne('F_cd', l.effort, `${aff(c.Fcd, 1)} kN`),
        ligne('R_cd', l.resistance, `${aff(c.Rcd, 1)} kN`),
        ligne('taux', textes().resultats.taux, taux(c.tauxCompression)),
      ],
    },
    {
      titre: `${v.traction} · ${c.nom}`,
      note: null,
      lignes: c.Nmin >= 0
        ? [ligne('N_min', l.effortMin, `${aff(c.Nmin, 1)} kN`), ligne('R_td', l.pourMemoire, `${aff(c.Rtd, 1)} kN`)]
        : [ligne('F_td', l.effort, `${aff(c.Ftd, 1)} kN`), ligne('R_td', l.resistance, `${aff(c.Rtd, 1)} kN`),
          ligne('taux', textes().resultats.taux, taux(c.tauxTraction))],
    },
  ];
  if (c.groupe !== null) {
    blocs.push({
      titre: `${v.groupe} · ${c.nom}`,
      note: null,
      lignes: [
        ligne('F_d', l.effort, `${aff(c.groupe.Fd, 1)} kN`),
        ligne('R_group,d', l.resistance, `${aff(c.groupe.Rd, 1)} kN`),
        ligne('taux', textes().resultats.taux, taux(c.groupe.taux)),
      ],
    });
  }
  blocs.push({
    titre: v.tassement,
    note: null,
    lignes: [
      ligne('s', l.tassement, `${aff(r.tassement.s, 2)} mm`),
      ligne('s_adm', l.admissible, `${aff(r.tassement.sAdm, 1)} mm`),
      ligne('taux', textes().resultats.taux, taux(r.tassement.taux)),
    ],
  });
  return blocs;
};

// ---------------------------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------------------------

const carteCompression = (r: Resultat, c: Combinaison): string => rendreCarte({
  groupe: 'isole',
  verification: 'compression',
  titre: textes().vue.compression,
  corps: texte(textes().vue.compressionCorps(aff(c.Fcd, 1), aff(c.Rcd, 1))),
  controle: c.tauxCompression,
  estGouvernant: gouvernant(r, 'compression', c.nom),
});

const carteTraction = (r: Resultat, c: Combinaison): string => {
  const sansObjet = c.Nmin >= 0;
  return rendreCarte({
    groupe: 'isole',
    verification: 'traction',
    titre: textes().vue.traction,
    corps: sansObjet
      ? texte(textes().vue.tractionSansObjet(aff(c.Nmin, 1), aff(c.Rtd, 1)))
      : texte(textes().vue.tractionCorps(aff(c.Ftd, 1), aff(c.Rtd, 1))),
    controle: sansObjet ? null : c.tauxTraction,
    estGouvernant: !sansObjet && gouvernant(r, 'traction', c.nom),
  });
};

const carteGroupe = (r: Resultat, c: Combinaison): string => {
  const g = c.groupe;
  if (g === null) return '';
  const detail = g.mode === 'rendement'
    ? textes().vue.groupeRendement(aff(g.sommeRep, 1), aff(g.blocRep, 1))
    : textes().vue.groupeBloc(aff(g.sommeRep, 1), aff(g.blocRep, 1));
  return rendreCarte({
    groupe: 'groupe',
    verification: 'groupe',
    titre: textes().vue.resistance,
    corps: `${texte(textes().vue.groupeCorps(aff(g.Fd, 1), aff(g.Rd, 1)))} ${texte(detail)}`,
    controle: g.taux,
    estGouvernant: gouvernant(r, 'groupe', c.nom),
  });
};

const carteTassement = (r: Resultat): string => {
  const t = r.tassement;
  const detail = t.semelle === null
    ? textes().vue.tassementIsole(aff(t.isole, 2))
    : textes().vue.tassementSemelle(aff(t.isole, 2), aff(t.semelle, 2));
  return rendreCarte({
    groupe: 'service',
    verification: 'tassement',
    titre: textes().vue.tassement,
    corps: `${texte(textes().vue.tassementCorps(aff(t.s, 2), aff(t.sAdm, 1)))} ${texte(detail)}`,
    controle: t.taux,
    estGouvernant: gouvernant(r, 'tassement'),
  });
};

export const verdictsHtml = (r: Resultat): string => {
  const v = textes().vue;
  let html = '';
  for (const c of r.combinaisons) {
    html += `<div class="groupe">${echapper(v.isole)} · ${echapper(c.nom)}</div>`;
    html += carteCompression(r, c);
    html += carteTraction(r, c);
    if (c.groupe !== null) {
      html += `<div class="groupe">${echapper(v.groupe)} · ${echapper(c.nom)}</div>`;
      html += carteGroupe(r, c);
    }
  }
  html += `<div class="groupe">${echapper(v.service)}</div>`;
  html += carteTassement(r);
  if (r.alertes.length > 0) {
    const items = r.alertes.map((a) => `<li>${texte(a)}</li>`).join('');
    html += `<div class="alertes"><h3>${echapper(v.alertes)}</h3><ul>${items}</ul></div>`;
  }
  return html;
};

// ---------------------------------------------------------------------------------------------
// Volets
// ---------------------------------------------------------------------------------------------

export const voletsHtml = (r: Resultat): string => {
  const d = textes();
  const c = pire(r.combinaisons, (x) =>
    Math.max(x.tauxCompression, x.tauxTraction, x.groupe?.taux ?? 0));

  const profils = r.profils.map((p, i) =>
    `<div class="profil" data-profil="${i}"><b>P${i + 1}</b>` +
    `<span>${sym('R_s')} = ${aff(p.Rs, 1)} kN</span>` +
    `<span>${sym('R_b')} = ${aff(p.Rb, 1)} kN</span>` +
    `<span>${sym('R_c,calc')} = ${aff(p.Rc, 1)} kN</span>` +
    `<span>${sym('R_bloc')} = ${p.Rbloc === null ? echapper(d.vue.sansObjet) : `${aff(p.Rbloc, 1)} kN`}</span></div>`,
  ).join('');

  let efforts = '';
  let coefficients = '';
  if (c !== undefined) {
    efforts = c.efforts.map((f, i) =>
      `<div class="file" data-file="${i}"><span>${echapper(d.resultats.colonneX)} = ${aff(f.x, 3)} m</span>` +
      `<span>${sym('N_d')} = ${aff(f.Nd, 1)} kN</span>` +
      `<span>${sym('F_d')} = ${aff(f.Fd, 1)} kN</span>` +
      `<span>${echapper(d.resultats.taux)} ${taux(f.taux)}</span></div>`,
    ).join('');
    coefficients = c.coefficients.map((k) =>
      `<div class="coefficient"><span>${texte(k.nom)} = ${aff(k.valeur, 3)}</span>` +
      `<span class="source">${texte(k.source)}</span></div>`,
    ).join('');
  }

  const hypotheses = d.note.hypotheses.map((h) => `<li>${texte(h)}</li>`).join('');

  return `<section class="volet" aria-label="${echapper(d.resultats.profils)}">` +
    `<h3>${echapper(d.resultats.profils)}</h3><div class="profils">${profils}</div></section>` +
    `<section class="volet" aria-label="${echapper(d.resultats.efforts)}">` +
    `<h3>${echapper(d.resultats.efforts)}</h3><div class="efforts">${efforts}</div></section>` +
    `<section class="volet" aria-label="${echapper(d.resultats.coefficients)}">` +
    `<h3>${echapper(d.resultats.coefficients)}</h3><div class="coefficients">${coefficients}</div></section>` +
    `<section class="volet" aria-label="${echapper(d.resultats.hypotheses)}">` +
    `<h3>${echapper(d.resultats.hypotheses)}</h3><ul class="hypotheses">${hypotheses}</ul></section>`;
};

// ---------------------------------------------------------------------------------------------
// Couches et pointes
// ---------------------------------------------------------------------------------------------

export const couchesHtml = (s: Saisie): string => {
  const d = textes();
  const champ = (libelle: string, entree: string): string => `<label><span>${libelle}</span>${entree}</label>`;
  const decimal = (attributs: string, valeur: string): string =>
    `<input type="text" inputmode="decimal" ${attributs} value="${brut(valeur)}">`;
  const couches = s.couches.map((couche, i) => {
    const valeurs = s.qb.map((_, p) =>
      champ(`P${p + 1}`, decimal(`data-qs="${i}:${p}"`, couche.qs[p])),
    ).join('');
    return `<fieldset class="couche"><legend>${echapper(d.resultats.couche)} ${i + 1}</legend>` +
      champ(echapper(d.resultats.nom), `<input type="text" data-couche="${i}" data-sous="nom" value="${echapper(couche.nom)}">`) +
      champ(echapper(d.refus.champs.h), decimal(`data-couche="${i}" data-sous="h"`, couche.h)) +
      champ(sym('τ_dd'), decimal(`data-couche="${i}" data-sous="tauDd"`, couche.tauDd)) +
      `<div class="ligne-profils"><span>${sym('q_s')}</span><div class="profils-saisie">${valeurs}</div></div>` +
      `<button type="button" data-action="retirer-couche" data-couche="${i}">−</button>` +
      `</fieldset>`;
  }).join('');

  const pointes = `<div class="ligne-profils"><span>${sym('q_b')}</span><div class="profils-saisie">` +
    s.qb.map((qb, p) => champ(`P${p + 1}`, decimal(`data-qb="${p}"`, qb))).join('') + `</div></div>`;

  return `<div class="couches">${couches}</div><div class="pointes">${pointes}</div>`;
};

// ---------------------------------------------------------------------------------------------
// Erreurs
// ---------------------------------------------------------------------------------------------

export const messageDErreur = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

// ---------------------------------------------------------------------------------------------
// Onglet Transversal
// ---------------------------------------------------------------------------------------------

/** Tableau de sol du transversal : noms et épaisseurs communs avec l'axial. */
export const couchesTrHtml = (s: Saisie): string => {
  const d = textes();
  const e = d.tr.entrees;
  const dec = (i: number, k: string, v: string): string =>
    `<td><input type="text" inputmode="decimal" data-couche="${i}" data-sous="${k}" value="${brut(v)}"></td>`;
  const grise = '<td class="grise">—</td>';
  const options = (valeurs: Record<string, string>, courant: string): string =>
    Object.entries(valeurs).map(([k, l]) => `<option value="${k}"${k === courant ? ' selected' : ''}>${echapper(l)}</option>`).join('');
  const lignes = s.couches.map((c, i) => {
    const draine = c.comportement !== 'non-draine';
    return `<tr data-couche-tr="${i}">` +
      `<td><input type="text" class="nom" data-couche="${i}" data-sous="nom" value="${echapper(c.nom)}"></td>` +
      dec(i, 'h', c.h) +
      `<td><select data-couche="${i}" data-sous="comportement">${options(e.comportement, c.comportement)}</select></td>` +
      dec(i, 'gamma', c.gamma) + dec(i, 'gammaSat', c.gammaSat) +
      (draine ? dec(i, 'phi', c.phi) + dec(i, 'c', c.c) + grise : grise + grise + dec(i, 'cu', c.cu)) +
      `<td><select data-couche="${i}" data-sous="yf">${options(e.yf, c.yf)}</select></td>` +
      `<td><button type="button" data-action="retirer-couche" data-couche="${i}">−</button></td></tr>`;
  }).join('');
  const th = (h: string, n = true) => `<th${n ? ' class="n"' : ''}>${h}</th>`;
  return `<div class="defile"><table class="sol"><thead><tr>${th(echapper(d.resultats.couche), false)}${th('h (m)')}` +
    `${th('', false)}${th(sym('γ'))}${th(sym('γ_sat'))}${th('φ′ (°)')}${th('c′ (kPa)')}${th(`${sym('c_u')} (kPa)`)}${th(`${sym('y_f')} (C.11)`, false)}<th></th></tr></thead>` +
    `<tbody>${lignes}</tbody></table></div>`;
};

/** Cartes de l'onglet Transversal : résistance par combinaison, efforts, plastification, service. */
export const verdictsTrHtml = (r: ResultatTransversal, MRd: number | null): string => {
  const t = textes().tr;
  const n = t.note;
  const v = t.vue;
  const carte = (titre: string, clause: string, corps: string, controle: number | null, gouv = false): string => {
    const classes = ['verdict', controle === null ? 'constat' : controle > 1 ? 'depasse' : 'ok'];
    const badge = gouv ? ` <span class="badge">${textes().vue.gouvernant}</span>` : '';
    const barre = controle === null ? '' : `${jauge(controle)}<span class="taux">${taux(controle)}</span>`;
    return `<div class="${classes.join(' ')}" data-verification-tr><h3>${titre}${badge} <span class="clause">${texte(clause)}</span></h3>${barre}<p>${corps}</p></div>`;
  };
  let html = `<div class="groupe">${echapper(v.resistance)}</div>`;
  for (const k of r.combinaisons) {
    const corps = k.py === null
      ? texte(v.sansEquilibre)
      : texte(v.resistanceCorps(aff(k.Hd, 1), aff(k.resistance.H, 0)));
    html += carte(texte(n.verification(k.nom)), n.clauseTr[r.generation], corps, k.taux,
      r.combinaisons.length > 1 && k.nom === r.gouvernant.combinaison);
  }
  html += `<div class="groupe">${echapper(v.efforts)}</div>`;
  const m = r.MEd;
  const corpsM = m.combinaison === ''
    ? texte(v.sansEquilibre)
    : texte(v.effortsCorps(aff(m.valeur, 1), aff(m.z, 2), m.combinaison, aff(r.VEd, 1))) + (MRd === null ? ` ${texte(v.sansMRd)}` : ` ${sym('M_Rd')} = ${aff(MRd, 1)} kN·m.`);
  html += carte(texte(MRd === null ? v.moment : n.verificationM), MRd === null ? 'C.13.1' : n.clauseM, corpsM, r.tauxStructure);
  let plast = { l: 0, nom: '' };
  for (const k of r.combinaisons) if (k.py !== null && k.py.zonePlastique >= plast.l) plast = { l: k.py.zonePlastique, nom: k.nom };
  if (plast.nom !== '') html += carte(echapper(v.plastification), 'C.12', texte(v.plastificationCorps(aff(plast.l, 2), plast.nom)), null);
  html += `<div class="groupe">${echapper(v.service)}</div>`;
  const s = r.service;
  html += carte(echapper(v.service), v.ELS, s === null ? texte(v.serviceSans) : texte(v.serviceCorps(aff(s.yTete * 1000, 1), aff(s.rotationTete * 1000, 2))), null);
  if (r.alertes.length > 0) {
    const items = r.alertes.map((a) => `<li>${texte(a)}</li>`).join('');
    html += `<div class="alertes"><h3>${echapper(textes().vue.alertes)}</h3><ul>${items}</ul></div>`;
  }
  return html;
};

/** Volets de l'onglet Transversal : tableaux de la note, coefficients, hypothèses. */
export const voletsTrHtml = (note: NoteDeCalcul): string => {
  const d = textes();
  const tableaux = (note.sections.calculs ?? []).filter((e): e is Extract<ElementNote, { type: 'tableau' }> => e.type === 'tableau');
  const tableau = (e: Extract<ElementNote, { type: 'tableau' }>): string =>
    `<section class="volet"><h3>${texte(e.titre ?? '')}</h3><div class="defile"><table class="tableau-tr"><thead><tr>` +
    e.entetes.map((h) => `<th>${texte(h)}</th>`).join('') + '</tr></thead><tbody>' +
    e.lignes.map((l) => `<tr>${l.map((x, j) => `<td${j === 0 ? '' : ' class="n"'}>${texte(x)}</td>`).join('')}</tr>`).join('') +
    '</tbody></table></div></section>';
  const coefficients = (note.sections.combinaisons ?? []).flatMap((e) => (e.type === 'bloc' ? [e.bloc] : [])).map((b) =>
    `<div class="coefficients"><b>${texte(b.titre)}</b>` +
    b.lignes.map((l) => `<div class="coefficient"><span>${texte(l.symbole)} = ${echapper(l.valeur)}</span><span class="source">${texte(l.libelle)}</span></div>`).join('') + '</div>',
  ).join('');
  const hypotheses = d.tr.note.hypotheses.map((h) => `<li>${texte(h)}</li>`).join('');
  return tableaux.map(tableau).join('') +
    `<section class="volet"><h3>${echapper(d.resultats.coefficients)}</h3>${coefficients}</section>` +
    `<section class="volet"><h3>${echapper(d.resultats.hypotheses)}</h3><ul class="hypotheses">${hypotheses}</ul></section>`;
};

/** Blocs de la note (entrées et tableaux) pour le CSV. */
export const blocsCsvTr = (note: NoteDeCalcul): BlocResultat[] => {
  const blocs: BlocResultat[] = [];
  for (const sec of Object.values(note.sections)) {
    for (const e of sec) {
      if (e.type === 'bloc') blocs.push(e.bloc);
      if (e.type === 'tableau') {
        blocs.push({
          titre: e.titre ?? '',
          note: null,
          lignes: e.lignes.map((l) => ligne(l[0], e.entetes.slice(1).map((h, j) => `${h} ${l[j + 1]}`).join(' ; '), '')),
        });
      }
    }
  }
  blocs.push({ titre: textes().tr.note.verificationM, note: null, lignes: note.verifications.map((v) => ligne(v.nom, v.clause ?? "", v.taux === null ? "" : tauxAffiche(v.taux))) });
  return blocs;
};
