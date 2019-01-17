'use strict';
/**
 * Various functions handling user interactions on the scribejs page:
 *
 * 1. Handling presets
 * 2. uploading the irc log into the input
 * 3. fetching the irc log from the W3C site
 */

const _ = require('underscore');

/* eslint-disable no-else-return */
/* eslint-disable no-undef */
/* eslint-disable no-use-before-define */
/* eslint no-undef: "error" */
/* eslint-env browser */
/**
 * Storing presets. These are stored using the window's local storage facility.
 *
 * Local storage stores key-value pairs. To avoid interference with other possible usage of the
 * local storage, a single key is used for all presets.
 *
 * The value, as stored in the local storage, is a (JSON encoded) Javascript object. Each key in
 * in that object is the IRC channel name of the group, and the value is an object with the
 * values of the possible options.
 */

const storage_key = 'scribejs_webstorage_presets';

/* ------------------------------------------------------------------- */

const retrieve_presets   = () => JSON.parse(localStorage.getItem(storage_key));
const store_presets      = (all_presets) => {
    localStorage.setItem(storage_key, JSON.stringify(all_presets));
    generate_preset_menu(all_presets);
};

const JEKYLL_NONE     = 'none';
const JEKYLL_MARKDOWN = 'md';
const JEKYLL_KRAMDOWN = 'kd';

const boolean_keys = ['torepo', 'final'];

/*
 * Use a preset to set the various options in the form elements
 */
// eslint-disable-next-line no-unused-vars
function set_presets(val) {
    reset_preset_menu();
    if (val !== 'None') {
        const all_presets = retrieve_presets();
        if (!_.isEmpty(all_presets)) {
            if (all_presets[val] !== undefined) {
                const preset       = all_presets[val];
                // const date         = new Date();
                // const month        = zeropadding(date.getMonth() + 1);
                // const day          = zeropadding(date.getDate());
                // const year         = date.getFullYear();
                // const date_input   = document.getElementById('date');
                // date_input.value = `${year}-${month}-${day}`;

                /* Go through the keys of the preset and set the relevant element accordingly */
                // eslint-disable-next-line guard-for-in
                // eslint-disable-next-line no-restricted-syntax
                Object.keys(preset).forEach((key) => {
                    const value = preset[key];

                    // 1. step: get the element that has to be modified
                    const element = document.getElementById(key);

                    // 2. modify the value. The 'torepo' and 'final' elements must be treated a bit differently
                    // the extra check is necessary to avoid problems in case the preset data has a bug...
                    if (element) {
                        if (boolean_keys.indexOf(key) !== -1) {
                            element.selectedIndex = value ? 1 : 0;
                        } else if (key === 'jekyll') {
                            // eslint-disable-next-line no-nested-ternary
                            element.selectedIndex = (value === JEKYLL_MARKDOWN) ? 1 : ((value === JEKYLL_KRAMDOWN) ? 2 : 0);
                        } else {
                            element.value = value;
                        }
                    }
                });
            }
        }
    }
}

/*
 * Reset the preset menu...
 */
// eslint-disable-next-line no-unused-vars
function reset_preset_menu() {
    const presets = document.getElementById('presets');
    presets.selectedIndex = 0;
}

/*
 * Generate preset menu.
 *
 * Generates a number of `<option>` elements for the pull down menu, one for each preset.
 * The key is stored as the 'value' in the (HTML) element
 *
 * @param {Object} all_presets The full value of the respective local storage entry.
 */
function generate_preset_menu(all_presets) {
    const select_element = document.getElementById('presets');
    // Clean the element
    select_element.innerHTML = '';
    // Add an option for "None"
    const none_element = document.createElement('option');
    none_element.textContent = 'None';
    none_element.setAttribute('value', 'None');
    none_element.setAttribute('selected', 'True');
    select_element.appendChild(none_element);

    if (_.isEmpty(all_presets)) {
        console.log('No Presets');
    } else {
        _.forEach(all_presets, (value, key) => {
            const descr          = value.fullname;
            const option_element = document.createElement('option');
            option_element.textContent = descr;
            option_element.setAttribute('value', key);
            select_element.appendChild(option_element);
        });
    }
}

/*
 * List presets (for debug only!)
 */
// eslint-disable-next-line no-unused-vars
function list_presets() {
    console.log('--- Presets');
    // eslint-disable-next-line no-unused-vars
    let all_presets = retrieve_presets();
    // eslint-disable-next-line no-undef
    _.forEach(get_presets(), (value, key) => {
        console.log(value);
    });
    console.log('---');
    // generate_preset_menu(all_presets);
}

/*
 * Delete a preset
 */
// eslint-disable-next-line no-unused-vars
function remove_preset() {
    const all_presets = retrieve_presets();
    const group = document.getElementById('group').value;
    store_presets(_.omit(all_presets, group));
}

/*
 * Clear all presets
 */
// eslint-disable-next-line no-unused-vars
function clear_presets() {
    store_presets({});
}

/*
 * Create a new preset entry and add it to the full list.
 */
// eslint-disable-next-line no-unused-vars
function store_preset() {
    const to_be_stored = {};
    /* Get group name; this is used to as a key to the local storage */
    const group = document.getElementById('group').value;
    if (group !== '') {
        const targets = ['group', 'nicknames', 'ghrepo', 'ghpath', 'ghbranch', 'ghname', 'ghemail', 'ghtoken', 'fullname'];
        _.forEach(targets, (key) => {
            const el = document.getElementById(key);
            if (el) {
                const val = el.value;
                if (val !== '') {
                    to_be_stored[key] = val;
                }
            }
        });

        if (to_be_stored.fullname === undefined || to_be_stored.fullname === '') {
            to_be_stored.fullname = group;
        }

        _.forEach(boolean_keys, (key) => {
            const element = document.getElementById(key);
            if (element) {
                to_be_stored[key] = (element.selectedIndex === 1);
            }
        });

        const element = document.getElementById('jekyll');
        // eslint-disable-next-line no-nested-ternary
        to_be_stored.jekyll = element.selectedIndex === 1 ? JEKYLL_MARKDOWN : (element.selectedIndex === 2 ? JEKYLL_KRAMDOWN : JEKYLL_NONE);

        /* Here comes the meat... */
        const all_presets = retrieve_presets();
        all_presets[group] = to_be_stored;
        store_presets(all_presets);
    } else {
        console.error('no group name (IRC channel) has been provided');
    }
}

/*
 * Event handler to load the IRC log into the text area from the W3C Web site.
 * The URL is retrieved using the IRC name and the date.
 *
 * (Note that the function using the fetch function; hopefully this works now in all the usual browsers by now...)
 *
 * There is, however, a CORS issue. The IRC log does not have the CORS header set and I could not
 * get `fetch` work properly with the relevant header (why???). For now I use the
 * `https://cors-anywhere.herokuapp.com` trick, and I may have to come back to this later.
 */
// eslint-disable-next-line no-unused-vars
function fetch_log() {
    const set_input_url = (date, group) => {
        const [year, month, day] = date.split('-');
        // return `https://www.w3.org/${year}/${month}/${day}-${group}-irc.txt`;
        return `https://cors-anywhere.herokuapp.com/https://www.w3.org/${year}/${month}/${day}-${group}-irc.txt`;
    };

    const date  = document.getElementById('date').value;
    const group = document.getElementById('group').value;

    // Do it only if it is meaningful...
    if (group !== '' && date !== undefined && date !== '') {
        const target = document.getElementById('text');
        const url = set_input_url(date, group);
        fetch(url)
            .then((response) => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
                }
            })
            .then((body) => {
                // Resolve the returned Promise
                target.value = body;
            })
            .catch((err) => {
                const message = `Problem accessing remote file ${url}: ${err.message}`;
                alert(message);
                // reject(message);
            });
    } else {
        alert('No irc name or no valid date...')
    }
}

/**
 *
 * Event handler to load an IRC log from a local file.
 *
 * @param {File} file
 */
// eslint-disable-next-line no-unused-vars
function load_log(file) {
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => {
        const target = document.getElementById('text');
        // console.log(reader.result);
        target.value = reader.result;
    });
    reader.readAsText(file);
}

/**
 * Save the minutes.
 *
 * Take the content out of the 'minutes' text area, turn it into a Blob, set the right attributes
 * of an `<a>` element with `@download`, and activate it.
 */
function save_minutes() {
    const minutes = document.getElementById('minutes').value
    if (minutes && minutes !== '') {
        // Get hold of the content
        const mBlob = new Blob([minutes], {type: 'text/markdown'});
        const mURI = URL.createObjectURL(mBlob);

        const [year, month, day] = document.getElementById('date').value.split('-');
        const group = document.getElementById('group').value;
        const file_name = (group && group !== '') ? `${year}-${month}-${day}-${group}.md` : `${year}-${month}-${day}.md`

        // Pull it all together
        const download = document.getElementById('download');
        download.href = mURI;
        download.download = file_name;
        download.click();
    }
}

/**
 * Bind the functions to their respective HTML equivalents...
 * Necessary to do it this way with the usage of browserify
 */
window.addEventListener( 'load', (e) => {
    const all_presets = localStorage.getItem(storage_key);
    if (all_presets) {
        generate_preset_menu(JSON.parse(all_presets));
    } else {
        store_presets({});
    }

    // Set today's date
    const zeropadding  = (n) => (n < 10 ? `0${n}` : `${n}`);
    const date         = new Date();
    const month        = zeropadding(date.getMonth() + 1);
    const day          = zeropadding(date.getDate());
    const year         = date.getFullYear();
    const date_input   = document.getElementById('date');
    date_input.value = `${year}-${month}-${day}`;

    // Set up the event handlers
    const presets_button = document.getElementById('presets');
    presets_button.addEventListener('change', (e) => {
        set_presets(presets_button.value);
    });

    const reset_button = document.getElementById('reset');
    reset_button.addEventListener('click', reset_preset_menu);

    const upload_log_button = document.getElementById('upload_log');
    upload_log_button.addEventListener('change', (e) => {
        load_log(upload_log_button.files[0])
    });

    const fetch_log_button = document.getElementById('fetch_log');
    fetch_log_button.addEventListener('click', fetch_log);

    const store_preset_button = document.getElementById('store_preset');
    store_preset_button.addEventListener('click', store_preset);

    const remove_preset_button = document.getElementById('remove_preset');
    remove_preset_button.addEventListener('click', remove_preset);

    const clear_presets_button = document.getElementById('clear_presets');
    clear_presets_button.addEventListener('click', clear_presets);

    const save_button = document.getElementById('save');
    save_button.addEventListener('click', save_minutes);
})

