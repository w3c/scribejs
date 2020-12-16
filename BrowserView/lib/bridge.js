/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-alert */
/* eslint-env browser */

'use strict';

/**
 * The "bridge" between the HTML Form and the scribejs environment.
 */

const marked = require('marked-it-core');

const nicknames = require('./nicknames');
const convert = require('../../lib/convert');
const schema = require('./schema');
const { Actions } = require('../../lib/actions');

// This is used to export the calculated actions to the separate module
// that saves the minutes, as well as 'stores' the actions as issues.
let theActions = {};
const getActions = () => theActions;


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
        ghname        : form.elements.ghname.value,
        issuerepo     : form.elements.issuerepo.value,
        ghemail       : '',
        ghrepo        : '',
        ghpath        : '',
        ghbranch      : '',
        ghtoken       : form.elements.ghtoken.value,
        acrepo        : form.elements.acrepo.value,
        acurlpattern  : form.elements.acurlpattern.value
    };
    config.nicks = await nicknames.get_nick_mapping(config);

    // Validate the nickname mapping object against the appropriate JSON schema
    if (!schema.validate_nicknames(config.nicks)) {
        const errors = schema.validation_errors(schema.validate_nicknames);
        console.warn(`Warning: scribejs validation error in nicknames: ${errors}
(nicknames ignored)`);
        alert(`Warning: scribejs validation error in nicknames: ${errors}
(nicknames ignored)`);
        config.nicks = [];
    }

    // Set up the action handling
    theActions = new Actions(config);

    const irc_log  = form.elements.text.value;
    // undefined for testing...
    return new convert.Converter(config, theActions).convert_to_markdown(irc_log);
}

function emptyNode(n) {
    while (n.hasChildNodes()) {
        n.removeChild(n.lastChild);
    }
}

function renderPreview(markdown) {
    const preview = document.getElementById('preview');
    const results = marked.generate(markdown);
    emptyNode(preview);
    preview.insertAdjacentHTML('afterbegin', results.html.text);
}

function previewToggle(ev, minutes) {
    const editorTab = document.getElementById('editor-tab');
    const previewerTab = document.getElementById('previewer-tab');
    if (ev.target.checked) {
        renderPreview(minutes.value);
        editorTab.classList.remove('active');
        previewerTab.classList.add('active');
    } else {
        editorTab.classList.add('active');
        previewerTab.classList.remove('active');
    }
}

function submit(minutes) {
    const the_form = document.getElementById('main_form');
    const markdown = bridge(the_form);
    markdown.then((md) => {
        minutes.value = md;
        renderPreview(md);
    });
}

window.addEventListener('load', () => {
    const minutes = document.getElementById('minutes');
    const preview_markdown = document.getElementById('preview_markdown');
    preview_markdown.checked = false;
    preview_markdown.addEventListener('change', (ev) => previewToggle(ev, minutes));

    // Set up the event handler
    const submit_button = document.getElementById('submit_button');
    submit_button.addEventListener('click', () => submit(minutes));
});

module.exports = { getActions };
