import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * Transformer modifies import and export paths to ensure they point to the correct files
 */
const transformer = (context: ts.TransformationContext) => {
  return (sourceFile: ts.SourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (
        ts.isImportDeclaration(node) ||
        ts.isExportDeclaration(node) ||
        ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        return ts.visitEachChild(node, pathVisitor.bind(this, context, sourceFile), context);
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor, ts.isSourceFile);
  };
};

/**
 * Visits and transforms import and export paths in a .ts or .tsx files
 *
 * @param context
 * @param sourceFile
 * @param node
 */
const pathVisitor = (
  context: ts.TransformationContext, sourceFile: ts.SourceFile, node: ts.Node
): ts.Node => {
  if (!ts.isStringLiteral(node)) {
    return ts.visitEachChild(node, pathVisitor.bind(this, context, sourceFile), context);
  }

  const moduleSpecifier = node.getText().replace(/(^['"])|(['"]$)/g, '');

  if (path.extname(moduleSpecifier)) {
    return node;
  }

  const compilerOpts = context.getCompilerOptions();
  const absolutePath = getAbsolutePath(sourceFile, compilerOpts, moduleSpecifier);

  if (absolutePath == null) {
    return node;
  }

  return resolvePath(absolutePath, `.${path.sep}${path.relative(path.dirname(sourceFile.fileName), absolutePath)}`) ?? node;
};

/**
 * Resolves the path of a .ts/.tsx file to its corresponding .js/.jsx file.
 * This function checks for the existence of the file and returns the appropriate path.
 *
 * @param absolutePath
 * @param relativePath
 */
function resolvePath(absolutePath: string, relativePath: string) {
  if (fs.existsSync(`${absolutePath}.ts`)) {
    return ts.factory.createStringLiteral(`${relativePath}.js`);
  }

  if (fs.existsSync(`${absolutePath}.tsx`)) {
    return ts.factory.createStringLiteral(`${relativePath}.jsx`);
  }

  if (fs.existsSync(`${absolutePath}${path.sep}index.ts`)) {
    return ts.factory.createStringLiteral(`${relativePath}${path.sep}index.js`);
  }

  if (fs.existsSync(`${absolutePath}${path.sep}index.tsx`)) {
    return ts.factory.createStringLiteral(`${relativePath}${path.sep}index.jsx`);
  }
}

/**
 * Resolves an absolute path of a module import/export in a ts file.
 * This function handles both direct paths and paths defined by tsconfig aliases.
 *
 * @param sourceFile
 * @param compilerOpts
 * @param moduleSpecifier
 */
function getAbsolutePath(sourceFile: ts.SourceFile, compilerOpts: ts.CompilerOptions, moduleSpecifier: string) {
  const alias = Object.keys(compilerOpts.paths ?? {}).find((alias) => moduleSpecifier.startsWith(alias.replace(/\/\*$/, '')));

  return alias
    ? absolutePathFromAlias(sourceFile, compilerOpts, moduleSpecifier, alias)
    : absolutePathFromPath(sourceFile, compilerOpts, moduleSpecifier);
}

/**
 * Resolves an absolute path from a given import/export module path.
 * This function handles both relative and baseUrl-based paths.
 *
 * @param sourceFile
 * @param options
 * @param options.baseUrl
 * @param moduleSpecifier
 */
function absolutePathFromPath(
  sourceFile: ts.SourceFile,
  {baseUrl}: ts.CompilerOptions,
  moduleSpecifier: string
) {
  const isRelative = moduleSpecifier.startsWith('.');

  if (!isRelative && !baseUrl) {
    return;
  }

  return baseUrl && !isRelative
    ? path.resolve(baseUrl, moduleSpecifier)
    : path.resolve(path.dirname(sourceFile.fileName), moduleSpecifier);
}

/**
 * Resolves an absolute path from a tsconfig alias.
 * This function finds the root directory containing the tsconfig and resolves the paths alias.
 *
 * @param sourceFile
 * @param options
 * @param moduleSpecifier
 * @param alias
 */
function absolutePathFromAlias(
  sourceFile: ts.SourceFile,
  {paths, baseUrl}: ts.CompilerOptions,
  moduleSpecifier: string,
  alias: string
) {
  let rootDir;
  let currentDir = path.dirname(path.resolve(sourceFile.fileName));

  while (currentDir !== path.parse(currentDir).root) {
    if (fs.readdirSync(currentDir).some((v) => /^tsconfig.*\.json$/.test(v))) {
      rootDir = currentDir;
      break;
    }

    currentDir = path.dirname(currentDir);
  }

  if (!rootDir || !paths?.[alias]) {
    return;
  }

  const aliasPart = /(.+?)\/\*$/.exec(alias)?.[1];

  if (aliasPart == null) {
    return;
  }

  const pathPart = moduleSpecifier.replace(aliasPart, '');
  const normalizedPaths = paths[alias].map((p) => p.replace('/*', pathPart));

  for (const normalizedPath of normalizedPaths) {
    const isRelative = normalizedPath.startsWith('.');

    if (!isRelative && !baseUrl) {
      continue;
    }

    return !isRelative && baseUrl
      ? path.resolve(rootDir, baseUrl, normalizedPath)
      : path.resolve(rootDir, normalizedPath);
  }
}

export default transformer;
