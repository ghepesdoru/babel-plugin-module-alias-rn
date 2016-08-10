const path = require('path');

const fs = require('fs');

const dirContentsMap = {};

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

function getRootPath(s) {
  if (s.root) {
    return s.root;
  } else if (s.opts) {
    return s.opts.root || '';
  }

  return '';
}

function createFilesMap(state) {
  const result = {};
  const opts = getStateOptions(state);
  const rootPath = getRootPath(opts);
  const map = opts.map;

  map.forEach(m => {
    const expose = m.expose || undefined;
    const src = m.src || undefined;

    if (expose) {
      if (typeof src === 'string') {
        if (!src) {
          // Consider non existing paths as referencing to the root path
          return rootPath;
        }

        result[expose] = path.join(rootPath, src);
      }
    }

    return null;
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

export function mapToRelative(currentFile, module, options) {
  const o = options || {};
  const reactOsFileInfer = !!o.react;
  let from = path.dirname(currentFile);
  let to = path.normalize(module);

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
  if (reactOsFileInfer) {
    return mapForReact(moduleMapped);
  }

  return moduleMapped;
}

export function asAbsolute(currentFile, module, options) {
  const reactOsFileInfer = !!options.react;
  let m = module || options.root;

  if (!path.isAbsolute(m)) {
    m = path.join(options.root, m);
  }

  // throw new Error(`${JSON.stringify(options, null, 2)}`);

  if (reactOsFileInfer) {
    return mapForReact(m);
  }

  return m;
}

export function mapModule(source, file, filesMap, state) {
  const moduleSplit = source.split('/');
  const opts = getStateOptions(state);
  const absolutePaths = !!getRootPath(opts);

  let src;
  while (moduleSplit.length) {
    const m = moduleSplit.join('/');

    if ({}.hasOwnProperty.call(filesMap, m)) {
      src = filesMap[m];
      break;
    }

    moduleSplit.pop();
  }

  if (absolutePaths) {
    if (!src && source[0] !== '.') {
      // Do not break node_modules required by name
      return null;
    }

    if (path.isAbsolute(source)) {
      // After the node is replaced the visitor will be called again.
      // Without this condition these functions will generate a circular loop.
      return null;
    }

    return asAbsolute(
      file,
      moduleSplit.length ?
        source.replace(moduleSplit.join('/'), src) :
        path.join(opts.root, source),
      opts
    );
  }

  if (!moduleSplit.length) {
    // no mapping available
    return null;
  }

  return mapToRelative(
    file,
    source.replace(moduleSplit.join('/'), src),
    opts
  );
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

      const modulePath = mapModule(moduleArg.value, state.file.opts.filename, filesMap, state);
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

      const modulePath = mapModule(moduleArg.value, state.file.opts.filename, filesMap, state);
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
