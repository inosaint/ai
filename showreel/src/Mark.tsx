/* The five category marks, at grid-viz.js's proportions, so the reel uses the
   same vocabulary as the grid and the footer park. */
import React from 'react';

export const Mark: React.FC<{kind: string; size: number; color: string}> = ({kind, size, color}) => {
  const r = size / 2;
  const c = size / 2;
  const common = {fill: color};
  if (kind === 'game')
    return <svg width={size} height={size}><circle cx={c} cy={c} r={r * 0.9} {...common} /></svg>;
  if (kind === 'app')
    return <svg width={size} height={size}>
      <rect x={c - r * 0.82} y={c - r * 0.82} width={r * 1.64} height={r * 1.64} {...common} /></svg>;
  if (kind === 'event') {
    const hh = r * 1.02;
    return <svg width={size} height={size}>
      <path d={`M${c} ${c - hh}L${c + r} ${c + hh * 0.72}L${c - r} ${c + hh * 0.72}Z`} {...common} /></svg>;
  }
  if (kind === 'exploration')
    return <svg width={size} height={size}>
      <path d={`M${c} ${c - r}L${c + r} ${c}L${c} ${c + r}L${c - r} ${c}Z`} {...common} /></svg>;
  const a = r * 0.35, b = r;
  return <svg width={size} height={size}>
    <path d={`M${c - a} ${c - b}h${a * 2}v${b - a}h${b - a}v${a * 2}h${-(b - a)}v${b - a}h${-a * 2}v${-(b - a)}h${-(b - a)}v${-a * 2}h${b - a}Z`} {...common} /></svg>;
};
