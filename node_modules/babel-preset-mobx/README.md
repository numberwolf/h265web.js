# babel-preset-mobx

> Babel preset for ES features commonly used with [mobx](https://mobx.js.org/)

This preset includes the following plugins:

* `transform-decorators-legacy`
* `transform-class-properties`
* `transform-es2015-classes`
* `transform-regenerator`

In order to use async/generator functions, you will need to add
[`babel-polyfill`](https://babeljs.io/docs/usage/polyfill/) or
[`regenerator-runtime`](https://github.com/facebook/regenerator/tree/master/packages/regenerator-runtime)
to your `dependencies` (note: that's not `devDependencies`, as it's needed at
runtime).

## Install

```sh
$ npm install --save-dev babel-preset-mobx
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "presets": ["mobx"]
}
```

### Via CLI

```sh
$ babel script.js --presets mobx
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  presets: ["mobx"]
});
```
