"use strict";
/**
 * ## Generate schema.org metadata
 *
 * Creating the schema.org metadata, in JSON-LD format, for the minutes. The json-ld portion is added to the kramdown header; the jekyll setup must take care of generating a `script` element in the header of the generated HTML file.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate_front_matter = void 0;
const types_1 = require("./types");
/**
 * Generating a json-ld metadata header to the minutes using mostly schema.org vocabulary terms.
 *
 * @param header - the structure used by the converter to generate the header entries into the minutes
 * @param global - the general global data for the scribejs run
 * @returns the JSON-LD encoded metadata of the minutes
 */
// eslint-disable-next-line max-lines-per-function
function generate_metadata(header, global) {
    // eslint-disable-next-line max-len
    const url_pattern = (pattern) => pattern.replace(/%YEAR%/g, year).replace(/%MONTH%/g, month).replace(/%DAY%/g, day).replace(/%DATE%/g, header.date);
    // Variables needed to produce the right URL (if the URL pattern is present)
    const [year, month, day] = header.date.split('-');
    // Get the different types of participants from the comma separated lists
    const chairs = header.chair;
    const scribes = header.scribe;
    // eslint-disable-next-line arrow-body-style
    const present = [...header.present, ...header.guests].filter((name) => {
        return !(chairs.includes(name) || scribes.includes(name));
    });
    // Build up the structures that is then returned as a JSON string
    const metadata = {};
    const resolution_context = JSON.parse(`{
        "resolution" : {
            "@id": "https://w3c.github.io/scribejs/vocab/resolution",
            "@context" : {
                "@vocab": "https://w3c.github.io/scribejs/vocab/"
            }
        },
        "irc" : {
            "@id": "https://w3c.github.io/scribejs/vocab/irc"
        }
    }`);
    metadata['@context'] = [
        'https://schema.org',
        resolution_context,
    ];
    metadata['@type'] = 'CreativeWork';
    if (global.acurlpattern) {
        metadata.url = url_pattern(global.acurlpattern);
    }
    metadata.name = `${header.meeting} — Minutes`;
    metadata.about = header.meeting;
    metadata.dateCreated = header.date;
    metadata.irc = global.group;
    metadata.datePublished = (new Date()).toISOString().split('T')[0];
    metadata.genre = 'Meeting Minutes';
    metadata.accessMode = 'textual';
    metadata.accessModeSufficient = 'textual';
    metadata.encodingFormat = 'text/html';
    metadata.publisher = {
        '@type': 'Organization',
        name: 'World Wide Web Consortium',
        url: 'https://www.w3.org/',
    };
    metadata.inLanguage = 'en-US';
    metadata.recordedAt = {
        '@type': 'Event',
        name: header.meeting,
        startDate: header.date,
        endDate: header.date,
        location: {
            '@type': 'VirtualLocation',
            description: 'Teleconference',
        },
        attendee: [
            {
                '@type': 'OrganizationRole',
                roleName: 'chair',
                attendee: chairs.map((chair) => ({
                    '@type': 'Person',
                    name: chair,
                })),
            },
            {
                '@type': 'OrganizationRole',
                roleName: 'scribe',
                attendee: scribes.map((scribe) => ({
                    '@type': 'Person',
                    name: scribe,
                })),
            },
            ...present.map((attendee) => ({
                '@type': 'Person',
                name: attendee,
            })),
        ],
    };
    if (global.action_list.valid && global.action_list.actions.length > 0) {
        metadata.recordedAt.potentialAction = global.action_list.actions.map((action) => {
            return {
                "@type": "Action",
                "location": {
                    "@type": "VirtualLocation",
                    "name": `GitHub repository`,
                    "identifier": global.action_list.repo_name,
                },
                "object": action.body,
                "name": action.title,
                "agent": {
                    "@type": "Person",
                    "name": action.assignee,
                },
            };
        });
    }
    if (global.resolution_list.length > 0) {
        metadata.resolution = global.resolution_list.map((resolution) => {
            return {
                '@type': "Resolution",
                resolution_number: resolution.resolution_number,
                resolution_text: resolution.resolution_text,
            };
        });
    }
    // Care should be taken to properly indent the data, otherwise jekyll ignores this
    return JSON.stringify(metadata, null, 4).replace(/\n/g, '\n    ').replace(/^{/, '    {');
}
/**
 * Generate the front matter. What this entails depends on the exact format
 *
 * * For Jekyll, this is the front matter as defined by Jekyll with a layout name ('minutes'), date, title, and a json-ld portion containing the JSON-LD schema.org metadata.
 * * For pandoc it has a line of the form `% Meeting - Date`, followed by a separate line with the W3C logo.
 * * Otherwise just the JSON-LD metadata as a markdown comment
 *
 * The JSON-LD part is generated via the [[generate_metadata]] function.
 *
 *
 * @param header - the structure used by the converter to generate the header entries into the minutes
 * @param global - the general configuration file for the scribejs run
 * @returns the full front matter
 */
function generate_front_matter(headers, global) {
    const json_ld = global.schema ? generate_metadata(headers, global) : '';
    let front_matter;
    if (global.jekyll !== types_1.Constants.JEKYLL_NONE) {
        front_matter = `---
layout: minutes
date: ${headers.date}
title: ${headers.meeting} — ${headers.date}`;
        if (json_ld !== '') {
            front_matter += `
json-ld: |
${json_ld}
`;
        }
        front_matter += `
---
`;
    }
    else if (global.pandoc) {
        front_matter = `% ${headers.meeting} — ${headers.date}

![W3C Logo](https://www.w3.org/Icons/w3c_home)

`;
    }
    else {
        front_matter = `<!---
${json_ld}
-->

![W3C Logo](https://www.w3.org/Icons/w3c_home)
`;
    }
    return front_matter;
}
exports.generate_front_matter = generate_front_matter;
//# sourceMappingURL=front_matter.js.map