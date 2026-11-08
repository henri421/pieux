/** Traits de la coupe, repris par le SVG exporte et par la note : valeurs en dur, le SVG doit tenir seul. */
const POLICE = "font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;";
export const STYLES_TRACE = `
svg .couche { stroke: #c8c6c0; stroke-width: 1; }
svg .couche-0 { fill: #efe9dc; } svg .couche-1 { fill: #e3e0d6; } svg .couche-2 { fill: #f3ecd0; }
svg .terrain { stroke: #1a1a1a; stroke-width: 1.5; }
svg .semelle { fill: #e7eaee; stroke: #1a1a1a; stroke-width: 1.2; }
svg .pieu { fill: #e7eaee; stroke: #1a1a1a; stroke-width: 1.2; }
svg .zone-drag { fill: #a8442a; fill-opacity: 0.35; stroke: none; }
svg .plan-neutre { stroke: #a8442a; stroke-width: 1; stroke-dasharray: 5 3; }
svg .bloc { fill: none; stroke: #1e5aa8; stroke-width: 1; stroke-dasharray: 6 4; }
svg .charge { stroke: #2f5d8a; stroke-width: 2.5; }
svg .plan-pieu { fill: #e7eaee; stroke: #1a1a1a; stroke-width: 1.3; }
svg .plan-pieu.charge-max { fill: #fdf6e3; stroke: #8a6d00; }
svg .cote { stroke: #6a6862; stroke-width: 0.8; fill: #6a6862; font-size: 11px; ${POLICE} }
svg text.cote { stroke: none; }
svg .texte-coupe { fill: #4a4842; font-size: 11px; ${POLICE} }
`;
