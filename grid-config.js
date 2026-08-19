/* ---------------------------------------------------------------------------
   PROJECT GRID CONFIG  —  edit this file by hand, then reload the page.

   size  : 1 | 2 | 3 | 4      how big the block is
             1 = 2x2 cells    small stone
             2 = 3x3 cells    normal
             3 = 4x4 cells    large
             4 = 5x5 cells    highlight — use these sparingly, they carry the page
   colour: one of
             --g-teal  --g-navy  --g-moss  --g-vermillion
             --g-coral --g-ochre --g-terra --g-blush
           Dark colours (teal, navy, moss, vermillion) automatically flip their
           label to paper, so you do not have to think about contrast.
   media : the image or video revealed on hover. '' means the block reveals a
           deepened version of its own colour instead. .mp4/.mov/.webm all work.

   Keys are "Project Name @ Month Year". The month is part of the key because a
   project can appear twice — Sudhaarit shipped in both July and February, and
   with plain names the second entry silently overwrote the first.

   The category is NOT set here — it comes from the project itself and decides
   which symbol the block crumbles into. Months are fixed by date and always
   stay in order; only the arrangement inside a month is shuffled per visit.
--------------------------------------------------------------------------- */
const GRID_CONFIG = {

  /* ---- July 2026 ---- */
  "Design Demo Nights #5 @ July 2026":                         { size:3, colour:"--g-vermillion", media:"projects/design-demos/demos-5.png" },
  "Sudhaarit @ July 2026":                                     { size:2, colour:"--g-teal", media:"projects/app/sudhaarit-site.png" },
  "Mapyour.org growth plan feature @ July 2026":               { size:1, colour:"--g-navy", media:"projects/app/mapyourgrowth.png" },
  "data-vizard.com @ July 2026":                               { size:1, colour:"--g-teal", media:"projects/data-vizard/data-vizard-site.png" },
  "Salary data viz @ July 2026":                               { size:3, colour:"--g-terra", media:"projects/data-vizard/salary-data.png" },
  "Interactive DataViz Using AI Coding at VizChitra 2026 @ July 2026": { size:2, colour:"--g-coral", media:"projects/workshop/vizchitra.jpeg" },
  "FIFA 2026 football world cup visualized @ July 2026":       { size:2, colour:"--g-terra", media:"" },

  /* ---- June 2026 ---- */
  "Data Vizard @ June 2026":                                   { size:4, colour:"--g-teal", media:"projects/data-vizard/data-vizard.png" },
  "feels @ June 2026":                                         { size:3, colour:"--g-navy", media:"" },
  "Design Demo Nights #4 @ June 2026":                         { size:2, colour:"--g-vermillion", media:"projects/design-demos/demos-4.JPG" },

  /* ---- May 2026 ---- */
  "Solar System Narrative Viz @ May 2026":                     { size:2, colour:"--g-terra", media:"projects/viz-demos/viz-demos-1.png" },
  "Grindsize Social Ad @ May 2026":                            { size:1, colour:"--g-terra", media:"" },
  "Design Demo Nights #3 @ May 2026":                          { size:3, colour:"--g-vermillion", media:"projects/design-demos/demos-3.jpg" },
  "Design Demo Nights Archive @ May 2026":                     { size:2, colour:"--g-vermillion", media:"" },
  "Grindsize.in @ May 2026":                                   { size:4, colour:"--g-navy", media:"projects/grinder-calibrator/grinder-v1.jpg" },

  /* ---- April 2026 ---- */
  "Agentic Coding Workshop at CEC, Mangalore @ April 2026":    { size:2, colour:"--g-vermillion", media:"projects/workshop/canara.jpeg" },
  "Design Demo Nights #2 @ April 2026":                        { size:2, colour:"--g-vermillion", media:"projects/design-demos/demos-2.jpg" },
  "ASCII Rocky @ April 2026":                                  { size:1, colour:"--g-terra", media:"projects/app/rocky.png" },
  "Tower Dungeon @ April 2026":                                { size:1, colour:"--g-moss", media:"projects/games/tower.PNG" },
  "designr. @ April 2026":                                     { size:2, colour:"--g-ochre", media:"projects/app/designr.png" },

  /* ---- March 2026 ---- */
  "Amoebas - Live @ March 2026":                               { size:2, colour:"--g-teal", media:"projects/app/amoebas.mov" },
  "Amoebas @ March 2026":                                      { size:1, colour:"--g-moss", media:"projects/app/amoebas.mov" },
  "Design Demo Nights #1 @ March 2026":                        { size:3, colour:"--g-vermillion", media:"projects/design-demos/demos-1.jpeg" },
  "Pinboarder @ March 2026":                                   { size:4, colour:"--g-navy", media:"projects/app/pinboarder.png" },
  "Infinite Pixel Dungeons @ March 2026":                      { size:2, colour:"--g-moss", media:"projects/games/infinite-dungeons.mov" },
  "Design Tooling Releases — Exploration 2 @ March 2026":      { size:1, colour:"--g-ochre", media:"" },
  "Design Tooling Releases — Exploration 1 @ March 2026":      { size:2, colour:"--g-terra", media:"" },
  "Same Prompt, 3 Design Models, 1 Tool @ March 2026":         { size:2, colour:"--g-ochre", media:"" },
  "AI Workshop at NID @ March 2026":                           { size:1, colour:"--g-vermillion", media:"projects/workshop/nid.jpeg" },

  /* ---- February 2026 ---- */
  "Sudhaarit @ February 2026":                                 { size:2, colour:"--g-navy", media:"" },
  "Unnamed @ February 2026":                                   { size:3, colour:"--g-moss", media:"projects/unamed/unamed.png" },
  "Hermes @ February 2026":                                    { size:4, colour:"--g-teal", media:"projects/app/hermes-mac.png" },
  "Smithy @ February 2026":                                    { size:1, colour:"--g-navy", media:"projects/app/smithy/cover-smithy.png" },
  "Vibeshift Projects @ February 2026":                        { size:2, colour:"--g-teal", media:"projects/event/vibeshift-blr.jpg" },
  "exhume.link @ February 2026":                               { size:2, colour:"--g-terra", media:"projects/app/exhume.png" },

  /* ---- January 2026 ---- */
  "Mapyour.org @ January 2026":                                { size:4, colour:"--g-navy", media:"projects/app/mapyourorg.JPG" },
  "AI workshop @ January 2026":                                { size:3, colour:"--g-teal", media:"projects/workshop/ai-workshop.png" },
  "Books Viz' 2025 @ January 2026":                       { size:2, colour:"--g-terra", media:"projects/exploration/books-2025.png" },

  /* ---- November 2025 ---- */
  "budgie.travel @ November 2025":                             { size:4, colour:"--g-navy", media:"projects/app/budgie.PNG" },
  "traviti @ November 2025":                                   { size:2, colour:"--g-teal", media:"projects/app/traviti.png" },

  /* ---- August 2025 ---- */
  "Whack-a-rat @ August 2025":                                 { size:1, colour:"--g-moss", media:"projects/games/mouse.png" },
  "Freefallin' @ August 2025":                            { size:1, colour:"--g-teal", media:"projects/games/down.png" },
  "Not a Hotdog @ August 2025":                                { size:2, colour:"--g-moss", media:"projects/games/taco.png" },
};
