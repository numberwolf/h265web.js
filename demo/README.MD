# h265web.js

#### Begin

```javascript
const H265webjs = require('h265web.js');
```

#### Use it!

* Step 1: use npm install package, or clone it from github:https://github.com/numberwolf/h265web.js

> `"h265web.js": "^1.0.0"`


```bash
npm install h265web.js
```

* Step 2: move assets、wasm files to dist

```bash
mkdir dist
cp node_modules/h265web.js/src/decoder/missile.wasm dist/
cp node_modules/h265web.js/src/demuxer/missilets.wasm dist/
cp -r node_modules/h265web.js/src/assets dist/
```

* Step 3: Add it！

###### create your javascript file

```bash
touch dist/play.js
```

###### write with h265web.js

> See demo with `index.html` `play.js`

```javascript
const H265webjs = require('h265web.js');
```









