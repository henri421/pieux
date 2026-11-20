"""Reference Python du pieu sous charge transversale (PLAN-transversal.md). Claude, 20/11/2026.

Sert a calculer les attendus de tests/transversal.test.ts. Meme specification que le noyau :
EN 1997-3:2025 annexe C.12 (p-y bilineaire), Brinch Hansen (1961) pour K_q et K_c,
poutre d'Euler-Bernoulli en 200 elements avec rigidite geometrique (N compression),
ressorts concentres aux noeuds (longueurs tributaires), iteration secante.
Lancer : python tests/reference/transversal.py
"""
from math import atan, cos, degrees, exp, pi, radians, sin, sqrt, tan
import numpy as np

GAMMA_W = 10.0
NE = 200
YF = {'grenu': 0.1, 'fin-long': 0.12, 'fin-court': 0.05}


def brinch_hansen(phi_deg, x):
    f = radians(phi_deg); t = tan(f)
    if t < 1e-12:
        return 0.0, 0.0
    Kq0 = exp((pi/2+f)*t)*cos(f)*tan(pi/4+f/2) - exp(-(pi/2-f)*t)*cos(f)*tan(pi/4-f/2)
    Kc0 = (exp((pi/2+f)*t)*cos(f)*tan(pi/4+f/2) - 1)/t
    Nc = (exp(pi*t)*tan(pi/4+f/2)**2 - 1)/t
    dc = 1.58 + 4.09*t**4
    K0 = 1 - sin(f)
    Kci = Nc*dc; Kqi = Kci*K0*t
    aq = Kq0/(Kqi-Kq0)*K0*sin(f)/sin(pi/4+f/2)
    ac = Kc0/(Kci-Kc0)*2*sin(pi/4+f/2)
    return (Kq0+Kqi*aq*x)/(1+aq*x), (Kc0+Kci*ac*x)/(1+ac*x)


class Cas:
    def __init__(s, D, EI, couches, zNappe, fluage=False):
        s.D, s.EI, s.couches, s.zNappe, s.fluage = D, EI, couches, zNappe, fluage
        s.L = sum(c['h'] for c in couches)

    def couche(s, z):
        t = 0
        for c in s.couches:
            t += c['h']
            if z <= t + 1e-9:
                return c
        return s.couches[-1]

    def sigma(s, z):
        """sigma'_v exacte par couches (gamma au-dessus de la nappe, gammaSat - 10 dessous)."""
        tot, t = 0.0, 0.0
        for c in s.couches:
            a, b = t, t + c['h']; t = b
            if a >= z:
                break
            b = min(b, z)
            sec = max(0.0, min(b, s.zNappe) - a)
            imm = (b - a) - sec
            tot += c['gamma']*sec + (c['gammaSat']-GAMMA_W)*imm
        return tot

    def pf(s, z, sol=(1, 1, 1)):
        gphi, gc, gcu = sol
        c = s.couche(z)
        if c['comportement'] == 'non-draine':
            cu = c['cu']/gcu
            return min((6 if s.fluage else 9)*cu, cu*(2 + 2/3*z/s.D) + s.sigma(z))
        phi = degrees(atan(tan(radians(c['phi']))/gphi))
        zz = min(z, 20*s.D)
        Kq, Kc = brinch_hansen(phi, zz/s.D)
        return Kq*s.sigma(zz) + Kc*c['c']/gc


def py(cas, H, M, N, tete='libre', sol=(1, 1, 1)):
    L, D, EI = cas.L, cas.D, cas.EI
    n = NE + 1; h = L/NE; z = np.array([i*h for i in range(n)])
    P = np.array([cas.pf(zi, sol)*D for zi in z])
    Y = np.array([YF[cas.couche(zi)['yf']]*D for zi in z])
    w = np.full(n, h); w[0] = w[-1] = h/2
    Ke = EI/h**3*np.array([[12, 6*h, -12, 6*h], [6*h, 4*h*h, -6*h, 2*h*h], [-12, -6*h, 12, -6*h], [6*h, 2*h*h, -6*h, 4*h*h]])
    Kg = -N/(30*h)*np.array([[36, 3*h, -36, 3*h], [3*h, 4*h*h, -3*h, -h*h], [-36, -3*h, 36, -3*h], [3*h, -h*h, -3*h, 4*h*h]])
    K0 = np.zeros((2*n, 2*n))
    for e in range(NE):
        i = [2*e, 2*e+1, 2*e+2, 2*e+3]; K0[np.ix_(i, i)] += Ke + Kg
    F = np.zeros(2*n); F[0] = H; F[1] = -M   # M = H.e, e > 0 au-dessus de la tete
    kel = P/Y*w
    ks = kel.copy()
    conv = False
    for it in range(5000):
        K = K0.copy()
        for i in range(n):
            K[2*i, 2*i] += ks[i]
        Fi = F.copy()
        if tete == 'encastree':
            K[1, :] = 0; K[:, 1] = 0; K[1, 1] = 1; Fi[1] = 0
        u = np.linalg.solve(K, Fi); y = u[0::2]
        if np.max(np.abs(y)) > 10*L:
            return None
        R = np.clip(P/Y*y, -P, P)*w
        ksn = np.where(np.abs(y) > 1e-14, R/np.where(np.abs(y) > 1e-14, y, 1), kel)
        if it > 0 and np.max(np.abs(y - yprec)) < 1e-10:
            conv = True; break
        yprec = y
        ks = 0.5*ks + 0.5*ksn
    if not conv:
        return None
    R = np.clip(P/Y*y, -P, P)*w
    # Statique : M(z_i) = M0 + H z_i + N (y0 - y_i) - sum_{j<i} R_j (z_i - z_j)
    def mom(M0):
        return np.array([M0 + H*z[i] + N*(y[0]-y[i]) - np.sum(R[:i]*(z[i]-z[:i])) for i in range(n)])
    if tete == 'encastree':
        M0 = -(H*L + N*(y[0]-y[-1]) - np.sum(R[:-1]*(L-z[:-1])))
    else:
        M0 = M
    Mz = mom(M0)
    V = np.array([H - np.sum(R[:i+1]) for i in range(n)])
    plast = float(np.sum(w[(P > 0) & (np.abs(y) >= Y*(1-1e-9))]))
    return dict(z=z, y=y, M=Mz, V=V, p=np.clip(P/Y*y, -P, P)/D, pf=P/D, M0=M0, plast=plast,
                rot=float(u[1]))


def hult(cas, H, M, tete='libre', sol=(1, 1, 1), nint=2000):
    L, D = cas.L, cas.D
    dz = L/nint
    zm = np.array([(k+0.5)*dz for k in range(nint)])
    P = np.array([cas.pf(zi, sol)*D for zi in zm])
    if tete == 'encastree':
        cap = float(np.sum(P)*dz)
        return dict(taux=H/cap if H > 0 else 0.0, H=cap, zr=None)
    def AB(zr):
        # Point milieu par cellule ; la cellule contenant zr est coupee exactement (P de son milieu).
        k = min(int(zr/dz), nint-1)
        a0 = zr - k*dz
        s = np.where(np.arange(nint) < k, 1.0, -1.0)
        s[k] = 0.0
        A = float(np.sum(s*P)*dz) + P[k]*(a0 - (dz - a0))
        B = float(np.sum(s*P*(L-zm))*dz) + P[k]*(a0*(L - (k*dz + a0/2)) - (dz-a0)*(L - (zr + (dz-a0)/2)))
        return A, B
    g = lambda zr: (M + H*L)*AB(zr)[0] - H*AB(zr)[1]
    a, b = 1e-9, L - 1e-9
    ga = g(a)
    for _ in range(200):
        m = (a+b)/2; gm = g(m)
        if (gm > 0) == (ga > 0):
            a, ga = m, gm
        else:
            b = m
    zr = (a+b)/2
    A, B = AB(zr)
    lam = A/H if abs(H) > 1e-12 else B/M
    return dict(taux=1/lam, H=A, zr=zr)


def cas_defaut():
    return Cas(0.6, 190852.0, [
        dict(nom='Remblai', h=3, gamma=18, gammaSat=20, comportement='draine', phi=30, c=0, cu=0, yf='grenu'),
        dict(nom='Argile', h=5, gamma=19, gammaSat=19, comportement='non-draine', phi=0, c=0, cu=50, yf='fin-court'),
        dict(nom='Sable', h=6, gamma=20, gammaSat=21, comportement='draine', phi=35, c=0, cu=0, yf='grenu'),
    ], zNappe=3)


if __name__ == '__main__':
    np.set_printoptions(precision=6)
    print('BH', [tuple(round(v, 6) for v in brinch_hansen(p, x)) for p, x in ((30, 0), (30, 5), (30, 20), (20, 10), (35, 1))])
    c = cas_defaut()
    print('sigma', [round(c.sigma(z), 6) for z in (2, 3, 5, 10)])
    print('pf', [round(c.pf(z), 6) for z in (0, 1.5, 3.5, 6, 10, 14)])
    print('pf M2', [round(c.pf(z, (1.25, 1.25, 1.4)), 6) for z in (1.5, 3.5, 6, 10)])
    # signe de M : la statique doit redonner M(L) ~ 0
    r = py(c, 100, 50, 0)
    print('M(L) libre', r['M'][-1], 'y0', r['y'][0])
    r2 = py(c, 100, 0, 0); print('y0 sans M', r2['y'][0])
