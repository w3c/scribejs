'use strict';

/**
 * Adding a json-ld header to the minutes using schema.org vocabulary items.
 */



function json_ld_header(header, config) {
    const [year, month, day] = header.date.split('-');
    // eslint-disable-next-line max-len
    const url_pattern = (pattern) => pattern.replace(/%YEAR%/g, year).replace(/%MONTH%/g, month).replace(/%DAY%/g, day).replace(/%DATE%/g, header.date);
    const url_string = config.acurlpattern ? `"url": "${url_pattern(config.acurlpattern)}",` : '';

    /** turn a comma separated list into an array of strings. */
    const people_list = (comma_list) => comma_list.split(',').map((name) => name.trim()).filter((name) => name !== '');

    // console.log(JSON.stringify(header, null, 4));
    // console.log('---');
    // The names are in a comma-separated list
    const chairs   = people_list(header.chair);
    const scribes  = people_list(header.scribe);
    // eslint-disable-next-line arrow-body-style
    const present  = [...people_list(header.present), ...people_list(header.guests)].filter((name) => {
        return !(chairs.includes(name) || scribes.includes(name));
    });

    // Turn each of the name list into a string of JSON structures with the appropriate types
    const chairs_structures = chairs.map((chair) => `{
                        "type": "Person",
                        "name": "${chair}"
                    }`).join(',');

    const scribe_structures = scribes.map((scribe) => `{
                        "type": "Person",
                        "name": "${scribe}"
                    }`).join(',');

    const present_structures = present.map((participant) => `{
                "type": "Person",
                "name": "${participant}"
            }`).join(',');

    const retval_start = `{
    "@context": "https://schema.org/",
    "@type": "CreativeWork",`;

    const retval_end = `"name": "${header.meeting} — Minutes",
    "about": "${header.meeting}",
    "dateCreated": "${header.date}",
    "genre": "Meeting Minutes",
    "publisher": {
        "@type": "Organization",
        "name": "World Wide Web Consortium",
        "url": "https://www.w3.org/"
    },
    "recordedAt": {
        "type": "Event",
        "name": "${header.meeting}",
        "startDate": "${header.date}",
        "endDate": "${header.date}",
        "attendee": [
            {
                "type": "OrganizationRole",
                "roleName": "chair",
                "attendee": [
                    ${chairs_structures}
                ]
            },{
                "type": "Role",
                "roleName": "scribe",
                "attendee": [
                    ${scribe_structures}
                ]
            },
            ${present_structures}
        ]
    }
}`;

    let retval;
    if (url_string === undefined) {
        retval = `${retval_start}${retval_end}`;
    } else {
        retval = `${retval_start}
    ${url_string}
    ${retval_end}`;
    }

    return retval;
}

/* -------------------------------------------------------------------------------- */
module.exports = { json_ld_header };
