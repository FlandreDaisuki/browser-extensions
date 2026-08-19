import flandre from '@flandredaisuki/eslint-config';

export default [
  {
    ignores: ['**/dist/**'],
    name: 'browser-extensions/ignores',
  },
  ...flandre.preset,
  {
    files: ['userscripts/**/*.js'],
    languageOptions: {
      globals: {
        GM: 'readonly',
        GM_getResourceText: 'readonly',
        GM_getValue: 'readonly',
        GM_setValue: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        winkblue: 'readonly',
      },
    },
    name: 'browser-extensions/userscripts',
  },
];
