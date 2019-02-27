/* eslint-disable no-alert */
/* eslint-env browser */

/**
 * Wrapper around a fetch to get hold of the action lists. The function
 * parses the response, too.
 *
 * @async
 * @param {String} address - URL of the action list file
 * @returns {Promise(Object)} - the action list as parsed from the JSON file
 */
async function get_actions(address) {
    return new Promise((resolve, reject) => {
        fetch(address, { mode: 'no-cors' })
            .then((response) => {
                if (response.ok) {
                    // I need to check whether the returned data is genuine json; however,
                    // alas!, github does not set the content type of the returned raw data
                    // to json, ie, the response header cannot be used for that purpose.
                    // Instead, the value is sent to a next step to parse it explicitly
                    return response.text();
                }
                reject(new Error(`HTTP response ${response.status}: ${response.statusText}`));
            })
            .then((body) => {
                // Try to parse the content as JSON and, if it works, that is almost
                // the final result, module turn all the nicknames to lowercase
                let json_content = {};
                try {
                    json_content = JSON.parse(body);
                } catch (err) {
                    alert(`JSON parsing error in ${address}: ${err}`);
                    reject(new Error(`JSON parsing error in ${address}: ${err}`));
                }
                resolve(json_content);
            })
            .catch((err) => {
                alert(`Problem accessing remote file ${address}: ${err.message}`);
                reject(new Error(`Problem accessing remote file ${address}: ${err.message}`));
            });
    });
}

/**
 * Display the list of actions as a series of `<dt>`/`<dd>` elements; each `<dd>` has a `<ul>` with the individual actions items.
 * @param {Object} action_list - the list of actions: an object with the participants' name as keys and arrays of actions as values.
 * @param {HTMLElement} target - the target DOM element (a `<dl>`) to display the actions in.
 */
function display_actions(action_list, target) {
    // Get the keys but in alphabetic order:
    const names = Object.keys(action_list).sort();
    // display each key with the corresponding actions
    names.forEach((name) => {
        const actions = action_list[name].filter((act) => act.open);
        // The list may be empty, because all actions are closed...
        if (actions.length > 0) {
            // Add a dt element for the name:
            const dt = document.createElement('dt');
            dt.textContent = name;
            target.appendChild(dt);
            // Create an dd+ol element to hold the actions themselves
            const dd = document.createElement('dd');
            target.appendChild(dd);
            const ul = document.createElement('ul');
            dd.appendChild(ul);
            // Now the individual actions:
            actions.forEach((action) => {
                const dd = document.createElement('li');
                dd.innerHTML = `<a href='${action.url}'>${action.action}</a> (${action.date})`;
                ul.appendChild(dd);
            });
        }
    });
}

/**
 * Entry point: find the `<dl>` element where the action list must be displayed, and retrieve the URL for the action list itself.
 * The relevant JSOn content is retrieved and displayed.
 */
async function show_actions() {
    const target = document.getElementById('actions');
    if (target && target.dataset.actionlist) {
        // url is a reference to the action list
        const actions = await get_actions(target.dataset.actionlist);
        display_actions(actions.actions, target);
    }
}

window.addEventListener('load', () => {
    show_actions();
});
