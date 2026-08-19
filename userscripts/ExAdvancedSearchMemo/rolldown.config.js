import { defineConfig } from 'rolldown';
import metablock from 'rollup-plugin-userscript-metablock';

export default defineConfig({
  input: './index.js',
  plugins: [
    metablock(),
  ],

  output: {
    file: 'dist/ExAdvancedSearchMemo.user.js',
    format: 'iife',
  },
});
