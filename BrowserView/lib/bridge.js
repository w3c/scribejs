/* eslint-env browser */

'use strict';

/**
 * The "bridge" between the HTML Form and the scribejs environment.
 */

const marked = require('marked-it-core');

// Experimenting for now...
const nicknames = require('./nicknames');
const convert = require('../../lib/convert');

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
        date          : form.elements.date.value,
        final         : form.elements.final.value === 'true',
        torepo        : false,
        jekyll        : form.elements.jekyll.value,
        pandoc        : true,
        nick_mappings : [],
        nicknames     : form.elements.nicknames.value,
        irc_format    : undefined,
        ghname        : '',
        ghemail       : '',
        ghtoken       : ''
    };
    config.nicks = await nicknames.get_nick_mapping(config);
    const irc_log  = form.elements.text.value;
    const minutes = convert.to_markdown(irc_log, config);
    const target = document.getElementById('minutes');
    target.value = minutes;
}

window.addEventListener('load', () => {
    // Set up the event handler
    const submit_button = document.getElementById('submit_button');
    submit_button.addEventListener('click', () => {
        const the_form = document.getElementById('main_form');
        bridge(the_form);
    });
    const preview_markdown = document.getElementById('preview_markdown');
    preview_markdown.addEventListener('change', (ev) => {
        const editorTab = document.getElementById('editor-tab');
        const previewerTab = document.getElementById('previewer-tab');
        if (ev.target.checked) {
            const minutes = document.getElementById('minutes');
            const preview = document.getElementById('preview');
            const results = marked.generate(minutes.value);
            while (preview.firstChild) {
                preview.removeChild(preview.firstChild);
            }
            preview.insertAdjacentHTML('afterbegin', results.html.text);
            editorTab.classList.remove('active');
            previewerTab.classList.add('active');
        } else {
            editorTab.classList.add('active');
            previewerTab.classList.remove('active');
        }
    });
});
