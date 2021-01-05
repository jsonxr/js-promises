import pkg from './package.json';
import typescript from '@wessberg/rollup-plugin-ts';
import { terser } from 'rollup-plugin-terser';

const common = {
  sourcemap: true,
  banner: `
// ${pkg.name}: ${pkg.version}
// Copyright © 2021 Jason Rowland

`,
};

export default [
  {
    input: ['src/index.ts'],
    output: [
      {
        ...common,
        dir: 'lib',
        format: 'esm',
      },
      {
        ...common,
        file: 'lib/cjs/index.js',
        format: 'cjs',
      },
      {
        ...common,
        file: 'lib/PromisePool.min.js',
        format: 'umd',
        name: 'LDRAW',
        esModule: false,
        plugins: [terser()],
      },
      {
        ...common,
        file: 'lib/PromisePool.js',
        format: 'umd',
        name: 'LDRAW',
        esModule: false,
      },
    ],
    plugins: [typescript({ tsconfig: 'tsconfig.json' })],
  },
];
