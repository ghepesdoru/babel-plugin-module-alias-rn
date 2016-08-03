const path = require('path');

const fs = require('fs');

const dirContentsMap = {};

function createFilesMap(state) {
    const result = {};
    const opts = Array.isArray(state.opts)
        ? state.opts
        : [state.opts];

    opts.forEach(moduleMapData => {
        result[moduleMapData.expose] = moduleMapData.src;
    });

    return result;
}

function resolve(filename) {
    if (path.isAbsolute(filename)) return filename;
    return path.resolve(process.cwd(), filename);
}

function toPosixPath(modulePath) {
    return modulePath.replace(/\\/g, '/');
}

function pathFix(os, base, fileList) {
    // throw new Error(`${os} | ${base} | ${fileList}`);
    // Check for mobile substitutions first
    if (['mobile', 'ios', 'android', 'windows'].indexOf(os) > -1) {
        // Check for a mobile file first
        if (fileList.indexOf(`${base}.mobile.js`) > -1) {
            return `${base}.mobile`;
        }

        // Check for OS specific file
        if (fileList.indexOf(`${base}.${os}.js`) > -1) {
            return `${base}.${os}`;
        }

        // Fallback on normal file (web/desktop) for passthrow files
        return pathFix('desktop', base, fileList);
    } else if (os === 'desktop') {
        // Check for desktop only files
        if (fileList.indexOf(`${base}.desktop.js`) > -1) {
            return `${base}.desktop`;
        }

        // Fallback on web
        return pathFix('web', base, fileList);
    } else if (os === 'web') {
      if (fileList.indexOf(`${base}.web.js`) > -1) {
          return `${base}.web`;
      }
    }

    // Suffixless files
    if (fileList.indexOf(`${base}.js`) > -1) {
        return `${base}`;
    }

    return base;
}

export function mapToRelative(currentFile, module, supportReactNative, context) {
    let from = path.dirname(currentFile);
    let to = path.normalize(module);

    const osENV = (process.env.REACT_NATIVE_ENV || '').toLowerCase();

    from = resolve(from);
    to = resolve(to);

    let moduleMapped = path.relative(from, to);

    moduleMapped = toPosixPath(moduleMapped);

    // Support npm modules instead of directories
    if (moduleMapped.indexOf('npm:') !== -1) {
        const [, npmModuleName] = moduleMapped.split('npm:');
        return npmModuleName;
    }

    if (moduleMapped[0] !== '.') moduleMapped = `./${moduleMapped}`;

    // Support React-Native specific require rewrites
    if (process.env.REACT_NATIVE && supportReactNative) {
        const base = path.dirname(moduleMapped);

        // Index files in destination directory once
        if (!dirContentsMap[base]) {
            dirContentsMap[base] = fs.readdirSync(base).map(v => v.toLowerCase());
        }

        // Fix mapped module path
        const newFile = pathFix(
            osENV, path.basename(moduleMapped, 'js'),
            dirContentsMap[base]
        );

        return `${base}/${newFile}`;
    }
    // }

    return moduleMapped;
}

export function mapModule(source, file, filesMap) {
    let supportReactNative = false;

    // Allow React-Native automatic file detection when applies
    if (process.env.REACT_NATIVE) {
      let aux = source.toLowerCase().indexOf('autoimport:');

      if (aux > -1) {
        source = source.slice(supportReactNative + 11);
        supportReactNative = true;
      }
    }

    const moduleSplit = source.split('/');

    let src;
    while (moduleSplit.length) {
        const m = moduleSplit.join('/');
        if ({}.hasOwnProperty.call(filesMap, m)) {
            src = filesMap[m];
            break;
        }
        moduleSplit.pop();
    }

    if (!moduleSplit.length) {
        // no mapping available
        return null;
    }

    const newPath = source.replace(moduleSplit.join('/'), src);
    return mapToRelative(file, newPath, supportReactNative);
}


export default ({ types: t }) => {
    function transformRequireCall(nodePath, state) {
        if (
            !t.isIdentifier(nodePath.node.callee, { name: 'require' }) &&
                !(
                    t.isMemberExpression(nodePath.node.callee) &&
                    t.isIdentifier(nodePath.node.callee.object, { name: 'require' })
                )
        ) {
            return;
        }

        const moduleArg = nodePath.node.arguments[0];
        if (moduleArg && moduleArg.type === 'StringLiteral') {
            const filesMap = createFilesMap(state);
            const modulePath = mapModule(moduleArg.value, state.file.opts.filename, filesMap);
            if (modulePath) {
                nodePath.replaceWith(t.callExpression(
                    nodePath.node.callee, [t.stringLiteral(modulePath)]
                ));
            }
        }
    }

    function transformImportCall(nodePath, state) {
        const moduleArg = nodePath.node.source;
        if (moduleArg && moduleArg.type === 'StringLiteral') {
            const filesMap = createFilesMap(state);
            const modulePath = mapModule(moduleArg.value, state.file.opts.filename, filesMap);
            if (modulePath) {
                nodePath.replaceWith(t.importDeclaration(
                    nodePath.node.specifiers,
                    t.stringLiteral(modulePath)
                ));
            }
        }
    }

    return {
        visitor: {
            CallExpression: {
                exit(nodePath, state) {
                    return transformRequireCall(nodePath, state);
                }
            },
            ImportDeclaration: {
                exit(nodePath, state) {
                    return transformImportCall(nodePath, state);
                }
            }
        }
    };
};
