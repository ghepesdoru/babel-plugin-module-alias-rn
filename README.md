# babel-plugin-module-alias-rn
React and React Native automatic import of most specific file in context. This is a fork of [tleunen - babel-plugin-module-alias module](https://github.com/tleunen/babel-plugin-module-alias) and all basic functionality is the same.

## Configuration options
The new configuration options structure allows specification of extra options. If you don't require any additional functionality over the original babel-plugin-module-alias module, a better choice would be to use that module directly.

If you want to use the module with an old configuration structure, you can still do so. It supports both arrays, single mapping object and structured object.

### **React**
This configuration key determines if react based path substitution will take place while transpiling the code.

### **Root**
This configuration key will determine what would be the absolute path to your desired context that all resources will relate to.

### **Map**
This configuration key will keep all mapping in the same format as before.

## React and React Native
The plugin looks for a **TARGET_PLATFORM** environmental variable to substitute imports or requires paths with the most specific path for the current context.

To enable this functionality you will have to change the configuration format from array to object as follows:

```
{
  react: Boolean,
  root: String,
  map: [
    {
      expose: String,
      src: String
    },
    ...
  ]
}
```

For example in IOS context with an existing Random.mobile.js file and a configuration mapping components to a path of './src/components', this import statement
```JS
//
import { Random } from 'autoimport:components/randomness/Random';
```
becomes
```JS
import { Random } from './src/components/randomness/Random.mobile'
```
