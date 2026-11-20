"""Attendus de tests/transversal.test.ts, depuis transversal.py. python tests/reference/attendus.py"""
import json
from math import sqrt, pi
import numpy as np
from transversal import Cas, cas_defaut, py, hult, brinch_hansen

class Uniforme(Cas):
    """Sol fictif : p_f et y_f constants (verifications analytiques)."""
    def __init__(s, L, D, EI, pf, yfB):
        Cas.__init__(s, D, EI, [dict(nom='U', h=L, gamma=0, gammaSat=0, comportement='draine', phi=0, c=0, cu=0, yf='grenu')], 0)
        s._pf = pf; s._yfB = yfB
    def pf(s, z, sol=(1, 1, 1)):
        return s._pf

out = {}
out['BH'] = {f'{p}-{x}': brinch_hansen(p, x) for p, x in ((15, 0.5), (15, 20), (20, 10), (25, 5), (30, 0), (30, 5), (30, 20), (35, 1), (35, 20))}
c = cas_defaut()
out['sigma'] = {str(z): c.sigma(z) for z in (2, 3, 5, 10)}
out['pf'] = {str(z): c.pf(z) for z in (0, 1.5, 3.5, 6, 10, 14)}
out['pfM2'] = {str(z): c.pf(z, (1.25, 1.25, 1.4)) for z in (1.5, 3.5, 6, 10)}
c.fluage = True; out['pfFluage'] = {str(z): c.pf(z) for z in (3.5, 6)}; c.fluage = False

# uniforme : Hetenyi (pieu long, elastique)
u = Uniforme(30, 0.6, 190852.0, 1000.0, 0.1)
k = 1000*0.6/(0.1*0.6)
beta = (k/(4*u.EI))**0.25
r = py(u, 100, 0, 0)
out['hetenyi'] = dict(beta=beta, y0=2*100*beta/k, Mmax=0.3224*100/beta, zM=pi/(4*beta),
                      num=dict(y0=r['y'][0], Mmax=float(np.max(np.abs(r['M']))), zM=float(r['z'][np.argmax(np.abs(r['M']))])))
rf = py(u, 100, 0, 0, 'encastree')
out['hetenyiEnc'] = dict(y0=100*beta/k, M0=-100/(2*beta), num=dict(y0=rf['y'][0], M0=rf['M0']))
# uniforme : Hult
u2 = Uniforme(8, 0.6, 190852.0, 300.0, 0.1)
P = 300*0.6
out['hultUniforme'] = dict(libre=P*8*(sqrt(2)-1), zr=8/sqrt(2), enc=P*8,
    num=dict(libre=hult(u2, 1, 0)['H'], zr=hult(u2, 1, 0)['zr'], enc=hult(u2, 1, 0, 'encastree')['H']))
h_e = hult(u2, 1, 2)  # e = 2 m
out['hultExcentre'] = dict(taux=h_e['taux'], H=h_e['H'], zr=h_e['zr'])

def resume(r, h):
    i = int(np.argmax(np.abs(r['M'])))
    return dict(y0=r['y'][0], rot=r['rot'], M0=r['M0'], MEd=float(abs(r['M'][i])), zM=float(r['z'][i]),
                VEd=float(np.max(np.abs(r['V']))), plast=r['plast'], taux=None if h is None else h['taux'],
                Hult=None if h is None else h['H'], zr=None if h is None else h['zr'])

M1, M2 = (1, 1, 1), (1.25, 1.25, 1.4)
cas = {}
for tete in ('libre', 'encastree'):
    a = (1.35*60+1.5*40, 0.0, 1.35*800+1.5*300)
    b = (60+1.3*40, 0.0, 800+1.3*300)
    els = (100.0, 0.0, 1100.0)
    cas[tete] = {
        '(a)': resume(py(c, *a, tete, M1), hult(c, a[0], a[1], tete, M1)),
        '(b)': resume(py(c, *b, tete, M2), hult(c, b[0], b[1], tete, M2)),
        'ELS': resume(py(c, *els, tete, M1), None),
    }
out['defaut'] = cas
# second ordre : N = 0 contre N = 1530 (a)
r0 = py(c, 141.0, 0.0, 0.0)
out['secondOrdre'] = dict(MEd0=float(np.max(np.abs(r0['M']))), MEdN=cas['libre']['(a)']['MEd'])
# moment en tete (libre) M = 80 kN.m en G
mm = py(c, 141.0, 1.35*80, 1530.0)
out['avecMoment'] = dict(y0=mm['y'][0], MEd=float(np.max(np.abs(mm['M']))), taux=hult(c, 141.0, 108.0)['taux'])
# pieu court : mecanisme (pas d'equilibre au-dela de Hult)
court = Cas(0.6, 190852.0, [dict(nom='Sable', h=3, gamma=18, gammaSat=20, comportement='draine', phi=30, c=0, cu=0, yf='grenu')], zNappe=10)
hc = hult(court, 1, 0)
out['court'] = dict(Hult=hc['H'], zr=hc['zr'], sous=py(court, 0.9*hc['H'], 0, 0) is not None, dessus=py(court, 1.1*hc['H'], 0, 0) is None)
print(json.dumps(out, indent=1, default=float))
