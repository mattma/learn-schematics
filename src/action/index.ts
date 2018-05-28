import {
  strings,
  basename,
  Path,
  dirname,
  normalize,
} from '@angular-devkit/core';
import {
  Rule,
  SchematicsException,
  branchAndMerge,
  chain,
  Tree,
  SchematicContext,
} from '@angular-devkit/schematics';
import * as ts from 'typescript';

import { Schema as ActionOptions } from './schema';
import { InsertChange } from '../utils/change';

export interface Location {
  name: string;
  path: Path;
}

export function parseName(path: string, name: string): Location {
  const nameWithoutPath = basename(name as Path);
  const namePath = dirname((path + '/' + name) as Path);

  return {
    name: nameWithoutPath,
    path: normalize('/' + namePath)
  };
}

/**
 * Get all the nodes from a source.
 * @param sourceFile The source file object.
 * @returns {Observable<ts.Node>} An observable of all the nodes in the source.
 */
export function getSourceNodes(sourceFile: ts.SourceFile): ts.Node[] {
  const nodes: ts.Node[] = [sourceFile];
  const result = [];

  while (nodes.length > 0) {
    const node = nodes.shift();

    if (node) {
      result.push(node);
      if (node.getChildCount(sourceFile) >= 0) {
        nodes.unshift(...node.getChildren());
      }
    }
  }

  return result;
}

/**
 * Find all nodes from the AST in the subtree of node of SyntaxKind kind.
 * @param node
 * @param kind
 * @param max The maximum number of items to return.
 * @return all nodes of kind, or [] if none is found
 */
export function findNodes(node: ts.Node, kind: ts.SyntaxKind, max = Infinity): ts.Node[] {
  if (!node || max == 0) {
    return [];
  }

  const arr: ts.Node[] = [];
  if (node.kind === kind) {
    arr.push(node);
    max--;
  }
  if (max > 0) {
    for (const child of node.getChildren()) {
      findNodes(child, kind, max).forEach(node => {
        if (max > 0) {
          arr.push(node);
        }
        max--;
      });

      if (max <= 0) {
        break;
      }
    }
  }

  return arr;
}

export function findNode(node: ts.Node, kind: ts.SyntaxKind, text: string): ts.Node | null {
  if (node.kind === kind && node.getText() === text) {
    // throw new Error(node.getText());
    return node;
  }

  let foundNode: ts.Node | null = null;
  ts.forEachChild(node, childNode => {
    foundNode = foundNode || findNode(childNode, kind, text);
  });

  return foundNode;
}

/**
 * Helper for sorting nodes.
 * @return function to sort nodes in increasing order of position in sourceFile
 */
function nodesByPosition(first: ts.Node, second: ts.Node): number {
  return first.getStart() - second.getStart();
}

function readIntoSourceFile(host: Tree, modulePath: string): ts.SourceFile {
  const text = host.read(modulePath);

  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }
  const sourceText = text.toString('utf-8');

  return ts.createSourceFile(
    modulePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );
}

const getContent = (options: ActionOptions) => {
  const routeName = strings.dasherize(options.name);
  const fnName = strings.classify(options.name);
  return `
@app.route('${routeName}')
def ${fnName}():
  response = Response(
    json.dumps(${routeName}), status=200, mimetype=JSON_MIME_TYPE)
  return response
`;
};

function fileUpdate(options: ActionOptions): Rule {
  return (tree: Tree) => {
    const toInsert = getContent(options);

    // Commit into the source
    // Get the content of input source file (options.path)
    const modulePath = `${(<{ path: string }>options).path}`;
    const source = readIntoSourceFile(tree, modulePath);
    const nodes = findNodes(source, ts.SyntaxKind.EndOfFileToken);
    const lastItem = nodes.sort(nodesByPosition).pop();
    if (!lastItem) {
      throw new Error();
    }

    const contentChange = new InsertChange(modulePath, lastItem.getEnd(), toInsert);
    const recorder = tree.beginUpdate(modulePath);

    recorder.insertLeft(contentChange.pos, contentChange.toAdd);

    tree.commitUpdate(recorder);

    return tree;
  };
}

export default function(options: ActionOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const parsedPath = parseName(options.path || '', options.name || '');
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    return chain([
      branchAndMerge(
        chain([
          fileUpdate(options)
        ])
      )
    ])(tree, context);
  };
}
