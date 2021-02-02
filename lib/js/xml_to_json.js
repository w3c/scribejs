"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_data = void 0;
const xmlParser = require('json-from-xml');
function get_data(xml) {
    return xmlParser.parse(xml);
}
exports.get_data = get_data;
//# sourceMappingURL=xml_to_json.js.map