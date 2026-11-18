// Validation externe (audit R1, lot B) : rapport JRC EUR 26227 EN (2013), exemple A.8, pieu fore
// dimensionne sur un profil CPT. Attendus du rapport ; voir docs/validation/jrc-2013-a8-pieu-fore-cpt.md.
import { describe, expect, it } from 'vitest';
import { verifierPieux, type DonneesPieux } from '../src/pieux';

function donnees(Ls: number, approche: 'DA1' | 'DA2'): DonneesPieux {
  return {
    pieu: { D: 0.45, execution: 'fore' },
    groupe: { nx: 1, ny: 1, s: 1.35, eta: 1, ratioQbBloc: 1, redistribution: false },
    couches: [
      { nom: 'Sable lache, argile molle, tourbe', h: 16.5, qs: [0], tauDd: 0 },
      { nom: 'Sable moyennement dense a dense', h: Ls, qs: [100], tauDd: 0 },
    ],
    qb: [2500],
    efforts: { VG: 300, VQ: 150, MG: 0, MQ: 0 },
    service: { Eeq: 30000, nu: 0.3, Ep: 30e6, sAdm: 0.05 },
    norme: { generation: 1, profil: 'recommande', approche },
  };
}

/** Longueur dans la couche porteuse qui amene le taux de compression a 1. */
function longueurUtile(approche: 'DA1' | 'DA2', k: number): number {
  let bas = 0.01;
  let haut = 20;
  for (let i = 0; i < 50; i += 1) {
    const m = (bas + haut) / 2;
    if (verifierPieux(donnees(m, approche)).combinaisons[k].tauxCompression > 1) bas = m;
    else haut = m;
  }
  return (bas + haut) / 2;
}

describe('JRC 2013, A.8 : pieu fore, un profil CPT', () => {
  it('resistances calculees : R_b = 398 kN, R_s = 141 kN par metre', () => {
    const p = verifierPieux(donnees(4, 'DA1')).profils[0];
    expect(p.Rb).toBeCloseTo(398, -1);
    expect(p.Rs / 4).toBeCloseTo(141, 0);
  });

  it('efforts de calcul : 630, 495 et 630 kN', () => {
    expect(verifierPieux(donnees(4, 'DA1')).combinaisons.map((c) => c.Fcd)).toEqual([630, 495]);
    expect(verifierPieux(donnees(4, 'DA2')).combinaisons[0].Fcd).toBe(630);
  });

  it('longueur dans la couche porteuse : 3,99 / 4,08 / 4,05 m', () => {
    expect(longueurUtile('DA1', 0)).toBeCloseTo(3.99, 2);
    expect(Math.abs(longueurUtile('DA1', 1) - 4.08)).toBeLessThan(0.01);
    expect(longueurUtile('DA2', 0)).toBeCloseTo(4.05, 2);
  });
});
