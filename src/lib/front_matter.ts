/**
 * ## Generate schema.org metadata
 *
 * Creating the schema.org metadata, in JSON-LD format, for the minutes. The json-ld portion is added to the kramdown header; the jekyll setup must take care of generating a `script` element in the header of the generated HTML file.
 *
 * @packageDocumentation
*/

import { Configuration, Header } from './types';
import { Constants }             from './types';
import { Action, Actions } from './actions';


/**
 * Generating a json-ld header to the minutes using schema.org vocabulary items.
 *
 * @param header - the structure used by the converter to generate the header entries into the minutes
 * @param config - the general configuration file for the scribejs run
 * @param action_list - the list of Actions accumulated from the minutes
 * @returns the JSON-LD encoded schema.org metadata of the minutes
 */
// eslint-disable-next-line max-lines-per-function
function schema_data(header: Header, config: Configuration, action_list: Actions): string {
    // eslint-disable-next-line max-len
    const url_pattern = (pattern: string): string => pattern.replace(/%YEAR%/g, year).replace(/%MONTH%/g, month).replace(/%DAY%/g, day).replace(/%DATE%/g, header.date);

    // Variables needed to produce the right URL (if the URL pattern is present)
    const [year, month, day] = header.date.split('-');

    // Get the different types of participants from the comma separated lists
    const chairs   = header.chair;
    const scribes  = header.scribe;
    // eslint-disable-next-line arrow-body-style
    const present  = [...header.present, ...header.guests].filter((name) => {
        return !(chairs.includes(name) || scribes.includes(name));
    });

    // Build up the structures that is then returned as a JSON string
    const schema_metadata: any = {
        '@context' : 'https://schema.org/',
        '@type'    : 'CreativeWork',
    };

    if (config.acurlpattern) {
        schema_metadata.url = url_pattern(config.acurlpattern);
    }

    schema_metadata.name = `${header.meeting} — Minutes`;
    schema_metadata.about = header.meeting;
    schema_metadata.dateCreated = header.date;
    schema_metadata.datePublished = (new Date()).toISOString().split('T')[0];
    schema_metadata.genre = 'Meeting Minutes';
    schema_metadata.accessMode = 'textual';
    schema_metadata.accessModeSufficient = 'textual';
    schema_metadata.encodingFormat = 'text/html';
    schema_metadata.publisher = {
        '@type' : 'Organization',
        name    : 'World Wide Web Consortium',
        url     : 'https://www.w3.org/',
    };
    schema_metadata.inLanguage = 'en-US';
    schema_metadata.recordedAt = {
        '@type'   : 'Event',
        name      : header.meeting,
        startDate : header.date,
        endDate   : header.date,
        location  : {
            '@type'     : 'VirtualLocation',
            description : 'Teleconference',
        },
        attendee : [
            {
                '@type'  : 'OrganizationRole',
                roleName : 'chair',
                attendee : chairs.map((chair) => ({
                    '@type' : 'Person',
                    name    : chair,
                })),
            },
            {
                '@type'  : 'OrganizationRole',
                roleName : 'scribe',
                attendee : scribes.map((scribe) => ({
                    '@type' : 'Person',
                    name    : scribe,
                })),
            },
            ...present.map((attendee) => ({
                '@type' : 'Person',
                name    : attendee,
            })),
        ],
    };

    if (action_list.valid && action_list.actions.length > 0) {
        schema_metadata.recordedAt.potentialAction = action_list.actions.map((action: Action): any => {
            return {
                "@type"    : "Action",
                "location" : {
                    "@type"      : "VirtualLocation",
                    "name"       : `GitHub repository`,
                    "identifier" : action_list.repo_name,
                },
                "identifier" : action.gh_action_id,
                "object"     : action.body,
                "title"      : action.title,
                "agent"      : {
                    "@type" : "Person",
                    "name"  : action.assignee,
                },
            }
        })
    }

    // Care should be taken to properly indent the data, otherwise jekyll ignores this
    return JSON.stringify(schema_metadata, null, 4).replace(/\n/g, '\n    ').replace(/^{/, '    {');
}


/**
 * Generate the front matter. What this entails depends on the exact format
 *
 * * For Jekyll, this is the front matter as defined by Jekyll with a layout name ('minutes'), date, title, and a json-ld portion containing the JSON-LD schema.org metadata.
 * * For pandoc it has a line of the form `% Meeting - Date`, followed by a separate line with the W3C logo.
 * * Otherwise just the JSON-LD schema.org metadata as a markdown comment
 *
 * The JSON-LD part is generated via the [[schema_data]] function.
 *
 *
 * @param header - the structure used by the converter to generate the header entries into the minutes
 * @param config - the general configuration file for the scribejs run
 * @param action_list - the list of Actions accumulated from the minutes
 * @returns the full front matter
 */

export function generate_front_matter(headers: Header, config: Configuration, action_list: Actions): string {
    const json_ld = config.schema ? schema_data(headers, config, action_list) : '';

    let front_matter: string;

    if (config.jekyll !== Constants.JEKYLL_NONE) {
        front_matter = `---
layout: minutes
date: ${headers.date}
title: ${headers.meeting} — ${headers.date}`
        if (json_ld !== '') {
            front_matter += `
json-ld: |
${json_ld}
`
        }

        front_matter += `
---
`
    } else if (config.pandoc) {
        front_matter = `% ${headers.meeting} — ${headers.date}

![W3C Logo](https://www.w3.org/Icons/w3c_home)

`;
    } else {
        front_matter = `<!---
${json_ld}
-->

![W3C Logo](https://www.w3.org/Icons/w3c_home)
`
    }

    return front_matter
}
