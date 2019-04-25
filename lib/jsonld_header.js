'use strict';

/**
 * Adding a json-ld header to the minutes using schema.org vocabulary items.
 *
 * @param {Object} header - the structured used by the converter to generate the header entries
 * @param {Object} config - the general configuration file for the scribejs run
 * @returns {String} - the JSON-LD encoded schema.org metadata of the minutes
 */
function schema_data(header, config) {
    /** turn a comma separated list into an array of strings. */
    const people_list = (comma_list) => comma_list.split(',').map((name) => name.trim()).filter((name) => name !== '');

    // Variables needed to produce the right URL (if the URL pattern is present)
    const [year, month, day] = header.date.split('-');
    // eslint-disable-next-line max-len
    const url_pattern = (pattern) => pattern.replace(/%YEAR%/g, year).replace(/%MONTH%/g, month).replace(/%DAY%/g, day).replace(/%DATE%/g, header.date);

    // Get the different types of participants from the comma separated lists
    const chairs   = people_list(header.chair);
    const scribes  = people_list(header.scribe);
    // eslint-disable-next-line arrow-body-style
    const present  = [...people_list(header.present), ...people_list(header.guests)].filter((name) => {
        return !(chairs.includes(name) || scribes.includes(name));
    });

    // Build up the structures that is then returned as a JSON string
    const schema_metadata = {
        '@context' : 'https://schema.org/',
        '@type'    : 'CreativeWork'
    };

    if (config.acurlpattern) {
        schema_metadata.url = url_pattern(config.acurlpattern);
    }

    schema_metadata.name = `${header.meeting} — Minutes`;
    schema_metadata.about = header.meeting;
    schema_metadata.dateCreated = header.date;
    schema_metadata.genre = 'Meeting Minutes';
    schema_metadata.publisher = {
        '@type' : 'Organization',
        name    : 'World Wide Web Consortium',
        url     : 'https://www.w3.org/'
    };
    schema_metadata.recordedAt = {
        '@type'   : 'Event',
        name      : header.meeting,
        startDate : header.date,
        endDate   : header.date,
        attendee  : [
            {
                '@type'  : 'OrganizationRole',
                roleName : 'chair',
                attendee : chairs.map((chair) => ({
                    '@type' : 'Person',
                    name    : chair
                }))
            },
            {
                '@type'  : 'Role',
                roleName : 'scribe',
                attendee : scribes.map((scribe) => ({
                    '@type' : 'Person',
                    name    : scribe
                }))
            },
            ...present.map((attendee) => ({
                '@type' : 'Person',
                name    : attendee
            }))
        ]
    };
    // Care should be taken to properly indent the data, otherwise jekyll ignores this
    return JSON.stringify(schema_metadata, null, 4).replace(/\n/g, '\n    ').replace(/^{/, '    {');
}

/* -------------------------------------------------------------------------------- */
module.exports = { schema_data };
