#!/usr/bin/env node
/**
 * ## RSSAgent IRC logs' RDF version converted into textual format.
 *
 * The issue: in some cases the W3C CVS server goes wrong and the textual dump of RSSAgent does is not committed (but the RDF version is). This tool converts the
 * RDF version into a text version, compatible with what the RSSAgent does. The resulting file can then processed via scribejs as usual.
 *
 * @version: 2.0.1
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 *
 * @packageDocumentation
 */

import * as xml_to_json from './lib/js/xml_to_json';
import * as fs from 'fs';


/**
 * Convert the RDF version of the logs into a textual one.
 *
 * @param rdf The file name of the rdf version
 * @returns the log in textual format as a single long string.
 */
function get_log_from_rdf(rdf: string): string {
    const get_hour_stamp = (h: string): string => {
        //split the full time with ':' and throw away the first item
        const hours = h.split(':').slice(1);
        // return the hours but removing the 'Z' at the end
        return `${hours[0]}:${hours[1].slice(0,2)}:00`
    }

    const rdf_log: string = fs.readFileSync(rdf, 'utf-8');
    const js_log: any = xml_to_json.get_data(rdf_log);
    const chat_events = js_log["foaf:ChatChannel"]["foaf:chatEventList"]["rdf:Seq"]["rdf:li"];

    const log: string[] = chat_events.map((chat_event: any): string => {
        const date: string = get_hour_stamp(chat_event["foaf:chatEvent"]["dc:date"]);
        const irc_nick: string = chat_event["foaf:chatEvent"]["dc:creator"]["wn:Person"]["foaf:nick"];
        const irc_content: string = chat_event["foaf:chatEvent"]["dc:description"];
        return `${date} <${irc_nick}> ${irc_content}`;
    });
    return log.join('\n');
}

if (process.argv.length < 3) {
    console.error('No data file provided')
} else {
    console.log(get_log_from_rdf(process.argv[2]));
}
