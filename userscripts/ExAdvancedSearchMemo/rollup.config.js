import commonjs from '@rollup/plugin-commonjs';
import metablock from 'rollup-plugin-userscript-metablock';

export default {
  input: './index.js',
  plugins: [
    commonjs(),
    metablock(),
  ],

  output: {
    file: 'dist/ExAdvancedSearchMemo.user.js',
    format: 'iife',
  },
};
