// Tests d'acceptation du noyau transversal (PLAN-transversal.md, T1). Ecrits par Claude le 20/11/2026.
// Attendus : tests/reference/transversal.py et attendus.py (python tests/reference/attendus.py),
// plus deux solutions analytiques (Hetenyi, pieu rigide en sol uniforme). A ne pas modifier.
import { describe, expect, it } from 'vitest';
import {
  analysePY,
  coefficientsBrinchHansen,
  contrainteVerticale,
  pressionUltime,
  resistanceTransversale,
  verifierTransversal,
  type CoucheTransversale,
  type DonneesTransversal,
  type Modele,
} from '../src/transversal';

const proche = (v: number, attendu: number, rel: number): void => {
  expect(Math.abs(v - attendu)).toBeLessThanOrEqual(rel * Math.max(Math.abs(attendu), 1e-9));
};

const couches = (): CoucheTransversale[] => [
  { nom: 'Remblai', h: 3, gamma: 18, gammaSat: 20, comportement: 'draine', phi: 30, c: 0, cu: 0, yf: 'grenu' },
  { nom: 'Argile', h: 5, gamma: 19, gammaSat: 19, comportement: 'non-draine', phi: 0, c: 0, cu: 50, yf: 'fin-court' },
  { nom: 'Sable', h: 6, gamma: 20, gammaSat: 21, comportement: 'draine', phi: 35, c: 0, cu: 0, yf: 'grenu' },
];

/** Cas de la maquette : pieu fore D 0,6 m, L 14 m, nappe a 3 m, 2e generation CC2. */
function cas(tete: 'libre' | 'encastree' = 'libre'): DonneesTransversal {
  return {
    D: 0.6, EI: 190852, tete, zNappe: 3, fluage: false, couches: couches(),
    efforts: { HG: 60, HQ: 40, MG: 0, MQ: 0, NG: 800, NQ: 300 },
    MRd: null,
    norme: { generation: 2, cc: 'CC2', resistance: 'separee', methode: 'modele-pieu', base: 'sol', dAvg: 30 },
  };
}

const uniforme = (L: number, pf: number): Modele => ({ L, D: 0.6, EI: 190852, pf: () => pf, yf: () => 0.06 });

describe('Brinch Hansen (1961), EN 1997-3 figure C.9', () => {
  const attendus: Record<string, { Kq: number; Kc: number }> = {"15-0.5": {"Kq": 1.7045165561202127, "Kc": 6.489591086167368}, "15-20": {"Kq": 3.082617574759671, "Kc": 16.235955231804468}, "20-10": {"Kq": 4.558853560213467, "Kc": 20.41893172062448}, "25-5": {"Kq": 6.0518129495798085, "Kc": 24.43505317788343}, "30-0": {"Kq": 4.753055768221747, "Kc": 6.973586903856066}, "30-5": {"Kq": 9.237428682218711, "Kc": 35.57806563294135}, "30-20": {"Kq": 13.550121584504476, "Kc": 51.33736899168775}, "35-1": {"Kq": 8.846567799507227, "Kc": 22.756060142787394}, "35-20": {"Kq": 23.381921672119084, "Kc": 90.17952168470008}};
  it('formules fermees', () => {
    for (const [cle, v] of Object.entries(attendus)) {
      const [phi, x] = cle.split('-').map(Number);
      const k = coefficientsBrinchHansen(phi, x);
      proche(k.Kq, v.Kq, 1e-9);
      proche(k.Kc, v.Kc, 1e-9);
    }
  });
  it('lecture de la figure C.9 a z/D = 20 (a 10 % pres)', () => {
    proche(coefficientsBrinchHansen(15, 20).Kq, 3.1, 0.1);
    proche(coefficientsBrinchHansen(30, 20).Kq, 13.5, 0.1);
    proche(coefficientsBrinchHansen(30, 20).Kc, 52, 0.1);
    proche(coefficientsBrinchHansen(35, 20).Kc, 93, 0.1);
  });
});

describe('resistance ultime p_f (C.16 a C.19)', () => {
  it('contrainte verticale effective par couches, nappe a 3 m (gamma_w = 10)', () => {
    for (const [z, v] of Object.entries({"2": 36.0, "3": 54.0, "5": 72.0, "10": 121.0})) proche(contrainteVerticale(cas(), Number(z)), v as number, 1e-9);
  });
  it('p_f M1 : drainé (Brinch Hansen), non drainé (min de 9 c_u et C.18), constant sous 20 D', () => {
    for (const [z, v] of Object.entries({"0": 0.0, "1.5": 201.55090734430968, "3.5": 352.9444444444444, "6": 450.0, "10": 2675.3704392709633, "14": 3343.614799113029})) proche(pressionUltime(cas(), Number(z)), v as number, 1e-9);
  });
  it('p_f M2 : tan phi / 1,25, c_u / 1,4', () => {
    const m2 = { gPhi: 1.25, gC: 1.25, gCu: 1.4 };
    for (const [z, v] of Object.entries({"1.5": 133.73022115744638, "3.5": 268.8174603174603, "6": 321.42857142857144, "10": 1460.7784193638847})) proche(pressionUltime(cas(), Number(z), m2), v as number, 1e-9);
  });
  it('fluage : 6 c_u (C.17)', () => {
    const c = { ...cas(), fluage: true };
    for (const [z, v] of Object.entries({"3.5": 300.0, "6": 300.0})) proche(pressionUltime(c, Number(z)), v as number, 1e-9);
  });
});

describe('poutre sur ressorts p-y', () => {
  it('Hetenyi, pieu long elastique, tete libre (y0 et M_max a 0,5 %)', () => {
    const r = analysePY(uniforme(30, 1000), { H: 100, M: 0, N: 0 }, 'libre')!;
    proche(r.yTete, 0.00676613749681088, 0.005);
    proche(r.MEd, 95.29809293764974, 0.005);
    expect(Math.abs(r.zMEd - 2.321555433266422)).toBeLessThanOrEqual(0.15 + 1e-9);
    expect(r.zonePlastique).toBe(0);
  });
  it('Hetenyi, tete encastree : y0 = H.beta/k, M0 = -H/(2 beta)', () => {
    const r = analysePY(uniforme(30, 1000), { H: 100, M: 0, N: 0 }, 'encastree')!;
    proche(r.yTete, 0.00338306874840544, 0.005);
    proche(r.Mtete, -147.7948091464791, 0.005);
    expect(r.rotationTete).toBe(0);
  });
  it('cas de la maquette : reference Python (1e-4)', () => {
    const ref = {"libre": {"(a)": {"y0": 0.035782974113179905, "rot": -0.009312013464786313, "M0": 0.0, "MEd": 338.8718158885779, "zM": 3.5000000000000004, "VEd": 141.0, "plast": 0.0, "taux": 0.06170547471331626, "Hult": 2285.0484605310344, "zr": 11.541632601727379}, "(b)": {"y0": 0.03491623364156613, "rot": -0.008492261551641843, "M0": 0.0, "MEd": 289.6970182579113, "zM": 3.7100000000000004, "VEd": 112.0, "plast": 0.0, "taux": 0.07981527549000876, "Hult": 1403.2401606384244, "zr": 11.457917968131042}, "ELS": {"y0": 0.02484378641156716, "rot": -0.00644602214908666, "M0": 0.0, "MEd": 234.07219562563463, "zM": 3.5000000000000004, "VEd": 100.0, "plast": 0.0, "taux": null, "Hult": null, "zr": null}}, "encastree": {"(a)": {"y0": 0.012359666760333756, "rot": 0.0, "M0": -354.66941131693443, "MEd": 354.66941131693443, "zM": 0.0, "VEd": 141.0, "plast": 0.0, "taux": 0.011646960723346946, "Hult": 12106.162573155938, "zr": null}, "(b)": {"y0": 0.012019314738564137, "rot": 0.0, "M0": -301.9754976074614, "MEd": 301.9754976074614, "zM": 0.0, "VEd": 112.0, "plast": 0.0, "taux": 0.016363883144651793, "Hult": 6844.341224509719, "zr": null}, "ELS": {"y0": 0.008715970853361121, "rot": 0.0, "M0": -250.19795434624848, "MEd": 250.19795434624848, "zM": 0.0, "VEd": 100.0, "plast": 0.0, "taux": null, "Hult": null, "zr": null}}};
    for (const tete of ['libre', 'encastree'] as const) {
      const r = verifierTransversal(cas(tete));
      expect(r.combinaisons.map((k) => k.nom)).toEqual(['(a)', '(b)']);
      for (const k of r.combinaisons) {
        const a = (ref[tete] as unknown as Record<string, Record<string, number>>)[k.nom];
        proche(k.py!.yTete, a.y0, 1e-4);
        proche(k.py!.MEd, a.MEd, 1e-4);
        expect(Math.abs(k.py!.zMEd - a.zM)).toBeLessThanOrEqual(1e-6);
        proche(k.py!.VEd, a.VEd, 1e-4);
        proche(k.py!.Mtete, a.M0, 1e-4);
        expect(k.py!.zonePlastique).toBeCloseTo(a.plast, 6);
        proche(k.taux, a.taux, 1e-6);
        proche(k.resistance.H, a.Hult, 1e-6);
      }
      const s = (ref[tete] as unknown as Record<string, Record<string, number>>).ELS;
      proche(r.service!.yTete, s.y0, 1e-4);
      proche(r.service!.MEd, s.MEd, 1e-4);
    }
  });
  it('rotation en tete libre : derivee dy/dz en tete (reference Python)', () => {
    proche(verifierTransversal(cas()).combinaisons[0].py!.rotationTete, -0.009312013464786313, 1e-4);
  });
  it('second ordre : N augmente le moment (N.y\u2033, C.21)', () => {
    const m = { L: 14, D: 0.6, EI: 190852, pf: (z: number) => pressionUltime(cas(), z), yf: (z: number) => (z <= 3 || z > 8 ? 0.06 : 0.03) };
    proche(analysePY(m, { H: 141, M: 0, N: 0 }, 'libre')!.MEd, 309.2494192824721, 1e-4);
    proche(analysePY(m, { H: 141, M: 0, N: 1530 }, 'libre')!.MEd, 338.8718158885779, 1e-4);
  });
  it('moment en tete : M > 0 dans le sens de H appliquee au-dessus de la tete', () => {
    const m = { L: 14, D: 0.6, EI: 190852, pf: (z: number) => pressionUltime(cas(), z), yf: (z: number) => (z <= 3 || z > 8 ? 0.06 : 0.03) };
    const r = analysePY(m, { H: 141, M: 108, N: 1530 }, 'libre')!;
    proche(r.yTete, 0.0429155801713615, 1e-4);
    proche(r.MEd, 429.18192822787125, 1e-4);
    proche(resistanceTransversale(m, { H: 141, M: 108 }, 'libre').taux, 0.06580716533988351, 1e-6);
  });
});

describe('resistance transversale du terrain (6.6.2.3), mecanisme de Brinch Hansen', () => {
  it('sol uniforme, tete libre : H = P.L.(racine 2 - 1), rotation a L / racine 2', () => {
    const r = resistanceTransversale(uniforme(8, 300), { H: 1, M: 0 }, 'libre');
    proche(r.H, 596.4675298172571, 1e-6);
    proche(r.zRotation!, 5.65685424949238, 1e-6);
    proche(r.taux, 1 / 596.4675298172571, 1e-6);
  });
  it('sol uniforme, tete encastree : translation, H = P.L', () => {
    const r = resistanceTransversale(uniforme(8, 300), { H: 1, M: 0 }, 'encastree');
    proche(r.H, 1440.0, 1e-9);
    expect(r.zRotation).toBe(null);
  });
  it('excentricite e = M/H = 2 m : resistance reduite', () => {
    const r = resistanceTransversale(uniforme(8, 300), { H: 1, M: 2 }, 'libre');
    proche(r.taux, 0.00229359419286944, 1e-6);
    proche(r.zRotation!, 5.211102550927979, 1e-6);
  });
  it('pieu court : equilibre p-y sous la resistance, aucun au-dessus', () => {
    const c: DonneesTransversal = { ...cas(), zNappe: 10, couches: [{ nom: 'Sable', h: 3, gamma: 18, gammaSat: 20, comportement: 'draine', phi: 30, c: 0, cu: 0, yf: 'grenu' }] };
    const m: Modele = { L: 3, D: 0.6, EI: 190852, pf: (z) => pressionUltime(c, z), yf: () => 0.06 };
    const R = resistanceTransversale(m, { H: 1, M: 0 }, 'libre');
    proche(R.H, 92.48132536623575, 1e-6);
    expect(analysePY(m, { H: 0.9 * R.H, M: 0, N: 0 }, 'libre')).not.toBe(null);
    expect(analysePY(m, { H: 1.1 * R.H, M: 0, N: 0 }, 'libre')).toBe(null);
  });
});

describe('verification complete', () => {
  it('2e generation : (a) VC1 + M1, (b) VC3 + M2 ; efforts de calcul et coefficients sources', () => {
    const r = verifierTransversal(cas());
    const [a, b] = r.combinaisons;
    proche(a.Hd, 141, 1e-12); proche(a.Nd, 1530, 1e-12); proche(b.Hd, 112, 1e-12); proche(b.Nd, 1190, 1e-12);
    for (const k of r.combinaisons) for (const co of k.coefficients) expect(co.source).not.toBe('');
    expect(r.gouvernant.combinaison).toBe('(b)');
    expect(r.MEd.combinaison).toBe('(a)');
    proche(r.MEd.valeur, 338.8718158885779, 1e-4);
    expect(r.NEd).toBeCloseTo(1530, 9);
    expect(r.tauxStructure).toBe(null);
    expect(r.longueur).toBe(14);
  });
  it('M_Rd saisi : taux de structure M_Ed / M_Rd', () => {
    const r = verifierTransversal({ ...cas(), MRd: 400 });
    proche(r.tauxStructure!, 338.8718158885779 / 400, 1e-4);
  });
  it('1re generation DA1 : DA1-1 et DA1-2 (memes valeurs que (a) et (b) ici)', () => {
    const r = verifierTransversal({ ...cas(), norme: { generation: 1, profil: 'recommande', approche: 'DA1' } });
    expect(r.combinaisons.map((k) => k.nom)).toEqual(['DA1-1', 'DA1-2']);
    proche(r.combinaisons[0].py!.MEd, 338.8718158885779, 1e-4);
    proche(r.combinaisons[1].taux, 0.07981527549000876, 1e-6);
  });
  it('1re generation DA3 : actions A1 sur le pieu, sol M2', () => {
    const r = verifierTransversal({ ...cas(), norme: { generation: 1, profil: 'recommande', approche: 'DA3' } });
    expect(r.combinaisons.map((k) => k.nom)).toEqual(['DA3']);
    proche(r.combinaisons[0].Hd, 141, 1e-12);
  });
  it('ANB 2022 : DA1', () => {
    const r = verifierTransversal({ ...cas(), norme: { generation: 1, profil: 'anb', risque: 'normal', densiteCpt: 100, rigide: false, sondageProche: false } });
    expect(r.combinaisons.map((k) => k.nom)).toEqual(['DA1-1', 'DA1-2']);
  });
  it('DA2 refuse : pas de facteur de resistance transversale sourcé', () => {
    expect(() => verifierTransversal({ ...cas(), norme: { generation: 1, profil: 'recommande', approche: 'DA2' } })).toThrow(/DA2/);
  });
  it('pas d equilibre : taux infini et alerte', () => {
    const c: DonneesTransversal = { ...cas(), zNappe: 10, couches: [{ nom: 'Sable', h: 3, gamma: 18, gammaSat: 20, comportement: 'draine', phi: 30, c: 0, cu: 0, yf: 'grenu' }],
      efforts: { HG: 200, HQ: 0, MG: 0, MQ: 0, NG: 0, NQ: 0 } };
    const r = verifierTransversal(c);
    expect(r.combinaisons[0].py).toBe(null);
    expect(r.combinaisons[0].taux).toBeGreaterThan(1);
    expect(r.alertes.length).toBeGreaterThan(0);
  });
  it('refus des donnees', () => {
    expect(() => verifierTransversal({ ...cas(), D: 0 })).toThrow();
    expect(() => verifierTransversal({ ...cas(), EI: -1 })).toThrow();
    expect(() => verifierTransversal({ ...cas(), couches: [] })).toThrow();
    const c = cas(); c.couches[1].cu = 0;
    expect(() => verifierTransversal(c)).toThrow(/Argile/);
    const e = cas(); e.couches[0].phi = 70;
    expect(() => verifierTransversal(e)).toThrow(/Remblai/);
  });
});
