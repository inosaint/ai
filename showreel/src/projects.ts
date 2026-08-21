/* The reel's running order.
   Everything about pacing lives here: which projects appear, how long each is on
   screen, and the two bookends. Duration is in SECONDS; the compositions convert
   to frames. Edit this file to recut the video — nothing else needs touching.

   media:  a file in public/media. Leave "" and a generated placeholder stands in,
           so the whole reel is watchable before any footage exists.
   kind:   picks the category mark and colour, matching the site. */

export type Kind = 'app' | 'game' | 'event' | 'exploration' | 'visualization';

export type Shot = {
  name: string;
  kind: Kind;
  when: string;
  url?: string;
  media: string;
  seconds: number;
  note?: string;
};

export const TITLE_SECONDS = 2.5;
export const END_SECONDS   = 3;
export const FPS           = 30;

/* Twelve of the forty-three. A reel is a highlight — the rest live on the site.
   Comment a line out to drop it; the timeline recalculates itself. */
export const SHOTS: Shot[] = [
  { name: 'budgie.travel',        kind: 'app',           when: 'Nov 2025', seconds: 4.5,
    url: 'https://budgie.travel',        media: '' , note: 'Trip planning, end to end' },
  { name: 'mapyour.org',          kind: 'app',           when: 'Jan 2026', seconds: 4.5,
    url: 'https://mapyour.org',          media: '' , note: 'Org charts that stay current' },
  { name: 'Pinboarder',           kind: 'app',           when: 'Mar 2026', seconds: 4,
    media: '' , note: 'A pinboard that thinks' },
  { name: 'Hermes',               kind: 'app',           when: 'Feb 2026', seconds: 4,
    media: '' , note: 'Messaging, reimagined' },
  { name: 'grindsize.in',         kind: 'app',           when: 'May 2026', seconds: 4,
    url: 'https://grindsize.in',         media: '' , note: 'Dial in your grind' },
  { name: 'Tower Dungeon',        kind: 'game',          when: 'Apr 2026', seconds: 3.5,
    media: '' , note: 'Climb, fight, repeat' },
  { name: 'Amoebas',              kind: 'game',          when: 'Mar 2026', seconds: 3.5,
    media: '' , note: 'Split, drift, consume' },
  { name: 'Infinite Pixel Dungeons', kind: 'game',       when: 'Mar 2026', seconds: 3.5,
    media: '' , note: 'Endlessly generated' },
  { name: 'Solar System Narrative Viz', kind: 'visualization', when: 'May 2026', seconds: 4.5,
    media: '' , note: 'The solar system, narrated' },
  { name: 'Salary data viz',      kind: 'visualization',  when: 'Jul 2026', seconds: 4,
    media: '' , note: 'What design actually pays' },
  { name: 'Design Demo Nights',   kind: 'event',          when: 'Mar 2026 —', seconds: 4.5,
    url: 'https://designdemonights.com', media: '' , note: 'Five editions and counting' },
  { name: 'data-vizard.com',      kind: 'app',            when: 'Jul 2026', seconds: 4,
    url: 'https://data-vizard.com',      media: '' , note: 'A workshop in a website' },
];

export const shotFrames = (s: Shot) => Math.round(s.seconds * FPS);
export const totalFrames = () =>
  Math.round((TITLE_SECONDS + END_SECONDS) * FPS) +
  SHOTS.reduce((a, s) => a + shotFrames(s), 0);
