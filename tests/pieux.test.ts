// Tests d'acceptation du noyau pieux (PLAN.md). Attendus calcules a part (script Python
// independant, sans le code de l'outil). A ne pas modifier.
import { describe, expect, it } from 'vitest';
import { rendementConverseLabarre, verifierPieux, type DonneesPieux, type Norme } from '../src/pieux';

const proche = (x: number, attendu: number, rel = 0.0005) =>
  expect(Math.abs(x - attendu) / Math.abs(attendu)).toBeLessThanOrEqual(rel);

const n2: Norme = { generation: 2, cc: 'CC2', methode: 'modele-pieu', base: 'sol', resistance: 'separee', dAvg: 30 };

function cas(norme: Norme = n2): DonneesPieux {
  return {
    pieu: { D: 0.6, execution: 'fore' },
    groupe: { nx: 3, ny: 2, s: 1.8, eta: 0.76, ratioQbBloc: 1, redistribution: false },
    couches: [
      { nom: 'Remblai', h: 3, qs: [0, 0, 0], tauDd: 20 },
      { nom: 'Argile', h: 5, qs: [40, 35, 45], tauDd: 0 },
      { nom: 'Sable', h: 6, qs: [80, 70, 75], tauDd: 0 },
    ],
    qb: [2800, 2400, 2600],
    efforts: { VG: 2000, VQ: 600, MG: 0, MQ: 400 },
    service: { Eeq: 60, nu: 0.3, Ep: 30, sAdm: 25 },
    norme,
  };
}

describe('2e generation, modele de pieu', () => {
  const r = verifierPieux(cas());
  const c = r.combinaisons[0];
  it('une combinaison VC1', () => {
    expect(r.combinaisons.map((x) => x.nom)).toEqual(['VC1']);
  });
  it('profils et CoV', () => {
    expect(r.longueur).toBe(14);
    proche(r.profils[1].Rc, 1800.1325905069514);
    proche(r.cov, 0.0727535863001036);
  });
  it('compression', () => {
    proche(c.Rcrep, 1463.5224313064646);
    expect(c.branche).toBe('minimum');
    proche(c.Rcd, 1142.9778150255547);
    proche(c.Dd, 152.68140296446396);
    proche(c.Fcd, 836.0147362977973);
    proche(c.tauxCompression, 836.0147362977973 / 1142.9778150255547);
  });
  it('efforts par file, traction sans objet', () => {
    expect(c.efforts).toHaveLength(3);
    proche(c.Nmin, 250);
    expect(c.Ftd).toBe(0);
    expect(c.tauxTraction).toBe(0);
    proche(c.Rtd, 660.7450084432404);
  });
  it('groupe', () => {
    const g = c.groupe!;
    proche(g.sommeRep, 6673.662286757479);
    proche(g.blocRep, 26053.658536585368);
    expect(g.mode).toBe('rendement');
    proche(g.Rd, 4766.901633398199);
    proche(g.Fd, 4516.088417786784);
  });
  it('tassement et gouvernant', () => {
    proche(r.tassement.isole, 13.164933703247797);
    proche(r.tassement.semelle!, 9.38888888888889);
    proche(r.tassement.s, 13.164933703247797);
    expect(r.gouvernant.verification).toBe('groupe');
  });
  it('coefficients sources', () => {
    for (const k of c.coefficients) expect(k.source.length).toBeGreaterThan(0);
  });
  it('CC3 majore les actions, pas le frottement negatif', () => {
    proche(verifierPieux(cas({ ...n2, cc: 'CC3' })).combinaisons[0].Fcd, 904.3480696311307);
  });
  it('resistance totale', () => {
    proche(verifierPieux(cas({ ...n2, resistance: 'totale' })).combinaisons[0].Rcd, 1108.7291146261095);
  });
  it('redistribution et espacement', () => {
    const d = cas();
    d.groupe.redistribution = true;
    proche(verifierPieux(d).combinaisons[0].Rcrep, 1626.1360347849607);
    proche(verifierPieux(cas({ ...n2, dAvg: 15 })).combinaisons[0].Rcrep, 1614.4686910376245);
  });
  it('traction declenchee par le moment', () => {
    const d = cas();
    d.efforts.MQ = 4000;
    const t = verifierPieux(d).combinaisons[0];
    proche(t.Ftd, 500);
    proche(t.tauxTraction, 500 / 660.7450084432404);
  });
  it('xi interpoles pour n = 6', () => {
    const d = cas();
    for (const c2 of d.couches) c2.qs = [...c2.qs, c2.qs[0], c2.qs[1], c2.qs[2]];
    d.qb = [...d.qb, ...d.qb];
    const c6 = verifierPieux(d).combinaisons[0];
    proche(c6.xiMoyen, 1.28);
    proche(c6.xiMin, 1.135);
  });
  it('alerte CoV et un seul profil', () => {
    const d = cas();
    d.couches[2].qs = [200, 40, 75];
    expect(verifierPieux(d).alertes.join(' ')).toContain('12 %');
    const u = cas();
    for (const c2 of u.couches) c2.qs = [c2.qs[0]];
    u.qb = [2800];
    expect(verifierPieux(u).alertes.join(' ')).toContain('seul profil');
  });
});

describe('2e generation, modele de terrain', () => {
  const terrain: Norme = { generation: 2, cc: 'CC2', methode: 'modele-terrain', baseTerrain: 'etendue', resistance: 'totale' };
  it('un seul profil, R_rep = R_calc', () => {
    const d = cas(terrain);
    for (const c of d.couches) c.qs = [c.qs[1]];
    d.qb = [2400];
    const c = verifierPieux(d).combinaisons[0];
    proche(c.Rcrep, 1800.1325905069514);
    proche(c.Rcd, 1800.1325905069514 / (1.3 * 1.3));
  });
  it('plusieurs profils refuses', () => {
    expect(() => verifierPieux(cas(terrain))).toThrow(/profil/);
  });
});

describe('1re generation', () => {
  it('DA1 recommande, fore', () => {
    const r = verifierPieux(cas({ generation: 1, profil: 'recommande', approche: 'DA1' }));
    expect(r.combinaisons.map((c) => c.nom)).toEqual(['DA1-1', 'DA1-2']);
    proche(r.combinaisons[0].Rcd, 1353.1835673755058);
    proche(r.combinaisons[0].Rtd, 729.4624893213373);
    proche(r.combinaisons[1].Rcd, 1046.2151895163006);
    proche(r.combinaisons[1].Fcd, 648.652891084788);
    proche(r.combinaisons[0].groupe!.Rd, 6170.517067232307);
  });
  it('DA2 et DA3', () => {
    proche(verifierPieux(cas({ generation: 1, profil: 'recommande', approche: 'DA2' })).combinaisons[0].Rcd, 1330.4749375513313);
    proche(verifierPieux(cas({ generation: 1, profil: 'recommande', approche: 'DA3' })).combinaisons[0].Fcd, 796.4306688625659);
  });
  it('ANB, une seule combinaison, xi selon CPT et rigidite', () => {
    const r = verifierPieux(cas({ generation: 1, profil: 'anb', risque: 'normal', densiteCpt: 100, rigide: true, sondageProche: false }));
    expect(r.combinaisons.map((c) => c.nom)).toEqual(['DA1-1']);
    proche(r.combinaisons[0].Rcd, 1492.9515530776275);
    proche(r.combinaisons[0].Rtd, 992.5208648951825);
  });
  it('sondage proche : 1,08', () => {
    const c = verifierPieux(cas({ generation: 1, profil: 'anb', risque: 'normal', densiteCpt: 100, rigide: true, sondageProche: true })).combinaisons[0];
    expect(c.xiMoyen).toBe(1.08);
    expect(c.xiMin).toBe(1.08);
  });
  it('visse refuse hors ANB, non classe refuse en 1re', () => {
    const d = cas({ generation: 1, profil: 'recommande', approche: 'DA1' });
    d.pieu.execution = 'visse';
    expect(() => verifierPieux(d)).toThrow(/vissé/);
    d.pieu.execution = 'non-classe';
    expect(() => verifierPieux(d)).toThrow(/classé/);
  });
});

describe('rendement', () => {
  it('Converse-Labarre', () => {
    proche(rendementConverseLabarre(0.6, 1.8, 3, 2), 0.76103);
  });
});

describe('cas limites', () => {
  it('pieu isole : pas de groupe, moment refuse', () => {
    const d = cas();
    d.groupe.nx = 1;
    d.groupe.ny = 1;
    d.efforts.MQ = 0;
    const r = verifierPieux(d);
    expect(r.combinaisons[0].groupe).toBeNull();
    expect(r.tassement.semelle).toBeNull();
    d.efforts.MQ = 10;
    expect(() => verifierPieux(d)).toThrow(/moment/i);
  });
  it('saisies invalides', () => {
    const v = (m: (d: DonneesPieux) => void) => {
      const d = cas();
      m(d);
      return () => verifierPieux(d);
    };
    expect(v((d) => { d.pieu.D = 0; })).toThrow();
    expect(v((d) => { d.qb = [1, 2]; })).toThrow(/profils/);
    expect(v((d) => { d.couches[1].h = NaN; })).toThrow();
    expect(v((d) => { d.groupe.eta = 1.2; })).toThrow(/rendement/i);
    expect(v((d) => { d.couches = []; })).toThrow(/couche/);
  });
  it('resistance nulle refusee', () => {
    const d = cas();
    d.qb = [0, 0, 0];
    for (const c of d.couches) c.qs = [0, 0, 0];
    expect(() => verifierPieux(d)).toThrow(/résistance/);
  });
});
