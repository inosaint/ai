/* The site's palette, so the reel looks like the site rather than a template.
   Values mirror grid-new.css / park-marks.css. */
export const PAPER = '#F4F1EC';
export const INK   = '#15150F';

export const TINT: Record<string, string> = {
  app:           '#47738F',   // teal
  game:          '#3E6E5D',   // moss
  event:         '#C24125',   // vermillion
  exploration:   '#E3A32E',   // ochre
  visualization: '#DE7F4E',   // terra
};
/* labels that sit on a tint need the light foreground on these */
export const DARK_TINT = new Set(['app', 'game', 'event']);

import {SANS_FAMILY, MONO_FAMILY} from './fonts';
export const MONO = `${MONO_FAMILY}, ui-monospace, SFMono-Regular, Menlo, monospace`;
export const SANS = `${SANS_FAMILY}, system-ui, -apple-system, sans-serif`;
