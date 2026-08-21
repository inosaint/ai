/* Remotion does not see the site's <link> tags, so the faces are loaded here.
   Without this the reel silently falls back to system fonts and stops looking
   like the site — which is most of the reason for building it this way. */
import {loadFont as loadSans} from '@remotion/google-fonts/PlusJakartaSans';
import {loadFont as loadMono} from '@remotion/google-fonts/MartianMono';

const sans = loadSans('normal', {weights: ['400', '600', '700'], subsets: ['latin']});
const mono = loadMono('normal', {weights: ['400', '500'], subsets: ['latin']});

export const SANS_FAMILY = sans.fontFamily;
export const MONO_FAMILY = mono.fontFamily;
export const fontsReady = Promise.all([sans.waitUntilDone(), mono.waitUntilDone()]);
