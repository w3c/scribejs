const xmlParser = require('json-from-xml');

export function get_data(xml) {
    return xmlParser.parse(xml);
}
