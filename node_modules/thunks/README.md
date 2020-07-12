# thunks

A small and magical composer for all JavaScript asynchronous.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![js-standard-style][js-standard-image]][js-standard-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Downloads][downloads-image]][downloads-url]

[中文说明](https://github.com/thunks/thunks/blob/master/docs/api-zh.md)

[thunks 的作用域和异常处理设计](https://github.com/thunks/thunks/blob/master/docs/scope-and-error-catch.md)

## Compatibility

ES5+, support node.js and browsers.

## Summary

- [thunks](#thunks)
  - [Compatibility](#compatibility)
  - [Summary](#summary)
  - [Implementations](#implementations)
  - [What is a thunk](#what-is-a-thunk)
  - [Demo](#demo)
    - [with thunk function](#with-thunk-function)
    - [with async function](#with-async-function)
    - [with generator function](#with-generator-function)
    - [chain, sequential, parallel](#chain-sequential-parallel)
  - [Installation](#installation)
  - [API](#api)
    - [thunks([scope])](#thunksscope)
    - [thunks.pruneErrorStack](#thunkspruneerrorstack)
    - [thunks.onerror(error)](#thunksonerrorerror)
    - [Class thunks.Scope](#class-thunksscope)
    - [thunk(thunkable)](#thunkthunkable)
    - [thunk.all(obj)](#thunkallobj)
    - [thunk.all(thunkable1, ..., thunkableN)](#thunkallthunkable1--thunkablen)
    - [thunk.seq([thunkable1, ..., thunkableN])](#thunkseqthunkable1--thunkablen)
    - [thunk.seq(thunkable1, ..., thunkableN)](#thunkseqthunkable1--thunkablen)
    - [thunk.race([thunkable1, ..., thunkableN])](#thunkracethunkable1--thunkablen)
    - [thunk.race(thunkable1, ..., thunkableN)](#thunkracethunkable1--thunkablen)
    - [thunk.thunkify(fn)](#thunkthunkifyfn)
    - [thunk.lift(fn)](#thunkliftfn)
    - [thunk.promise(thunkable)](#thunkpromisethunkable)
    - [thunk.persist(thunkable)](#thunkpersistthunkable)
    - [thunk.delay(delay)](#thunkdelaydelay)
    - [thunk.stop([message])](#thunkstopmessage)
    - [thunk.cancel()](#thunkcancel)
  - [TypeScript Typings](#typescript-typings)
  - [What functions are thunkable](#what-functions-are-thunkable)
  - [License](#license)

## Implementations

- [Toa](https://github.com/toajs/toa) A powerful web framework rely on thunks.
- [T-man](https://github.com/thunks/tman) Super test manager for JavaScript.
- [thunk-redis](https://github.com/thunks/thunk-redis) The fastest thunk/promise-based redis client, support all redis features.
- [thunk-disque](https://github.com/thunks/thunk-disque) A thunk/promise-based disque client.
- [thunk-stream](https://github.com/thunks/thunk-stream) Wrap a readable/writable/duplex/transform stream to a thunk.
- [thunk-queue](https://github.com/thunks/thunk-queue) A thunk queue for uncertainty tasks evaluation.
- [thunk-loop](https://github.com/thunks/thunk-loop) Asynchronous tasks loop (while (true) { ... }).
- [thunk-mocha](https://github.com/thunks/thunk-mocha) Enable support for generators in Mocha with backward compatibility.
- [thunk-ratelimiter](https://github.com/thunks/thunk-ratelimiter) The fastest abstract rate limiter.
- [thunk-workers](https://github.com/thunks/thunk-workers) Thunk-based task scheduler that executes synchrounous and/or asynchronous tasks under concurrency control.
- [file-cache](https://github.com/thunks/file-cache) Read file with caching, rely on thunks.

And a mountain of applications in server-side or client-side.

## What is a thunk

1. [ALGOL thunks in 1961](https://web.archive.org/web/20190415165418/https://portalparts.acm.org/1070000/1064045/fm/frontmatter.pdf?ip=98.14.66.142)

1. **`thunk`** is a function that encapsulates synchronous or asynchronous code inside.

1. **`thunk`** accepts only one `callback` function as an arguments, which is a CPS function.

1. **`thunk`** returns another **`thunk`** function after being called, for chaining operations.

1. **`thunk`** passes the results into a `callback` function after being excuted.

1. If the return value of `callback` is a **`thunk`** function, then it will be executed first and its result will be sent to another **`thunk`** for excution, or it will be sent to another new **`thunk`** function as the value of the computation.

## Demo

### with thunk function

```js
const thunk = require('thunks')()
const fs = require('fs')

thunk(function (done) {
  fs.stat('package.json', done)
})(function (error, res) {
  console.log(error, res)
})
```

### with async function

```js
thunk(async function () {
  console.log(await Promise.resolve('await promise in an async function'))

  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => reject('catch promise error in async function'), 1000)
    })
  } catch (err) {
    console.log(err)
  }
})()
```

### with generator function

```js
const thunk = require('thunks')()
const fs = require('fs')
const size = thunk.thunkify(fs.stat)

// generator
thunk(function * () {
  // yield thunk function
  console.log(yield size('thunks.js'))
  console.log(yield size('package.json'))

  // yield async function
  console.log(yield async () => 'yield an async function in generator function')

  // yield generator function
  console.log(yield function * () { return 'yield an async function in generator function' })

    // parallel run
  console.log(yield thunk.all([
    size('thunks.js'),
    size('package.json')
  ]))
})()
```

### chain, sequential, parallel

```js
const thunk = require('thunks')()
const fs = require('fs')
const size = thunk.thunkify(fs.stat)

// sequential
size('.gitignore')(function (error, res) {
  console.log(error, res)
  return size('thunks.js')

})(function (error, res) {
  console.log(error, res)
  return size('package.json')

})(function (error, res) {
  console.log(error, res)
})

// sequential
thunk.seq([
  size('.gitignore'),
  size('thunks.js'),
  size('package.json')
])(function (error, res) {
  console.log(error, res)
})

// parallel
thunk.all([
  size('.gitignore'),
  size('thunks.js'),
  size('package.json')
])(function (error, res) {
  console.log(error, res)
})
```

## Installation

**Node.js:**

    npm install thunks

**Bower:**

    bower install thunks

**browser:**

```html
<script src="/pathTo/thunks.js"></script>
```

## API

```js
const thunks = require('thunks')
```

```js
const { thunks, thunk, slice, Scope, isAsyncFn, isGeneratorFn, isThunkableFn } = from 'thunks'
```

### thunks([scope])

Matrix of `thunk`, it generates a `thunkFunction` factory (named `thunk`) with it's scope.
"scope" refers to the running evironments `thunk` generated(directly or indirectly) for all child thunk functions.

1. Here's how you create a basic `thunk`, any exceptions would be passed the next child thunk function:

  ```js
  const thunk = thunks()
  ```

1. Here's the way to create a `thunk` listening to all exceptions in current scope with `onerror`, and it will make sure the exceptions are not being passed to the followed child thunk function, unless `onerror` function returns `true`.

  ```js
  const thunk = thunks(function (error) { console.error(error) })
  ```

  **Equals:**
  ```js
  const scope = new thunks.Scope(function (error) { console.error(error) })
  const thunk = thunks(scope)
  ```

1. Create a `thunk` with `onerror`, `onstop` and `debug` listeners. Results of this `thunk` would be passed to `debug` function first before passing to the followed child thunk function.

  ```js
  const thunk = thunks({
    onstop: function (sig) { console.log(sig) },
    onerror: function (error) { console.error(error) },
    debug: function () { console.log.apply(console, arguments) }
  })
  ```

  **Equals:**
  ```js
  const scope = new thunks.Scope({
    onstop: function (sig) { console.log(sig) },
    onerror: function (error) { console.error(error) },
    debug: function () { console.log.apply(console, arguments) }
  })
  const thunk = thunks(scope)
  ```
The context of `onerror`, `onstop` and `debug` is a `scope`.
Even multiple `thunk` main functions with different scopes are composed,
each scope would be separate from each other,
which means, `onerror`, `onstop` and `debug` would not run in other scopes.

### thunks.pruneErrorStack

Default to `true`, means it will prune error stack message.

### thunks.onerror(error)

Default to `null`, it is a global error handler.

### Class thunks.Scope

```js
const scope = new thunks.Scope({
  onstop: function (sig) { assert.strictEqual(this, scope) },
  onerror: function (error) { assert.strictEqual(this, scope) },
  debug: function () { assert.strictEqual(this, scope) }
})
const thunk = thunks(scope)
```

### thunk(thunkable)

This is the `thunkFunction` factory, to create new `thunkFunction` functions.

The parameter `thunkable` value could be:

1. a `thunkFunction` function, by calling this function a new `thunkFunction` function will be returned

  ```js
  let thunk1 = thunk(1)
  thunk(thunk1)(function (error, value) {
    console.log(error, value) // null 1
  })
  ```

1. a thunkLike function `function (callback) {}`, when called, passes its results to the next `thunkFunction` function

  ```js
  thunk(function (callback) {
    callback(null, 1)
  })(function (error, value) {
    console.log(error, value) // null 1
  })
  ```

1. a Promise object, results of Promise would be passed to a new `thunkFunction` function

  ```js
  let promise = Promise.resolve(1)

  thunk(promise)(function (error, value) {
    console.log(error, value) // null 1
  })
  ```

1. objects which implements the method `toThunk`

  ```js
  let obj = {
    toThunk: function () {
      return function (done) { done(null, 1) }
    }
  }
  // `obj` has `toThunk` method that returns a thunk function
  thunk(obj)(function (error, value) {
    console.log(error, value) // null 1
  })
  ```

1. objects which implement the method `toPromise`

  ```js
  const Rx = require('rxjs')
  // Observable instance has `toPromise` method that returns a promise
  thunk(Rx.Observable.fromPromise(Promise.resolve(123)))(function (error, value) {
    console.log(error, value) // null 123
  })
  ```

1. Generator and Generator Function, like `co`, but `yield` anything

  ```js
  thunk(function * () {
    var x = yield 10
    return 2 * x
  })(function * (error, res) {
    console.log(error, res) // null, 20

    return yield thunk.all([1, 2, thunk(3)])
  })(function * (error, res) {
    console.log(error, res) // null, [1, 2, 3]
    return yield thunk.all({
      name: 'test',
      value: thunk(1)
    })
  })(function (error, res) {
    console.log(error, res) // null, {name: 'test', value: 1}
  })
  ```

1. async/await function

  ```js
  thunk(async function () {
    console.log(await Promise.resolve('await promise in an async function'))

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => reject('catch promise error in async function'), 1000)
      })
    } catch (err) {
      console.log(err)
    }
  })(function * () {
    console.log(yield async () => 'yield an async function in generator function')
  })()
  ```

1. values in other types that would be valid results to pass to a new child thunk function

  ```js
  thunk(1)(function (error, value) {
    console.log(error, value) // null 1
  })

  thunk([1, 2, 3])(function (error, value) {
    console.log(error, value) // null [1, 2, 3]
  })
  ```

You can also run with `this`:

  ```js
  thunk.call({x: 123}, 456)(function (error, value) {
    console.log(error, this.x, value) // null 123 456
    return 'thunk!'
  })(function (error, value) {
    console.log(error, this.x, value) // null 123 'thunk!'
  })
  ```

### thunk.all(obj)

### thunk.all(thunkable1, ..., thunkableN)

Returns a child thunk function.

`obj` can be an array or an object that contains any value. `thunk.all` will transform value to a child thunk function and excute it in parallel. After all of them are finished, an array containing results(in its original order) would be passed to the a new child thunk function.

```js
thunk.all([
  thunk(0),
  function * () { return yield 1 },
  2,
  thunk(function (callback) { callback(null, [3]) })
])(function (error, value) {
  console.log(error, value) // null [0, 1, 2, [3]]
})

thunk.all({
  a: thunk(0),
  b: thunk(1),
  c: 2,
  d: thunk(function (callback) { callback(null, [3]) })
})(function (error, value) {
  console.log(error, value) // null {a: 0, b: 1, c: 2, d: [3]}
})
```

You may also write code like this:

```js
thunk.all.call({x: [1, 2, 3]}, [4, 5, 6])(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] [4, 5, 6]
  return 'thunk!'
})(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] 'thunk!'
})
```

### thunk.seq([thunkable1, ..., thunkableN])

### thunk.seq(thunkable1, ..., thunkableN)

Returns a child thunk function.

`thunkX` can be any value, `thunk.seq` will transform value to a child thunk function and excute it in order. After all of them are finished, an array containing results(in its original order) would be passed to the a new child thunk function.

```js
thunk.seq([
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b')
    }, 100)
  },
  thunk(function (callback) {
    callback(null, 'c')
  }),
  [thunk('d'), function * () { return yield 'e' }], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true])
    flag[2] = true
    callback(null, 'f')
  }
])(function (error, value) {
  console.log(error, value) // null [['a', 'b'], 'c', ['d', 'e'], 'f']
})
```

or

```js
thunk.seq(
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b')
    }, 100)
  },
  thunk(function (callback) {
    callback(null, 'c')
  }),
  [thunk('d'), thunk('e')], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true])
    flag[2] = true
    callback(null, 'f')
  }
)(function (error, value) {
  console.log(error, value) // null [['a', 'b'], 'c', ['d', 'e'], 'f']
})
```

You may also write code like this:

```js
thunk.seq.call({x: [1, 2, 3]}, 4, 5, 6)(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] [4, 5, 6]
  return 'thunk!'
})(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] 'thunk!'
})
```

### thunk.race([thunkable1, ..., thunkableN])

### thunk.race(thunkable1, ..., thunkableN)

Returns a child thunk function with the value or error from one first completed.

### thunk.thunkify(fn)

Returns a new function that would return a child thunk function

Transform a `fn` function which is in Node.js style into a new function.
This new function does not accept a `callback` as an argument, but accepts child thunk functions.

```js
const thunk = require('thunks')()
const fs = require('fs')
const fsStat = thunk.thunkify(fs.stat)

fsStat('thunks.js')(function (error, result) {
  console.log('thunks.js: ', result)
})
fsStat('.gitignore')(function (error, result) {
  console.log('.gitignore: ', result)
})
```

You may also write code with `this`:

```js
let obj = {a: 8}
function run (x, callback) {
  //...
  callback(null, this.a * x)
}

let run = thunk.thunkify.call(obj, run)

run(1)(function (error, result) {
  console.log('run 1: ', result)
})
run(2)(function (error, result) {
  console.log('run 2: ', result)
})
```

### thunk.lift(fn)

`lift` comes from Haskell, it transforms a synchronous function `fn` into a new async function.
This new function will accept `thunkable` arguments, evaluate them, then run as the original function `fn`. The new function returns a child thunk function.

```js
const thunk = require('thunks')()

function calculator (a, b, c) {
  return (a + b + c) * 10
}

const calculatorT = thunk.lift(calculator)

let value1 = thunk(2)
let value2 = Promise.resolve(3)

calculatorT(value1, value2, 5)(function (error, result) {
  console.log(result) // 100
})
```

You may also write code with `this`:

```js
const calculatorT = thunk.lift.call(context, calculator)
```

### thunk.promise(thunkable)

it transforms `thunkable` value to a promise.

```js
const thunk = require('thunks').thunk

thunk.promise(function * () {
  return yield Promise.resolve('Hello')
}).then(function (res) {
  console.log(res)
})
```

### thunk.persist(thunkable)

it transforms `thunkable` value to a persist thunk function, which can be called more than once with the same result(like a promise). The new function returns a child thunk function.

```js
const thunk = require('thunks')()

let persistThunk = thunk.persist(thunk(x))

persistThunk(function (error, result) {
  console.log(1, result) // x
  return persistThunk(function (error, result) {
    console.log(2, result) // x
    return persistThunk
  })
})(function (error, result) {
  console.log(3, result) // x
})
```

You may also write code with `this`:

```js
const persistThunk = thunk.persist.call(context, thunkable)
```

### thunk.delay(delay)

Return a child thunk function, this child thunk function will be called after `delay` milliseconds.

```js
console.log('thunk.delay 500: ', Date.now())
thunk.delay(500)(function () {
  console.log('thunk.delay 1000: ', Date.now())
  return thunk.delay(1000)
})(function () {
  console.log('thunk.delay end: ', Date.now())
})
```

You may also write code with `this`:

```js
console.log('thunk.delay start: ', Date.now())
thunk.delay.call(this, 1000)(function () {
  console.log('thunk.delay end: ', Date.now())
})
```

### thunk.stop([message])

This will stop control flow process with a message similar to Promise's cancelable(not implemented yet). It will throw a stop signal object.
Stop signal is an object with a message and `status === 19`(POSIX signal SIGSTOP) and a special code. Stop signal can be caught by `onstop`, and aslo can be caught by `try catch`, in this case it will not trigger `onstop`.

```js
const thunk = require('thunks')({
  onstop: function (res) {
    if (res) console.log(res.code, res.status, res) // SIGSTOP 19 { message: 'Stop now!' }
  }
})

thunk(function (callback) {
  thunk.stop('Stop now!')
  console.log('It will not run!')
})(function (error, value) {
  console.log('It will not run!', error)
})
```

```js
thunk.delay(100)(function () {
  console.log('Hello')
  return thunk.delay(100)(function () {
    thunk.stop('Stop now!')
    console.log('It will not run!')
  })
})(function (error, value) {
  console.log('It will not run!')
})
```

### thunk.cancel()

This will cancel all control flow process in the current thunk's scope.

## TypeScript Typings

```typescript
import * as assert from 'assert'
import { thunk, thunks, isGeneratorFn } from 'thunks'
// or: import * as thunks from 'thunks'

thunk(function * () {
  assert.strictEqual(yield thunks()(1), 1)
  assert.ok(isGeneratorFn(function * () {}))

  while (true) {
    yield function (done) { setTimeout(done, 1000) }
    console.log('Dang!')
  }
})()
```

## What functions are thunkable

thunks supports so many [thunkable](#thunkthunkable) objects. There are three kind of functions:

- thunk-like function `function (callback) { callback(err, someValue) }`
- generator function `function * () { yield something }`
- async/await function `async function () { await somePromise }`

thunks can't support common functions (non-thunk-like functions). thunks uses `fn.length === 1` to recognize thunk-like functions.

Using a common function in this way will throw an error:

```js
thunk(function () {})(function (err) {
  console.log(1, err) // 1 [Error: Not thunkable function: function () {}]
})

thunk(function (a, b) {})(function (err) {
  console.log(2, err) // 2 [Error: Not thunkable function: function (a, b) {}]
})

thunk(function () { let callback = arguments[0]; callback() })(function (err) {
  console.log(3, err) // 3 [Error: Not thunkable function: function () { let callback = arguments[0]; callback() }]
})

thunk()(function () {
  return function () {} // can't return a non-thunkable function.
})(function (err) {
  console.log(4, err) // 4 [Error: Not thunkable function: function () {}]
})
```

So pay attention to that. **We can't return a non-thunkable function** in thunk. If we return a thunkable function, thunk will evaluate it as an asynchronous task.

## License

thunks is licensed under the [MIT](https://github.com/thunks/thunks/blob/master/LICENSE) license.
Copyright &copy; 2014-2019 thunks.

[npm-url]: https://npmjs.org/package/thunks
[npm-image]: http://img.shields.io/npm/v/thunks.svg

[travis-url]: https://travis-ci.org/thunks/thunks
[travis-image]: http://img.shields.io/travis/thunks/thunks.svg

[coveralls-url]: https://coveralls.io/r/thunks/thunks
[coveralls-image]: https://coveralls.io/repos/thunks/thunks/badge.svg

[downloads-url]: https://npmjs.org/package/thunks
[downloads-image]: http://img.shields.io/npm/dm/thunks.svg?style=flat-square

[js-standard-url]: https://github.com/feross/standard
[js-standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
