# QA

> Q: Why i integrated sdk not working in my workspace.

- A: You need check it by open your `devtools` can view your `network` card. If you don't
  see any `wasm` files load. It means you don't import the sdk to your project. If the `wasm` files
  is checked but it still can't work. You can check your browser version. `wasm` can't work on old
  version browser. You can upgrade your browser. Please use `chrome` or `edge`.

> Q: How can i change the player instance viewport?

- A: By default, We offer `PlayerConfig` to control us `player` instance. You can see it provide the `width` and `height`
  you can use it to change your viewProt. Or if you want make it as a fuld layout. you can got the `player instance`
  DOM element. Default way to got the `instance` element is use `document.querySelector(yourInstanceId)`. If you are using
  `Vue` or `React`. you can use `ref` to got them. It's a tips, Please get the instance after `Mounted`. In `vue` you can
  at `Mounted` lifeCycle. Or in `react`'s `useEffect` hook.

> Q: How can i use it torgger with webpack or vite.

- A: Some `out-of-box` tools just like `vue-cli`,`create-react-app` are base on `Webpack`. You can refer to `example_vue` to import.
  If you're using `vite`. you can't load it like `webpack` application. Because `vite` only load `esm`! So you can refer the `vite_vue_ts`

> Q: How can i get the type declaration?

- A: By deafult. If you can using `webpack` to build your application. normal load can get the `typings` support. If you're using vite. You
  should move the `index.d.ts` to your global config :)

> Q: What should i do if can't get help with this guide?

- A: You can create a `ISSUE` to find help :)


