import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import commonjs from '@rollup/plugin-commonjs';
import metablock from 'rollup-plugin-userscript-metablock';
import replace from '@rollup/plugin-replace';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

export default [{
  input: './index.js',
  plugins: [
    commonjs(),
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
    replace({
      preventAssignment: true,
      delimiters: ['\\$', '\\('],
      values: {
        getResourceText: '(',
      },
    }),
    replace({
      preventAssignment: true,
      delimiters: ['\\(\'', '\'\\)'],
      values: {
        faceBullshit: `\`${ fs.readFileSync(path.join(DIRNAME, 'FaceBullshit.user.css'), 'utf-8') }\`;\n`,
      },
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
}];
