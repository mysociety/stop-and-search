/**
 * Workaround lack of ES6 support in SQL.js.
 *
 * https://github.com/sql-js/sql.js/issues/284
 *
 * Sample usage:
 * ```
 * import { initSqlJs } from './SqlJs';
 *
 * initSqlJs(file => `path/to/dist/${file}`).then(SQL => {
 *   const db = new SQL.Database();
 * });
 * ```
 * @param {function(string): string} fileMap
 */
export async function initSqlJs(fileMap) {
  // Get the SqlJs code as a string.
  const response = await fetch(fileMap('sql-wasm.js'));
  const code = await response.text();

  // Instantiate the code and access its exports.
  const f = new Function('exports', code);
  const exports = {};
  f(exports);

  // Call the real initSqlJs().
  return exports.Module({ locateFile: fileMap });
}
