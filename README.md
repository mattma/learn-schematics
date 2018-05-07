# Getting Started With Schematics

This repository is a basic Schematic implementation that serves as a starting point to create and publish Schematics to NPM.

### Testing

To test locally, install `@angular-devkit/schematics` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with
```bash
schematics --help
```

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.

### Publishing

To publish, simply do:

```bash
npm run build
npm publish
```

That's it!

## Reading Materials

```
https://blog.angular.io/schematics-an-introduction-dc1dfbc2a2b2

https://github.com/angular/devkit/tree/master/packages/schematics/angular/enum
```

## Transform JSON2TS

```
https://www.npmjs.com/package/json-schema-to-typescript

./node_modules/.bin/json2ts src/sam/schema.json > src/sam/schema.d.ts
```

## Build the project

```
npm run build

npm link

schematics my-schematics:sam awesome-sir --path dist
```

## Use inside Angular CLI project

```
npm link my-schematics

ng g my-schematics:sam awesome-sause -c my-schematics --path dist
```