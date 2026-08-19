import { defineConfig } from 'rolldown';
import metablock from 'rollup-plugin-userscript-metablock';

export default defineConfig({
  input: './index.js',
  plugins: [
    metablock({
      order: [
        'name',
        'description',
        'namespace',
        'version',
        '...',
        'grant',
        'noframes',
        'author',
        'supportURL',
        'homepageURL',
        'license',
      ],
    }),
  ],

  output: {
    file: 'dist/UnlockHathPerks.user.js',
    format: 'iife',
  },
});
