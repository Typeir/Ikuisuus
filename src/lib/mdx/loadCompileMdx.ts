/**
 * @fileoverview MDX Precompilation Loader - Dynamic import of precompiled MDX components (DEPRECATED)
 * @description Originally designed to load precompiled .js MDX bundles for faster server-side
 * rendering. This approach has been superseded by next-mdx-remote-client's evaluate() method
 * which compiles MDX on-demand with better error handling and component injection. This file
 * is kept for reference but is not actively used in the current build pipeline.
 * 
 * @deprecated Use next-mdx-remote-client/rsc evaluate() instead
 * @version 0.1.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs/promises
 * @requires path
 */

// import fs from 'fs/promises';
// import path from 'path';

// /**
//  * Loads precompiled MDX as a React component.
//  * @param {string} locale - The locale (e.g., 'en').
//  * @param {string} slugPath - Path like 'items/spear-of-paimar'.
//  * @returns {Promise<React.Component>}
//  */
// export const loadCompiledMdx = async (locale: string, slugPath: any) => {
//   const compiledPath = path.join(
//     process.cwd(),
//     'src/compiled-content',
//     locale,
//     `${slugPath}.js`
//   );

//   // Clear require cache for hot reload
//   delete require.cache[require.resolve(compiledPath)];

//   const code = await fs.readFile(compiledPath, 'utf8');

//   const exports = {};
//   const module = { exports };
//   const wrapped = new Function('exports', 'module', 'require', code);
//   wrapped(exports, module, require);
//   console.log(module);

//   return module.exports.default;
// };
