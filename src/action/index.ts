import {
  strings
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

import { findNodes, insertAfterLastOccurrence } from '../utils/ast-utils';
import { parseName } from '../utils/parse-name';

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
  const fnName = strings.underscore(options.name);
  return `
@app.route('/${routeName}')
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
    // Get All nodes from modulePath
    const nodes = findNodes(source, ts.SyntaxKind.EndOfFileToken);

    // Insert the last Occurrence
    const contentChange: any = insertAfterLastOccurrence(nodes, toInsert, modulePath, 0);

    // Create recoderer and prepare for the updates
    const recorder = tree.beginUpdate(modulePath);
    // Insert the content into recorder
    recorder.insertLeft(contentChange.pos, contentChange.toAdd);
    // Commit the actual changes
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
