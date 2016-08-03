# babel-plugin-module-alias-rn
React and React Native automatic import of most specific file in context. This is a fork of [tleunen - babel-plugin-module-alias module](https://github.com/tleunen/babel-plugin-module-alias) and all basic functionality is the same.

## React and React Native
The plugin looks over **REACT_NATIVE** and **REACT_NATIVE_OS** environmental variables to substitute imports or requires paths with the most specific path for the current context.

For example in IOS context with an existing Random.mobile.js file and a configuration mapping components to a path of './src/components', this import statement
```JS
//
import { Random } from 'autoimport:components/randomness/Random';
```
becomes
```JS
import { Random } from './src/components/randomness/Random.mobile'
```
