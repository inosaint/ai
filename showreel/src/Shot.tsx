/* One project on screen: its footage (or a placeholder) with the metadata over it.

   Text position is the whole point of doing this in Remotion, so it is defined
   once here and differs by aspect:
     landscape — media fills the frame, metadata in a lower-left block
     portrait  — media occupies the upper two thirds, metadata stacked beneath
   Portrait is NOT a crop of landscape: the captures are landscape UI, and
   cropping them to 9:16 would throw away half of every screen. */
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {PAPER, INK, TINT, MONO, SANS} from './theme';
import {Mark} from './Mark';
import {Placeholder} from './Placeholder';
import type {Shot as ShotType} from './projects';

export const Shot: React.FC<{shot: ShotType; portrait: boolean; durationInFrames: number}> =
({shot, portrait, durationInFrames}) => {
  const frame = useCurrentFrame();
  const tint = TINT[shot.kind] ?? INK;

  // text rises in over ~0.4s and holds; it never animates out, so cuts stay clean
  const rise = interpolate(frame, [0, 12], [26, 0], {extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)});
  const fade = interpolate(frame, [0, 12], [0, 1], {extrapolateRight:'clamp'});
  // a slow push on the footage keeps a static capture from feeling dead
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.045], {extrapolateRight:'clamp'});

  const media = shot.media
    ? <OffthreadVideo src={staticFile('media/' + shot.media)}
        style={{width:'100%', height:'100%', objectFit:'cover'}} muted />
    : <Placeholder name={shot.name} kind={shot.kind} portrait={portrait} />;

  const Meta = (
    <div style={{transform:`translateY(${rise}px)`, opacity:fade,
                 display:'flex', alignItems:'flex-start', gap:portrait?20:18}}>
      <div style={{marginTop:portrait?6:4}}>
        <Mark kind={shot.kind} size={portrait?34:28} color={tint} />
      </div>
      <div>
        <div style={{fontFamily:SANS, fontWeight:700, color:INK, lineHeight:1.05,
                     fontSize:portrait?58:52, letterSpacing:'-0.02em'}}>{shot.name}</div>
        {shot.note && (
          <div style={{fontFamily:SANS, fontWeight:400, color:INK, opacity:0.72,
                       fontSize:portrait?27:24, marginTop:10}}>{shot.note}</div>
        )}
        <div style={{fontFamily:MONO, fontSize:portrait?17:15, letterSpacing:'0.18em',
                     color:tint, marginTop:14}}>
          {shot.kind.toUpperCase()} · {shot.when}{shot.url ? '  ·  ' + shot.url.replace(/^https?:\/\//,'') : ''}
        </div>
      </div>
    </div>
  );

  if (portrait) {
    return (
      <AbsoluteFill style={{background:PAPER}}>
        <div style={{height:'62%', overflow:'hidden'}}>
          <div style={{width:'100%', height:'100%', transform:`scale(${scale})`}}>{media}</div>
        </div>
        <div style={{flex:1, padding:'56px 64px', display:'flex', alignItems:'flex-start'}}>{Meta}</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background:PAPER}}>
      <AbsoluteFill style={{transform:`scale(${scale})`}}>{media}</AbsoluteFill>
      {/* a scrim only under the text, so the footage stays untinted above it */}
      <AbsoluteFill style={{background:`linear-gradient(to top, ${PAPER} 0%, ${PAPER}f2 22%, transparent 46%)`}} />
      <AbsoluteFill style={{justifyContent:'flex-end', padding:'0 80px 68px'}}>{Meta}</AbsoluteFill>
    </AbsoluteFill>
  );
};
