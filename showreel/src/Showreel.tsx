/* The reel: title, each shot in turn, end card. One component, both aspects —
   `portrait` is derived from the composition's own dimensions, so adding a new
   size in Root.tsx needs no changes here. */
import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {SHOTS, TITLE_SECONDS, END_SECONDS, shotFrames} from './projects';
import {Shot} from './Shot';
import {TitleCard, EndCard} from './Cards';
import {PAPER} from './theme';

export const Showreel: React.FC = () => {
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;
  const title = Math.round(TITLE_SECONDS * fps);
  const end = Math.round(END_SECONDS * fps);

  let at = title;
  return (
    <AbsoluteFill style={{background:PAPER}}>
      <Sequence durationInFrames={title}><TitleCard portrait={portrait} /></Sequence>
      {SHOTS.map((s) => {
        const d = shotFrames(s);
        const from = at; at += d;
        return (
          <Sequence key={s.name + s.when} from={from} durationInFrames={d}>
            <Shot shot={s} portrait={portrait} durationInFrames={d} />
          </Sequence>
        );
      })}
      <Sequence from={at} durationInFrames={end}><EndCard portrait={portrait} /></Sequence>
    </AbsoluteFill>
  );
};
