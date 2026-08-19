import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'rolldown';
import { replacePlugin } from 'rolldown/plugins';
import metablock from 'rollup-plugin-userscript-metablock';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([{
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
    file: 'dist/FμckFacebook.user.js',
    format: 'iife',
  },
}, {
  input: './index.js',
  plugins: [
    replacePlugin({
      '$getResourceText(\'faceBullshit\')': JSON.stringify(
        fs.readFileSync(path.join(DIRNAME, 'FaceBullshit.user.css'), 'utf8'),
      ),
    }, {
      delimiters: ['', ''],
      preventAssignment: true,
    }),
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
    file: 'dist/FμckFacebook.ios.user.js',
    format: 'iife',
  },
}]);
