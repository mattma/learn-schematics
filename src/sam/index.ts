import { strings, basename, Path, dirname, normalize } from '@angular-devkit/core';
import {
  Rule, SchematicContext, Tree,
  url, apply,
  move, template, branchAndMerge,
  chain, mergeWith, noop, filter,
} from '@angular-devkit/schematics';

/**
 * import { externalSchematic } from '@angular-devkit/schematics';
 *
 * externalSchematic:  Run a schematic from a separate collection.
 * @param collectionName The name of the collection that contains the schematic to run.
 * @param schematicName The name of the schematic to run.
 * @param options The options to pass as input to the RuleFactory.
 * externalSchematic(collectionName: string, schematicName: string, options: OptionT): Rule;
 *
 * ex:
 * externalSchematic('@schematics/angular', 'service-worker', options)(host, context);
 */

/**
 * import { schematic } from '@angular-devkit/schematics';
 *
 * schematic: Run a schematic from the same collection.
 * @param schematicName The name of the schematic to run.
 * @param options The options to pass as input to the RuleFactory.
 * schematic<OptionT extends object>(schematicName: string, options: OptionT): Rule;
 *
 * ex:
 *    schematic('component', {
        name: 'app',
        selector: appRootSelector,
        flat: true,
        path: sourceDir,
        skipImport: true,
        project: options.name,
        ...componentOptions,
      }),
 */

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

// Function returns a Rule, which is a transformation from a Tree to another Tree.

// Rule: A function that applies actions to a Tree. It returns a new Tree that will
// contain all transformations to be applied.
export default function(options: SamOptions): Rule {
  // Tree: A staging area for changes, containing the original file system, and a list
  // of changes to apply to it.
  return (tree: Tree, context: SchematicContext) => {
    const parsedPath = parseName(options.path || '', options.name || '');
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    // Provided Sources:  `url(url: string)`
    // url(): Loads a list of files from a URL and returns a Tree with the files as
    // CreateAction applied to an empty Tree
    const files = url('./files');

    // Provided Rules: `template<T>(options: T)`
    // template(): Apply both path and content templates to the entire Tree.
    const templateRules = template({
      ...strings,
      ...options,
    });

    // Provided Rules `move(root: string)`
    // move(): Moves all the files from the input to a subdirectory.
    const dest = move(parsedPath.path);

    // Source: A function that creates an entirely new Tree from an empty filesystem.
    // ex: a file source could read files from disk and create a Create Action
    // for each of those.
    // Provided Sources:  `apply(source: Source, rules: Rule[])`
    // apply(): Apply a list of rules to a source, and return the result.
    const templateSource = apply(files, [
      // noop(): Returns the input Tree as is.
      //
      // filter(predicate: FilePredicate<boolean>)
      // Returns the input Tree with files that do not pass the FilePredicate.
      options.spec ? noop() : filter(path => !path.endsWith('.spec.ts')),
      templateRules,
      dest,
    ]);

    // Provided Rules: `chain(rules: Rule[])`
    // chain(): Returns a Rule that's the concatenation of other rules.
    return chain([
      // `branchAndMerge(rule: Rule, strategy = MergeStrategy.Default): Rule`
      branchAndMerge(
        chain([
          // Rule base: `mergeWith(source: Source, strategy: MergeStrategy = MergeStrategy.Default): Rule`
          // mergeWith(): Merge an input tree with the source passed in.
          mergeWith(templateSource)
        ])
      )
    ])(tree, context);
  };
}