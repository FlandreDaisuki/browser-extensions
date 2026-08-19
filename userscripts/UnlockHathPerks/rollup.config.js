import commonjs from '@rollup/plugin-commonjs';
import metablock from 'rollup-plugin-userscript-metablock';

export default {
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
    file: 'dist/UnlockHathPerks.user.js',
    format: 'iife',
  },
};
