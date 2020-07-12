"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const map = require("map-stream");
const path = require("path");
const fancyLog = require("fancy-log");
const colors = require("ansi-colors");
let log = fancyLog;
function setLogFunction(fn) {
    log = fn;
}
exports.setLogFunction = setLogFunction;
function gulpPrint(format) {
    if (!format) {
        format = (filepath) => filepath;
    }
    function mapFile(file, cb) {
        const filepath = colors.magenta(path.relative(process.cwd(), file.path));
        const formatted = format(filepath);
        if (formatted) {
            log(formatted);
        }
        cb(null, file);
    }
    return map(mapFile);
}
exports.default = gulpPrint;
//# sourceMappingURL=gulp-print.js.map