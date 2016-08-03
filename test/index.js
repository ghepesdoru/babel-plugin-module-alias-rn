/* eslint-env mocha */
import path from 'path';
import assert from 'assert';
import { transform } from 'babel-core'; // eslint-disable-line import/no-extraneous-dependencies
import plugin, { mapToRelative } from '../src';

describe('Babel plugin module alias', () => {
    const transformerOpts = {
        plugins: [
            [plugin, [{
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
            }]]
        ]
    };

    describe('should alias a known path', () => {
        describe('using a simple exposed name', () => {
            describe('when requiring the exact name', () => {
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

            describe('when requiring a sub file of the exposed name', () => {
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
        });

        describe('using a "complex" exposed name', () => {
            describe('when requiring the exact name', () => {
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

            describe('when requiring a sub file of the exposed name', () => {
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
        });
    });

    describe('should not alias a unknown path', () => {
        describe('when requiring a node module', () => {
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

        describe('when requiring a specific un-mapped file', () => {
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
    });

    describe('should map to relative path when cwd has been changed', () => {
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

    describe('should support remapping to node modules with "npm:"', () => {
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

    describe('should support remapping to fit React integration', () => {
        describe('with a require statement', () => {
            const code = 'var concrete = require("autoimport:mock/test")';
            let result;

            process.env.REACT_NATIVE = true;

            it('Suffixless - test.js', () => {
                process.env.REACT_NATIVE_ENV = '';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test");');
            });

            it('Mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'mobile';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
            });

            it('IOS missed due to mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'ios';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
            });

            it('Android missed due to mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'android';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
            });

            it('Windows missed due to mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'windows';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.mobile");');
            });

            it('IOS targeted - test.ios.js', () => {
                process.env.REACT_NATIVE_ENV = 'ios';
                result = transform('var concrete = require("autoimport:mock/test.ios")', transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.ios");');
            });

            it('Android targeted - test.android.js', () => {
                process.env.REACT_NATIVE_ENV = 'android';
                result = transform('var concrete = require("autoimport:mock/test.android")', transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.android");');
            });

            it('Windows targeted - test.windows.js', () => {
                process.env.REACT_NATIVE_ENV = 'windows';
                result = transform('var concrete = require("autoimport:mock/test.windows")', transformerOpts);
                assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.windows");');
            });

            it ('Desktop targeted - test.desktop.js', () => {
              process.env.REACT_NATIVE_ENV = 'desktop';
              result = transform('var concrete = require("autoimport:mock/test.desktop")', transformerOpts);
              assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.desktop");');
            });

            it('Web targeted - test.web.js', () => {
              process.env.REACT_NATIVE_ENV = 'web';
              result = transform('var concrete = require("autoimport:mock/test.web")', transformerOpts);
              assert.strictEqual(result.code, 'var concrete = require("./test/mock/test.web");');
            });

            it('Falling throw all cases to suffixless from IOS - fallback.js', () => {
              process.env.REACT_NATIVE_ENV = 'ios';
              result = transform('var concrete = require("autoimport:mock/fallback")', transformerOpts);
              assert.strictEqual(result.code, 'var concrete = require("./test/mock/fallback");');
            });
        });

        describe('with an import statement', () => {
            const code = 'import { concrete } from "autoimport:mock/test"';
            let result;

            process.env.REACT_NATIVE = true;

            it('Suffixless - test.js', () => {
                process.env.REACT_NATIVE_ENV = '';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test";');
            });

            it('Mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'mobile';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
            });

            it('IOS missed due to mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'ios';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
            });

            it('Android missed due to mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'android';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
            });

            it('Windows missed due to mobile - test.mobile.js', () => {
                process.env.REACT_NATIVE_ENV = 'windows';
                result = transform(code, transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.mobile";');
            });

            it('IOS targeted - test.ios.js', () => {
                process.env.REACT_NATIVE_ENV = 'ios';
                result = transform('import { concrete } from "autoimport:mock/test.ios";', transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.ios";');
            });

            it('Android targeted - test.android.js', () => {
                process.env.REACT_NATIVE_ENV = 'android';
                result = transform('import { concrete } from "autoimport:mock/test.android";', transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.android";');
            });

            it('Windows targeted - test.windows.js', () => {
                process.env.REACT_NATIVE_ENV = 'windows';
                result = transform('import { concrete } from "autoimport:mock/test.windows";', transformerOpts);
                assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.windows";');
            });

            it ('Desktop targeted - test.desktop.js', () => {
              process.env.REACT_NATIVE_ENV = 'desktop';
              result = transform('import { concrete } from "autoimport:mock/test.desktop";', transformerOpts);
              assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.desktop";');
            });

            it('Web targeted - test.web.js', () => {
              process.env.REACT_NATIVE_ENV = 'web';
              result = transform('import { concrete } from "autoimport:mock/test.web";', transformerOpts);
              assert.strictEqual(result.code, 'import { concrete } from "./test/mock/test.web";');
            });

            it('Falling throw all cases to suffixless from IOS - fallback.js', () => {
              process.env.REACT_NATIVE_ENV = 'ios';
              result = transform('import { concrete } from "autoimport:mock/fallback";', transformerOpts);
              assert.strictEqual(result.code, 'import { concrete } from "./test/mock/fallback";');
            });
        });
    });
});
