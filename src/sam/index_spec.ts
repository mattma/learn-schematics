/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Schema as SamOptions } from './schema';


fdescribe('Enum Schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    'my-schematics',
    path.join(__dirname, '../collection.json'),
  );
  const defaultOptions: SamOptions = {
    name: 'foo',
    path: 'bar',
  };

  let appTree: UnitTestTree;
  // beforeEach(() => {
    // appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    // appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  // });

  it('should create an enumeration', () => {
    console.log('hahah');
    const tree = schematicRunner.runSchematic('sam', defaultOptions, appTree);
    const files = tree.files;

    expect(files.indexOf('/bar/foo.ts')).toBeGreaterThanOrEqual(0);
  });

  // it('should create an enumeration', () => {
  //   const tree = schematicRunner.runSchematic('enum', defaultOptions, appTree);
  //   const content = tree.readContent('/projects/bar/src/app/foo.enum.ts');
  //   expect(content).toMatch('export enum Foo {');
  // });
});