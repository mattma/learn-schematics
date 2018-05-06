import { strings, basename, Path, dirname, normalize } from '@angular-devkit/core';

import {
  Rule, SchematicContext, Tree,
  url, apply,
  move, template, branchAndMerge,
  chain, mergeWith
} from '@angular-devkit/schematics';

import { Schema as SamOptions } from './schema';

export interface Location {
  name: string;
  path: Path;
}

export function parseName(path: string, name: string): Location {
  const nameWithoutPath = basename(name as Path);
  const namePath = dirname((path + '/' + name) as Path);

  return {
    name: nameWithoutPath,
    path: normalize('/' + namePath),
  };
}

export default function(options: SamOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const parsedPath = parseName(options.path || '', options.name || '');
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    const files = url('./files');
    const templateUtils = template({
      ...strings,
      ...options,
    });
    const dest = move(parsedPath.path);

    const templateSource = apply(
      files, [
        templateUtils,
        dest,
      ]
    )

    return chain([
      branchAndMerge(
        chain([
          mergeWith(templateSource)
        ])
      )
    ])(tree, context);
  };
}