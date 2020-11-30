"use strict";
/**
 *
 * Collection of utility functions, put here for a better maintenance
 *
 *
 * For the moment, the default (ie, 'master') branch is used.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = exports.is_browser = void 0;
/** constant to decide whether the code runs in a browser or via node.js */
exports.is_browser = (process === undefined || process.title === 'browser');
/**
 * "Zip" two arrays, i.e., create an array whose elements are pairs of the corresponding elements in the two arrays being processed.
 */
function zip(left, right) {
    const l = (left.length <= right.length) ? left.length : right.length;
    const retval = [];
    for (let i = 0; i < l; i++) {
        retval.push([left[i], right[i]]);
    }
    return retval;
}
exports.zip = zip;
//# sourceMappingURL=utils.js.map