import React from 'react';
import {Composition} from 'remotion';
import {Showreel} from './Showreel';
import {FPS, totalFrames} from './projects';

/* Two sizes from one composition — the reason for doing this in Remotion at all.
   Add a square 1080x1080 here and it costs nothing but render time. */
export const RemotionRoot: React.FC = () => {
  const durationInFrames = totalFrames();
  return (
    <>
      <Composition id="Landscape" component={Showreel} fps={FPS}
        durationInFrames={durationInFrames} width={1920} height={1080} />
      <Composition id="Portrait" component={Showreel} fps={FPS}
        durationInFrames={durationInFrames} width={1080} height={1920} />
    </>
  );
};
