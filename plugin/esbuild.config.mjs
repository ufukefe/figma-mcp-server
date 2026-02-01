import { build, context } from 'esbuild';
import { readFileSync, utimesSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const manifestPath = resolve(__dirname, 'manifest.json');
const uiDistHtmlPath = resolve(__dirname, 'dist', 'index.html');
const uiSrcHtmlPath = resolve(__dirname, 'ui', 'index.html');

// Plugin to touch manifest.json on build
const touchManifestPlugin = {
  name: 'touch-manifest',
  setup(build) {
    build.onEnd(() => {
      try {
        // Touch the file by updating its modification time
        const now = new Date();
        utimesSync(manifestPath, now, now);
      } catch (error) {
        console.warn('Could not touch manifest.json:', error);
      }
    });
  },
};

// Get command line arguments (npm passes extra args after --)
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isMinify = args.includes('--minify');

const uiHtml = (() => {
  try {
    return readFileSync(uiDistHtmlPath, 'utf8');
  } catch {
    // Fallback for cases where UI hasn't been built yet (e.g. in watch mode).
    // This will at least prevent a runtime crash in the Figma plugin.
    try {
      return readFileSync(uiSrcHtmlPath, 'utf8');
    } catch {
      return '';
    }
  }
})();

const buildOptions = {
  entryPoints: ['main/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  platform: 'browser',
  // Figma plugin runtime lags modern JS (e.g. no nullish coalescing in some builds),
  // so we transpile down to avoid syntax errors.
  target: 'es2017',
  format: 'iife',
  minify: isMinify,
  // Avoid generating source maps (they can cause noisy CSP warnings inside Figma).
  sourcemap: false,
  define: {
    // Figma plugins expect the UI HTML to be provided via a global `__html__` string.
    // Create Figma Plugin templates normally inject this at build time.
    __html__: JSON.stringify(uiHtml),
  },
  plugins: [touchManifestPlugin],
  legalComments: 'none',
  keepNames: false,
};

(async () => {
  if (isWatch) {
    try {
      const ctx = await context(buildOptions);
      await ctx.watch();
      console.log('Watching for changes...');
      // The watch mode will keep the process alive automatically
    } catch (error) {
      console.error('Initial build failed:', error);
      process.exit(1);
    }
  } else {
    // In regular build mode, exit on error
    await build(buildOptions).catch(() => process.exit(1));
  }
})();
