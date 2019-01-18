'use strict';
/**
 * The "bridge" between the HTML Form and the scribejs environment.
 */

// Experimenting for now...
const nicknames = require('./nicknames');
const convert = require('../../lib/convert')

/**
 * The main entry point, invoked when the user pushes the submit. Collect the
 * configuration date, call the converter, and store the minutes in the
 * relevant text area.
 *
 * This function is set as the call back for the form submission.
 *
 * @param {HTMLFormElement} form
 */
async function bridge(form) {
    const config = {
        date          : form.elements['date'].value,
        final         : form.elements['final'].value === 'true' ? true : false,
        torepo        : false,
        jekyll        : form.elements['jekyll'].value,
        pandoc        : true,
        nick_mappings : [],
        nicknames     : form.elements['nicknames'].value,
        irc_format    : undefined,
        ghname        : '',
        ghemail       : '',
        ghtoken       : '',
    };
    config.nicks = await nicknames.get_nick_mapping(config);
    const irc_log  = form.elements['text'].value;
    const minutes = convert.to_markdown(irc_log, config);
    const target = document.getElementById('minutes');
    target.value = minutes;
}

window.addEventListener( 'load', (e) => {
    // Set up the event handler
    const submit_button = document.getElementById('submit_button');
    submit_button.addEventListener('click', (e) => {
        const the_form = document.getElementById('main_form');
        bridge(the_form);
    });
})

