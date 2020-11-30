/**
 *
 * Collection of utility functions, put here for a better maintenance
 *
 *
 * For the moment, the default (ie, 'master') branch is used.
 *
 * @packageDocumentation
 */

/** constant to decide whether the code runs in a browser or via node.js */
export const is_browser :boolean = (process === undefined || process.title === 'browser');

/**
 * "Zip" two arrays, i.e., create an array whose elements are pairs of the corresponding elements in the two arrays being processed.
 */
export function zip<T,U>(left: T[], right: U[]): [T,U][] {
    const l = (left.length <= right.length) ? left.length : right.length;
    const retval: [T,U][] = [];
    for (let i = 0; i < l; i++) {
        retval.push([left[i],right[i]])
    }
    return retval;
}
