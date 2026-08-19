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

   The category is NOT set here — it comes from the project itself and decides
   which symbol the block crumbles into. Months are fixed by date and always
   stay in order; only the arrangement inside a month is shuffled per visit.
--------------------------------------------------------------------------- */
const GRID_CONFIG = {

  /* ---- July 2026 ---- */
  "Design Demo Nights #5":                       { size:3, colour:"--g-vermillion", media:"projects/design-demos/demos-5.png" },
  "Sudhaarit":                                   { size:2, colour:"--g-teal", media:"projects/app/sudhaarit-site.png" },
  "Mapyour.org growth plan feature":             { size:1, colour:"--g-navy", media:"projects/app/mapyourgrowth.png" },
  "data-vizard.com":                             { size:2, colour:"--g-teal", media:"projects/data-vizard/data-vizard-site.png" },
  "Salary data viz":                             { size:3, colour:"--g-terra", media:"projects/data-vizard/salary-data.png" },
  "Interactive DataViz Using AI Coding at VizChitra 2026": { size:1, colour:"--g-coral", media:"projects/workshop/vizchitra.jpeg" },
  "FIFA 2026 football world cup visualized":     { size:2, colour:"--g-terra", media:"" },

  /* ---- June 2026 ---- */
  "Data Vizard":                                 { size:2, colour:"--g-teal", media:"projects/data-vizard/data-vizard.png" },
  "feels":                                       { size:1, colour:"--g-navy", media:"" },
  "Design Demo Nights #4":                       { size:3, colour:"--g-vermillion", media:"projects/design-demos/demos-4.JPG" },

  /* ---- May 2026 ---- */
  "Solar System Narrative Viz":                  { size:2, colour:"--g-terra", media:"projects/viz-demos/viz-demos-1.png" },
  "Grindsize Social Ad":                         { size:1, colour:"--g-terra", media:"" },
  "Design Demo Nights #3":                       { size:3, colour:"--g-vermillion", media:"projects/design-demos/demos-3.jpg" },
  "Design Demo Nights Archive":                  { size:2, colour:"--g-vermillion", media:"" },
  "Grindsize.in":                                { size:4, colour:"--g-navy", media:"projects/grinder-calibrator/grinder-v1.jpg" },

  /* ---- April 2026 ---- */
  "Agentic Coding Workshop at CEC, Mangalore":   { size:1, colour:"--g-vermillion", media:"projects/workshop/canara.jpeg" },
  "Design Demo Nights #2":                       { size:2, colour:"--g-vermillion", media:"projects/design-demos/demos-2.jpg" },
  "ASCII Rocky":                                 { size:3, colour:"--g-terra", media:"projects/app/rocky.png" },
  "Tower Dungeon":                               { size:1, colour:"--g-moss", media:"projects/games/tower.PNG" },
  "designr.":                                    { size:2, colour:"--g-ochre", media:"projects/app/designr.png" },

  /* ---- March 2026 ---- */
  "Amoebas - Live":                              { size:2, colour:"--g-teal", media:"projects/app/amoebas.mov" },
  "Amoebas":                                     { size:1, colour:"--g-moss", media:"projects/app/amoebas.mov" },
  "Design Demo Nights #1":                       { size:3, colour:"--g-vermillion", media:"projects/design-demos/demos-1.jpeg" },
  "Pinboarder":                                  { size:4, colour:"--g-navy", media:"projects/app/pinboarder.png" },
  "Infinite Pixel Dungeons":                     { size:2, colour:"--g-moss", media:"projects/games/infinite-dungeons.mov" },
  "Design Tooling Releases — Exploration 2":     { size:1, colour:"--g-ochre", media:"" },
  "Design Tooling Releases — Exploration 1":     { size:2, colour:"--g-terra", media:"" },
  "Same Prompt, 3 Design Models, 1 Tool":        { size:2, colour:"--g-ochre", media:"" },
  "AI Workshop at NID":                          { size:1, colour:"--g-vermillion", media:"projects/workshop/nid.jpeg" },

  /* ---- February 2026 ---- */
  "Sudhaarit":                                   { size:2, colour:"--g-navy", media:"" },
  "Unnamed":                                     { size:3, colour:"--g-moss", media:"projects/unamed/unamed.png" },
  "Hermes":                                      { size:4, colour:"--g-teal", media:"projects/app/hermes-mac.png" },
  "Smithy":                                      { size:1, colour:"--g-navy", media:"projects/app/smithy/cover-smithy.png" },
  "Vibeshift Projects":                          { size:2, colour:"--g-teal", media:"projects/event/vibeshift-blr.jpg" },
  "exhume.link":                                 { size:2, colour:"--g-terra", media:"projects/app/exhume.png" },

  /* ---- January 2026 ---- */
  "Mapyour.org":                                 { size:4, colour:"--g-navy", media:"projects/app/mapyourorg.JPG" },
  "AI workshop":                                 { size:1, colour:"--g-teal", media:"projects/workshop/ai-workshop.png" },
  "Books Viz&#x27; 2025":                        { size:3, colour:"--g-terra", media:"projects/exploration/books-2025.png" },

  /* ---- November 2025 ---- */
  "budgie.travel":                               { size:4, colour:"--g-navy", media:"projects/app/budgie.PNG" },
  "traviti":                                     { size:2, colour:"--g-teal", media:"projects/app/traviti.png" },

  /* ---- August 2025 ---- */
  "Whack-a-rat":                                 { size:1, colour:"--g-moss", media:"projects/games/mouse.png" },
  "Freefallin&#x27;":                            { size:3, colour:"--g-teal", media:"projects/games/down.png" },
  "Not a Hotdog":                                { size:2, colour:"--g-moss", media:"projects/games/taco.png" },
};
