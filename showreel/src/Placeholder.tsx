/* Stands in until footage exists. Deliberately looks like a slate rather than a
   finished shot, so an unfilled slot is obvious in review — a black frame or a
   still would be easy to mistake for intentional. */
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PAPER, INK, TINT, MONO} from './theme';
import {Mark} from './Mark';

export const Placeholder: React.FC<{name: string; kind: string; portrait: boolean}> =
({name, kind, portrait}) => {
  const frame = useCurrentFrame();
  const tint = TINT[kind] ?? INK;
  const step = 44;
  return (
    <div style={{position:'absolute', inset:0, background:PAPER, overflow:'hidden'}}>
      {/* the site's lattice, drifting slowly so the slate is not static */}
      <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.16}}>
        {Array.from({length: 60}).map((_, i) => (
          <line key={'v'+i} x1={i*step + (frame*0.15)%step} y1={0}
                x2={i*step + (frame*0.15)%step} y2={4000} stroke={INK} strokeWidth={1} />
        ))}
        {Array.from({length: 60}).map((_, i) => (
          <line key={'h'+i} x1={0} y1={i*step} x2={4000} y2={i*step} stroke={INK} strokeWidth={1} />
        ))}
      </svg>
      <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column',
                   alignItems:'center', justifyContent:'center', gap:portrait?28:22}}>
        <Mark kind={kind} size={portrait?150:120} color={tint} />
        <div style={{fontFamily:MONO, fontSize:portrait?20:16,
                     letterSpacing:'0.22em', color:INK, opacity:0.5}}>FOOTAGE PENDING</div>
        <div style={{fontFamily:MONO, fontSize:portrait?15:12,
                     letterSpacing:'0.16em', color:tint, opacity:0.9}}>{name.toUpperCase()}</div>
      </div>
    </div>
  );
};
