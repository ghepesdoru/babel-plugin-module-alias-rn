/* eslint-env mocha */
import assert from 'assert';
import path from 'path';
import { transform } from 'babel-core'; // eslint-disable-line import/no-extraneous-dependencies
import plugin, { mapToRelative } from '../src';

describe('Babel plugin module alias', () => {
  const PROJECT_ROOT = path.resolve(__dirname, '..');
  const transformerOpts = {
    plugins: [
      [plugin,
        [
          {
            src: './src/mylib/subfolder/utils',
            expose: 'utils'
          }, {
            src: './src/components',
            expose: 'awesome/components'
          }, {
            src: 'npm:concrete',
            expose: 'abstract'
          }, {
            src: './test/mock',
            expose: 'mock'
          }
        ]
      ]
    ]
  };

  const transformerOptsReact = {
    plugins: [
      [plugin,
        {
          react: true,
          map: [
            {
              src: './src/mylib/subfolder/utils',
              expose: 'utils'
            }, {
              src: './src/components',
              expose: 'awesome/components'
            }, {
              src: 'npm:concrete',
              expose: 'abstract'
            }, {
              src: './test/mock',
              expose: 'mock'
            }
          ]
        }
      ]
    ]
  };

  const transformerOptsAbsolute = {
    plugins: [
      [plugin, {
        root: PROJECT_ROOT,
        map: [
          {
            src: './src/mylib/subfolder/utils',
            expose: 'utils'
          }, {
            src: './src/components',
            expose: 'awesome/components'
          }, {
            src: 'npm:concrete',
            expose: 'abstract'
          }, {
            src: './test/mock',
            expose: 'mock'
          }
        ]
      }]
    ]
  };

  const transformerOptsAbsoluteReact = {
    plugins: [
      [plugin, {
        root: PROJECT_ROOT,
        react: true,
        map: [
          {
            src: './src/mylib/subfolder/utils',
            expose: 'utils'
          }, {
            src: './src/components',
            expose: 'awesome/components'
          }, {
            src: 'npm:concrete',
            expose: 'abstract'
          }, {
            src: './test/mock',
            expose: 'mock'
          }
        ]
      }]
    ]
  };


  describe('should alias a known path', () => {
    describe('using a simple exposed name', () => {
      describe('when requiring the exact name - relative', () => {
        it('with a require statement', () => {
          const code = 'var utils = require("utils");';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'var utils = require("./src/mylib/subfolder/utils");');
        });

        it('with an import statement', () => {
          const code = 'import utils from "utils";';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'import utils from "./src/mylib/subfolder/utils";');
        });
      });

      describe('when requiring the exact name - absolute', () => {
        it('with a require statement', () => {
          const code = 'var utils = require("utils");';
          const result = transform(code, transformerOptsAbsolute);

          assert.strictEqual(result.code, `var utils = require("${PROJECT_ROOT}/src/mylib/subfolder/utils");`);
        });

        it('with an import statement', () => {
          const code = 'import utils from "utils";';
          const result = transform(code, transformerOptsAbsolute);

          assert.strictEqual(result.code, `import utils from "${PROJECT_ROOT}/src/mylib/subfolder/utils";`);
        });
      });


      describe('when requiring a sub file of the exposed name - relative', () => {
        it('with a require statement', () => {
          const code = 'var myUtil = require("utils/my-util-file");';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'var myUtil = require("./src/mylib/subfolder/utils/my-util-file");');
        });

        it('with an import statement', () => {
          const code = 'import myUtil from "utils/my-util-file";';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'import myUtil from "./src/mylib/subfolder/utils/my-util-file";');
        });
      });

      describe('when requiring a sub file of the exposed name - absolute', () => {
        it('with a require statement', () => {
          const code = 'var myUtil = require("utils/my-util-file");';
          const result = transform(code, transformerOptsAbsolute);

          assert.strictEqual(result.code, `var myUtil = require("${PROJECT_ROOT}/src/mylib/subfolder/utils/my-util-file");`);
        });

        it('with an import statement', () => {
          const code = 'import myUtil from "utils/my-util-file";';
          const result = transform(code, transformerOptsAbsolute);

          assert.strictEqual(result.code, `import myUtil from "${PROJECT_ROOT}/src/mylib/subfolder/utils/my-util-file";`);
        });
      });


      describe('using a "complex" exposed name', () => {
        describe('when requiring the exact name - relative', () => {
          it('with a require statement', () => {
            const code = 'var comps = require("awesome/components");';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'var comps = require("./src/components");');
          });

          it('with an import statement', () => {
            const code = 'import comps from "awesome/components";';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'import comps from "./src/components";');
          });
        });

        describe('when requiring the exact name - absolute', () => {
          it('with a require statement', () => {
            const code = 'var comps = require("awesome/components");';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `var comps = require("${PROJECT_ROOT}/src/components");`);
          });

          it('with an import statement', () => {
            const code = 'import comps from "awesome/components";';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `import comps from "${PROJECT_ROOT}/src/components";`);
          });
        });

        describe('when requiring a sub file of the exposed name - relative', () => {
          it('with a require statement', () => {
            const code = 'var myComp = require("awesome/components/my-comp");';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'var myComp = require("./src/components/my-comp");');
          });

          it('with an import statement', () => {
            const code = 'import myComp from "awesome/components/my-comp";';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'import myComp from "./src/components/my-comp";');
          });
        });

        describe('when requiring a sub file of the exposed name - absolute', () => {
          it('with a require statement', () => {
            const code = 'var myComp = require("awesome/components/my-comp");';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `var myComp = require("${PROJECT_ROOT}/src/components/my-comp");`);
          });

          it('with an import statement', () => {
            const code = 'import myComp from "awesome/components/my-comp";';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `import myComp from "${PROJECT_ROOT}/src/components/my-comp";`);
          });
        });
      });

      describe('using a "complex" exposed name', () => {
        describe('when requiring the exact name - relative', () => {
          it('with a require statement', () => {
            const code = 'var comps = require("awesome/components");';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'var comps = require("./src/components");');
          });

          it('with an import statement', () => {
            const code = 'import comps from "awesome/components";';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'import comps from "./src/components";');
          });
        });

        describe('when requiring the exact name - absolute', () => {
          it('with a require statement', () => {
            const code = 'var comps = require("awesome/components");';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `var comps = require("${PROJECT_ROOT}/src/components");`);
          });

          it('with an import statement', () => {
            const code = 'import comps from "awesome/components";';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `import comps from "${PROJECT_ROOT}/src/components";`);
          });
        });

        describe('when requiring a sub file of the exposed name - relative', () => {
          it('with a require statement', () => {
            const code = 'var myComp = require("awesome/components/my-comp");';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'var myComp = require("./src/components/my-comp");');
          });

          it('with an import statement', () => {
            const code = 'import myComp from "awesome/components/my-comp";';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'import myComp from "./src/components/my-comp";');
          });
        });

        describe('when requiring a sub file of the exposed name - absolute', () => {
          it('with a require statement', () => {
            const code = 'var myComp = require("awesome/components/my-comp");';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `var myComp = require("${PROJECT_ROOT}/src/components/my-comp");`);
          });

          it('with an import statement', () => {
            const code = 'import myComp from "awesome/components/my-comp";';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `import myComp from "${PROJECT_ROOT}/src/components/my-comp";`);
          });
        });
      });

      describe('should not alias a unknown path', () => {
        describe('when requiring a node module - relative', () => {
          it('with a require statement', () => {
            const code = 'var otherLib = require("other-lib");';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'var otherLib = require("other-lib");');
          });

          it('with an import statement', () => {
            const code = 'import otherLib from "other-lib";';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'import otherLib from "other-lib";');
          });
        });

        describe('when requiring a node module - absolute', () => {
          it('with a require statement', () => {
            const code = 'var otherLib = require("other-lib");';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, 'var otherLib = require("other-lib");');
          });

          it('with an import statement', () => {
            const code = 'import otherLib from "other-lib";';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, 'import otherLib from "other-lib";');
          });
        });


        describe('when requiring a specific un-mapped file - relative', () => {
          it('with a require statement', () => {
            const code = 'var otherLib = require("./l/otherLib");';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'var otherLib = require("./l/otherLib");');
          });

          it('with an import statement', () => {
            const code = 'import otherLib from "./l/otherLib";';
            const result = transform(code, transformerOpts);

            assert.strictEqual(result.code, 'import otherLib from "./l/otherLib";');
          });
        });

        describe('when requiring a specific un-mapped file - absolute', () => {
          it('with a require statement', () => {
            const code = 'var otherLib = require("./l/otherLib");';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `var otherLib = require("${PROJECT_ROOT}/l/otherLib");`);
          });

          it('with an import statement', () => {
            const code = 'import otherLib from "./l/otherLib";';
            const result = transform(code, transformerOptsAbsolute);

            assert.strictEqual(result.code, `import otherLib from "${PROJECT_ROOT}/l/otherLib";`);
          });
        });
      });

      describe('should map to relative path when cwd has been changed - relative only', () => {
        const cwd = process.cwd();

        before(() => {
          process.chdir('./test');
        });

        after(() => {
          process.chdir(cwd);
        });

        it('with relative filename', () => {
          const currentFile = './utils/test/file.js';
          const result = mapToRelative(currentFile, 'utils/dep');

          assert.strictEqual(result, '../dep');
        });

        it('with absolute filename', () => {
          const currentFile = path.join(process.cwd(), './utils/test/file.js');
          const result = mapToRelative(currentFile, 'utils/dep');

          assert.strictEqual(result, '../dep');
        });
      });

      describe('should support remapping to node modules with "npm:" - relative only', () => {
        it('with a require statement', () => {
          const code = 'var concrete = require("abstract/thing");';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'var concrete = require("concrete/thing");');
        });

        it('with an import statement', () => {
          const code = 'import concrete from "abstract/thing";';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'import concrete from "concrete/thing";');
        });
      });
    });
  });

  describe('should support remapping to fit React integration', () => {
    describe('with a require statement', () => {
      const code = 'var concrete = require("mock/test")';
      let result;

      it('Suffixless - test.js - relative', () => {
        process.env.TARGET_PLATFORM = '';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test");');
      });

      it('Suffixless - test.js - absolute', () => {
        process.env.TARGET_PLATFORM = '';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test");`);
      });

      it('Mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'mobile';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
      });

      it('Mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'mobile';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.mobile");`);
      });

      it('IOS missed due to mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
      });

      it('IOS missed due to mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.mobile");`);
      });

      it('Android missed due to mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
      });

      it('Android missed due to mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.mobile");`);
      });

      it('Windows missed due to mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
      });

      it('Windows missed due to mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.mobile");`);
      });

      it('IOS targeted - test.ios.js - relative', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('var concrete = require("mock/test.ios")', transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.ios");');
      });

      it('IOS targeted - test.ios.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('var concrete = require("mock/test.ios")', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.ios");`);
      });

      it('Android targeted - test.android.js - relative', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform('var concrete = require("mock/test.android")', transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.android");');
      });

      it('Android targeted - test.android.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform('var concrete = require("mock/test.android")', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.android");`);
      });

      it('Windows targeted - test.windows.js - relative', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform('var concrete = require("mock/test.windows")', transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.windows");');
      });

      it('Windows targeted - test.windows.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform('var concrete = require("mock/test.windows")', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.windows");`);
      });

      it('Desktop targeted - test.desktop.js - relative', () => {
        process.env.TARGET_PLATFORM = 'desktop';
        result = transform('var concrete = require("mock/test.desktop")', transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.desktop");');
      });

      it('Desktop targeted - test.desktop.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'desktop';
        result = transform('var concrete = require("mock/test.desktop")', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.desktop");`);
      });

      it('Web targeted - test.web.js - relative', () => {
        process.env.TARGET_PLATFORM = 'web';
        result = transform('var concrete = require("mock/test.web")', transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.web");');
      });

      it('Web targeted - test.web.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'web';
        result = transform('var concrete = require("mock/test.web")', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/test.web");`);
      });

      it('Falling throw all cases to suffixless from IOS - fallback.js - relative', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('var concrete = require("mock/fallback")', transformerOptsReact);
        assert.strictEqual(result.code, 'var concrete = require("./test/mock/fallback");');
      });

      it('Falling throw all cases to suffixless from IOS - fallback.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('var concrete = require("mock/fallback")', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `var concrete = require("${PROJECT_ROOT}/test/mock/fallback");`);
      });
    });

    describe('with an import statement', () => {
      const code = 'import { concrete } from "mock/test"';
      let result;

      process.env.REACT_NATIVE = true;

      it('Suffixless - test.js - relative', () => {
        process.env.TARGET_PLATFORM = '';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test";');
      });

      it('Suffixless - test.js - absolute', () => {
        process.env.TARGET_PLATFORM = '';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test";`);
      });

      it('Mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'mobile';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
      });

      it('Mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'mobile';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.mobile";`);
      });

      it('IOS missed due to mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
      });

      it('IOS missed due to mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.mobile";`);
      });

      it('Android missed due to mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
      });

      it('Android missed due to mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.mobile";`);
      });

      it('Windows missed due to mobile - test.mobile.js - relative', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform(code, transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
      });

      it('Windows missed due to mobile - test.mobile.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform(code, transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.mobile";`);
      });

      it('IOS targeted - test.ios.js - relative', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('import { concrete } from "mock/test.ios";', transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.ios";');
      });

      it('IOS targeted - test.ios.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('import { concrete } from "mock/test.ios";', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.ios";`);
      });

      it('Android targeted - test.android.js - relative', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform('import { concrete } from "mock/test.android";', transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.android";');
      });

      it('Android targeted - test.android.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'android';
        result = transform('import { concrete } from "mock/test.android";', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.android";`);
      });

      it('Windows targeted - test.windows.js - relative', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform('import { concrete } from "mock/test.windows";', transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.windows";');
      });

      it('Windows targeted - test.windows.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'windows';
        result = transform('import { concrete } from "mock/test.windows";', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.windows";`);
      });

      it('Desktop targeted - test.desktop.js - relative', () => {
        process.env.TARGET_PLATFORM = 'desktop';
        result = transform('import { concrete } from "mock/test.desktop";', transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.desktop";');
      });

      it('Desktop targeted - test.desktop.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'desktop';
        result = transform('import { concrete } from "mock/test.desktop";', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.desktop";`);
      });

      it('Web targeted - test.web.js - relative', () => {
        process.env.TARGET_PLATFORM = 'web';
        result = transform('import { concrete } from "mock/test.web";', transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.web";');
      });

      it('Web targeted - test.web.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'web';
        result = transform('import { concrete } from "mock/test.web";', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/test.web";`);
      });

      it('Falling throw all cases to suffixless from IOS - fallback.js - relative', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('import { concrete } from "mock/fallback";', transformerOptsReact);
        assert.strictEqual(result.code, 'import { concrete } from "./test/mock/fallback";');
      });

      it('Falling throw all cases to suffixless from IOS - fallback.js - absolute', () => {
        process.env.TARGET_PLATFORM = 'ios';
        result = transform('import { concrete } from "mock/fallback";', transformerOptsAbsoluteReact);
        assert.strictEqual(result.code, `import { concrete } from "${PROJECT_ROOT}/test/mock/fallback";`);
      });
    });
  });
});
