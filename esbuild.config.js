const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
    entryPoints: [path.join(__dirname, 'src/components/App.jsx')],
    bundle: true,
    outfile: path.join(__dirname, 'src/components/bundle.js'),
    format: 'iife',
    globalName: 'CheatingDaddyApp',
    platform: 'browser',
    target: ['chrome100'],
    jsx: 'automatic',
    jsxImportSource: 'react',
    loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
    },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    external: ['electron'],
    minify: false,
    sourcemap: true,
    banner: {
        js: '// React App Bundle\n',
    },
    footer: {
        js: `
// Ensure initializeReactApp is accessible
if (typeof window !== 'undefined' && window.CheatingDaddyApp) {
    if (window.CheatingDaddyApp.initializeReactApp) {
        console.log('[Bundle] initializeReactApp is available');
    } else {
        console.warn('[Bundle] initializeReactApp not found in CheatingDaddyApp');
        console.log('[Bundle] Available keys:', Object.keys(window.CheatingDaddyApp));
    }
}
`,
    },
};

async function build() {
    try {
        if (isWatch) {
            const ctx = await esbuild.context(buildOptions);
            await ctx.watch();
            console.log('Watching for changes...');
        } else {
            await esbuild.build(buildOptions);
            console.log('React bundle built successfully!');
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
