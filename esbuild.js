const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions[]} */
const configs = [
  {
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['vscode'],
    sourcemap: true,
  },
  {
    entryPoints: ['src/media/ui/main.ts'],
    outfile: 'dist/media/ui.js',
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
  },
  {
    entryPoints: ['src/media/audioEngine/engineClient.ts'],
    outfile: 'dist/media/engine.js',
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
  },
  {
    entryPoints: ['src/audioEngine/worklets/index.ts'],
    outfile: 'dist/worklets/processors.js',
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
  },
];

async function run() {
  if (watch) {
    const contexts = await Promise.all(configs.map((c) => esbuild.context(c)));
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log('esbuild watching...');
  } else {
    await Promise.all(configs.map((c) => esbuild.build(c)));
    console.log('esbuild build complete');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
