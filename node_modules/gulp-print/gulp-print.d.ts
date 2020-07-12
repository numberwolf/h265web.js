/// <reference types="node" />
import * as stream from 'stream';
export interface FormatFunction {
    (filepath: string): string;
}
export interface LogFunction {
    (message: string): void;
}
export declare function setLogFunction(fn: LogFunction): void;
export default function gulpPrint(format?: FormatFunction): stream.Stream;
