const path = require('path');

const fs = require('fs');

const dirContentsMap = {};
const regExpMap = {
  react: {
    regexp: new RegExp('auto:', 'g'),
    replace: './'
  },
  npm: {
    regexp: new RegExp('npm:', 'g'),
    replace: ''
  }
};

let lastIn;
let lastOut;

function getStateOptions(s) {
  if (s.opts) {
    if (Array.isArray(s.opts)) {
      return { map: s.opts };
    } else if (!s.opts.map && s.opts.expose) {
      return { map: [s.opts] };
    }

    return s.opts;
  }

  return {};
}

function getRootPath(o) {
  // throw `IGNORE_ABSOLUTE: ${process.env.IGNORE_ABSOLUTE} | root: ${o.root} | ${JSON.stringify(o, null, 2)} | abs: ${path.isAbsolute(o.root || '')}`;
  const root = o.root === './' ? path.resolve(o.root) : o.root;
  return !process.env.IGNORE_ABSOLUTE && root ? root : '';
}

function reactOsFileInfer(s) {
  return s && s.react;
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function createFilesMap(options) {
  const keys = [];
  const contents = {};
  const map = options.map || [];

  map.forEach(m => {
    const expose = m.expose || undefined;
    const src = m.src || undefined;

    if (expose) {
      if (typeof src === 'string') {
        // throw `root ${rootPath} | src: ${src}`;
        // (^config[\/]+|[\/]+config$|[\/]+config[\/]+)

        const escapedExpose = escapeRegExp(expose);

        keys.push(expose);
        contents[expose] = {
          expose,
          regexp: new RegExp(`(^${escapedExpose}$)|(^${escapedExpose}[\/]+)|([\/]+${escapedExpose}[\/]+)|([\/]+${escapedExpose})`),
          value: src
        };
      }
    }

    return null;
  });

  return { keys, contents };
}

function resolve(filename) {
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(process.cwd(), filename);
}

function toPosixPath(modulePath) {
  return modulePath.replace(/\\/g, '/');
}

function toReactPath(base, fileList, o) {
  // TODO: Check if the current file is a directory, if it is check the logic on index.js
  const os = (o || process.env.TARGET_PLATFORM || '').toLowerCase();

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
    return toReactPath(base, fileList, 'desktop');
  } else if (os === 'desktop') {
    // Check for desktop only files
    if (fileList.indexOf(`${base}.desktop.js`) > -1) {
      return `${base}.desktop`;
    }

    // Fallback on web
    return toReactPath(base, fileList, 'web');
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

export function mapForReact(moduleMapped) {
  // moduleMapped =
  const base = path.dirname(moduleMapped);

  // Index files in destination directory once
  if (!dirContentsMap[base]) {
    dirContentsMap[base] = fs.readdirSync(base).map(v => v.toLowerCase());
  }

  // Fix mapped module path
  const newFile = toReactPath(
    path.basename(moduleMapped),
    dirContentsMap[base]
  );

  return `${base}/${newFile}`;
}

function determineContext(fileName, options) {
  const fileData = {
    file: '',
    react: false,
    npm: false
  };

  let arg = fileName;


  Object.keys(regExpMap).forEach(k => {
    if (arg.search(regExpMap[k].regexp) > -1) {
      arg = arg.replace(regExpMap[k].regexp, regExpMap[k].replace);

      if (arg === 'unknown') {
        arg = '';
      } else {
        fileData[k] = true;
      }
    }
  });

  if (arg && arg !== 'unknown') {
    fileData.file = arg;
  }

  fileData.react = fileData.react && options.react;
  return fileData;
}

// Rewrite module path relativelly
export function mapToRelative(moduleFile, constantModulePart, options) {
  const from = resolve(path.dirname(constantModulePart));
  const to = resolve(path.normalize(moduleFile));
  const moduleMapped = toPosixPath(path.relative(from, to));

  // throw JSON.stringify({
  //   from,
  //   to,
  //   moduleMapped,
  //   moduleFile,
  //   constantModulePart,
  //   options
  // }, null, 2);

  // Support React-Native specific require rewrites
  if (reactOsFileInfer(options)) {
    return mapForReact(moduleMapped);
  }

  return moduleMapped;
}

// Adapts a module path to the context of caller
function adaptModulePath(modulePath, state) {
  // const fileName = state.file.opts.filename;
  const options = getStateOptions(state);
  const filesMap = createFilesMap(options);
  const rootPath = getRootPath(options);

  let module = determineContext(modulePath, options);

  // Do not generate infinite cyrcular references on empty nodes
  if (!module.file) {
    return null;
  }

  // Safeguard against circular calls
  if (lastIn === lastOut) {
    return null;
  }

  // Remove relative path prefix before replace
  const absoluteModule = path.isAbsolute(module.file);

  // Try to replace aliased module
  let found = false;
  let constantModulePart;
  filesMap.keys.filter((k) => {
    const d = filesMap.contents[k];
    let idx = module.file.search(d.regexp);

    if (!found && idx > -1) {
      // throw `Found ${d} in ${module.file}`
      // constantModulePart = module.file.slice(0, idx) || './';
      constantModulePart = './';

      if (module.file[idx] === '/') {
        idx += 1;
      }

      const value = d.value[0] === '.' && idx > 0 ? d.value.slice(2) : d.value;
      // const value = d.value;

      // Replace the alias with it's path and continue
      module.file = `${module.file.slice(0, idx) || ''}${value}${module.file.slice(idx + d.expose.length) || ''}`;
      found = true;


      // Revaluate npm and react flags based on the new mapping
      module = determineContext(module.file, options);

      return true;
    }

    return false;
  });

  // Leave NPM modules as resolved, do not remap and ignore wrongfully formatted strings of form require('npm:')
  if (module.npm) {
    return module.file || null;
  }

  // Do not touch direct requires to npm modules (non annotated)
  if (module.file.indexOf('./') !== 0 && module.file.indexOf('/') !== 0) {
    return null;
  }

  // Check if any substitution took place
  if (found) {
    // Module alias substituted
    if (!path.isAbsolute(module.file)) {
      if (!absoluteModule && module.file[0] !== '.') {
        // Add the relative notation back
        module.file = `./${module.file}`;
      }
    }
  }

  // Do not break node_modules required by name
  if (!found && module.file[0] !== '.') {
    if (reactOsFileInfer(options)) {
      const aux2 = mapForReact(module.file);

      if (aux2 !== module.file) {
        return aux2;
      }
    }

    return null;
  }

  // Enforce absolute paths on absolute mode
  if (rootPath) {
    if (!path.isAbsolute(module.file)) {
      module.file = path.join(rootPath, module.file);

      if (reactOsFileInfer(options)) {
        return mapForReact(module.file);
      }

      return module.file;
    }

    // After the node is replaced the visitor will be called again.
    // Without this condition these functions will generate a circular loop.
    return null;
  }

  // throw `Gets here: ${JSON.stringify(module.file)}`;

  // Do not bother with relative paths that are not aliased
  if (!found) {
    return null;
  }

  let moduleMapped = mapToRelative(module.file, constantModulePart, options);
  if (moduleMapped.indexOf('./') !== 0) {
    moduleMapped = `./${moduleMapped}`;
  }

  // throw JSON.stringify({
  //   moduleMapped, modulePath, module, constantModulePart
  // }, null, 2);
  return moduleMapped !== modulePath ? moduleMapped : null;
}

// Safeguard passthrow function remembers last input and generated output
export function mapModule(modulePath, state) {
  lastIn = `${modulePath}${JSON.stringify(state)}${process.env.IGNORE_ABSOLUTE}`;
  const out = adaptModulePath(modulePath, state);
  lastOut = `${out}${JSON.stringify(state)}${process.env.IGNORE_ABSOLUTE}`;

  // if (out === './test/webpack.dev.config/.config') {
  //   throw `called again`
  // }

  return out;
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
      const modulePath = mapModule(moduleArg.value, state);

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
      const modulePath = mapModule(moduleArg.value, state);

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
