'use strict';

import { Configuration, DisplayHeader } from './types';


/**
 * Adding a json-ld header to the minutes using schema.org vocabulary items.
 *
 * @param header - the structure used by the converter to generate the header entries into the minutes
 * @param config - the general configuration file for the scribejs run
 * @returns - the JSON-LD encoded schema.org metadata of the minutes
 */
export function schema_data(header: DisplayHeader, config: Configuration): string {
    // turn a comma separated list into an array of strings. */
    const people_list = (comma_list: string): string[] => comma_list.split(',').map((name) => name.trim()).filter((name) => name !== '');

    // eslint-disable-next-line max-len
    const url_pattern = (pattern: string): string => pattern.replace(/%YEAR%/g, year).replace(/%MONTH%/g, month).replace(/%DAY%/g, day).replace(/%DATE%/g, header.date);

    // Variables needed to produce the right URL (if the URL pattern is present)
    const [year, month, day] = header.date.split('-');

    // Get the different types of participants from the comma separated lists
    const chairs   = people_list(header.chair);
    const scribes  = people_list(header.scribe);
    // eslint-disable-next-line arrow-body-style
    const present  = [...people_list(header.present), ...people_list(header.guests)].filter((name) => {
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
    // Care should be taken to properly indent the data, otherwise jekyll ignores this
    return JSON.stringify(schema_metadata, null, 4).replace(/\n/g, '\n    ').replace(/^{/, '    {');
}

