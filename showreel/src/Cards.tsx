/* Title and end cards. Both read from the same palette and marks. */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {PAPER, INK, TINT, MONO, SANS} from './theme';
import {Mark} from './Mark';
import {SHOTS} from './projects';

export const TitleCard: React.FC<{portrait: boolean}> = ({portrait}) => {
  const frame = useCurrentFrame();
  const up = interpolate(frame, [0, 16], [18, 0], {extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)});
  const op = interpolate(frame, [0, 14], [0, 1], {extrapolateRight:'clamp'});
  const kinds = ['app','game','event','exploration','visualization'];
  return (
    <AbsoluteFill style={{background:PAPER, justifyContent:'center', padding:portrait?'0 70px':'0 110px'}}>
      <div style={{transform:`translateY(${up}px)`, opacity:op}}>
        <div style={{display:'flex', gap:16, marginBottom:34}}>
          {kinds.map((k,i)=>(
            <span key={k} style={{opacity:interpolate(frame,[6+i*3, 18+i*3],[0,1],{extrapolateRight:'clamp'})}}>
              <Mark kind={k} size={portrait?30:26} color={TINT[k]} />
            </span>
          ))}
        </div>
        <div style={{fontFamily:SANS, fontWeight:700, color:INK, lineHeight:1.02,
                     fontSize:portrait?92:110, letterSpacing:'-0.03em'}}>
          Kenneth’s<br/>AI playground
        </div>
        <div style={{fontFamily:MONO, fontSize:portrait?18:17, letterSpacing:'0.2em',
                     color:INK, opacity:0.55, marginTop:30}}>
          {SHOTS.length} OF 43 PROJECTS · A SABBATICAL BUILT WITH AI
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{portrait: boolean}> = ({portrait}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 14], [0, 1], {extrapolateRight:'clamp'});
  return (
    <AbsoluteFill style={{background:PAPER, justifyContent:'center', alignItems:'center', opacity:op}}>
      <div style={{fontFamily:SANS, fontWeight:700, color:INK,
                   fontSize:portrait?64:76, letterSpacing:'-0.02em'}}>ai.kenneth.dsouza.im</div>
      <div style={{fontFamily:MONO, fontSize:portrait?17:16, letterSpacing:'0.2em',
                   color:INK, opacity:0.55, marginTop:22}}>ALL 43 PROJECTS · GITHUB @INOSAINT</div>
    </AbsoluteFill>
  );
};
