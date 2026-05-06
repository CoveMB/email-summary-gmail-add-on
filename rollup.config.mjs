import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/Code.ts',
  output: {
    file: 'dist/Code.js',
    format: 'iife',
    generatedCode: 'es2015',
    name: 'EmailSummaryBundle',
    sourcemap: false,
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.build.json',
    }),
    copy({
      hook: 'writeBundle',
      targets: [{ src: 'appsscript.json', dest: 'dist' }],
    }),
  ],
};
