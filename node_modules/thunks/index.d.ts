// Type definitions for thunks
// Project: https://github.com/thunks/thunks
// Definitions by: zensh <https://github.com/zensh>

// Import: `import * as thunks from 'thunks'`
// Import: `import { thunk, thunks, isGeneratorFn } from 'thunks'`

type primitives = boolean | number | string | Array<any> | Object | void;
type thunkable = ThunkLikeFunction | GeneratorFunction | AsyncFunction | PromiseLike | ToThunk | ToPromise | Generator;
type FunctionWithCallback = FnWithCb0 | FnWithCb1 | FnWithCb2 | FnWithCb3 | FnWithCb4 | FnWithCb5;
type ThunkOptions = ScopeOnerror | ScopeOptions | thunks.Scope

interface Callback {
  (err?: Error, res?: primitives): primitives | thunkable;
}

interface ThunkLikeFunction {
  (fn: Callback): void;
}

interface ThunkFunction<T> {
  (fn?: Callback | GeneratorFunction | AsyncFunction): ThunkFunction<T>;
}

interface NodeCallback {
  (err?: Error, ...args: Array<any>): void;
}
interface FnWithCb0 {
  (callback: NodeCallback): void;
}
interface FnWithCb1 {
  (arg1: any, callback: NodeCallback): void;
}
interface FnWithCb2 {
  (arg1: any, arg2: any, callback: NodeCallback): void;
}
interface FnWithCb3 {
  (arg1: any, arg2: any, arg3: any, callback: NodeCallback): void;
}
interface FnWithCb4 {
  (arg1: any, arg2: any, arg3: any, arg4: any, callback: NodeCallback): void;
}
interface FnWithCb5 {
  (arg1: any, arg2: any, arg3: any, arg4: any, arg5: any, callback: NodeCallback): void;
}

interface ToThunk {
  toThunk(): ThunkLikeFunction;
}

interface ToPromise {
  toPromise(): PromiseLike;
}


interface GeneratorFunction extends Function {
  (err?: Error, res?: primitives): Generator;
}

interface GeneratorFunctionConstructor {
  new (...args: string[]): GeneratorFunction;
  (...args: string[]): GeneratorFunction;
  prototype: GeneratorFunction;
}

interface IteratorResult {
  done: boolean;
  value: primitives | thunkable;
}

interface Generator {
  constructor: GeneratorFunctionConstructor;
  next(value?: primitives | thunkable): IteratorResult;
  throw(err?: Error): IteratorResult;
  return(value?: primitives | thunkable): IteratorResult;
}

interface AsyncFunction extends Function {
  (err?: Error, res?: primitives): Promise<any>;
}

interface AsyncFunctionConstructor {
  new (...args: string[]): AsyncFunction;
  (...args: string[]): AsyncFunction;
  prototype: AsyncFunction;
}

interface PromiseLike {
  then(onfulfilled?: (value: primitives | thunkable) => primitives | thunkable, onrejected?: (reason: Error) => primitives | thunkable): PromiseLike;
}

interface SigStop {
  message: string;
  status: number;
  code: string;
}

interface ScopeOnerror {
  (error: Error): Error | boolean | void;
}

interface ScopeOptions {
  onerror?: ScopeOnerror;
  onstop?: (sig: SigStop) => void;
  debug?: (value: any) => void;
}

interface Thunk {
  <T>(thunkable?: primitives | thunkable): ThunkFunction<T>;
  all<T>(...args: Array<thunkable>): ThunkFunction<T>;
  all<T>(array: Array<thunkable>): ThunkFunction<T>;
  all<T>(object: Object): ThunkFunction<T>;
  seq<T>(...args: Array<thunkable>): ThunkFunction<T>;
  seq<T>(array: Array<thunkable>): ThunkFunction<T>;
  race<T>(...args: Array<thunkable>): ThunkFunction<T>;
  race<T>(array: Array<thunkable>): ThunkFunction<T>;
  persist<T>(thunkable: thunkable): ThunkFunction<T>;
  promise<T>(thunkable: thunkable): Promise<T>;
  thunkify<T>(FnWithCb: FunctionWithCallback): (...args: Array<primitives>) => ThunkFunction<T>;
  lift<T>(fn: (...args: Array<primitives>) => primitives): (...args: Array<thunkable>) => ThunkFunction<T>;
  delay(Time?: number): ThunkFunction<null>;
  stop(message?: string): void;
  cancel(): void;
}

declare function thunks (options?: ThunkOptions): Thunk;
declare namespace thunks {
  export const NAME: string;
  export const VERSION: string;
  export const pruneErrorStack: boolean;
  export const thunk: Thunk;
  export const promise: Thunk["promise"];
  export const thunkify: Thunk["thunkify"];
  export function thunks (options?: ThunkOptions): Thunk;
  export function isGeneratorFn(fn: any): boolean;
  export function isAsyncFn(fn: any): boolean;
  export function isThunkableFn(fn: any): boolean;
  export class Scope {
    constructor(options?: ThunkOptions);
  }
}

export = thunks;
