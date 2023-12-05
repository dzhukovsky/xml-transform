# XML Transform Task
Task to replace tokens with variable values in XML configuration files.

## Syntax
```yml
- task: XmlTransformV1@0
  inputs:
    folderPath: '**/*.nupkg'
    targetFiles: '*.nuspec'
    overrides: 'package.metadata.version = 1.1.1' 
```

## Inputs
### Package or folder
File path to the package or a folder, wildcards are supported. 
For example, **/*.zip. More details about syntax you can find [here](https://github.com/isaacs/node-glob#comparison-to-other-javascript-glob-implementations). 

### Target files
Provide new line separated list of files to substitute values. 
Files names are to be provided relative to the root folder.
More details about syntax you can find [here](https://github.com/isaacs/node-glob#comparison-to-other-javascript-glob-implementations). 

### Overrides
Provide new line separated list of transformation rules.

Single node syntax:
```
node1.childNode1 = value
node1.childNode1:attribute1 = value
[selector].childNode1 = value
[selector].childNode1:attribute1 = value

```

Multiple nodes syntax:
```
node1.childNode1:[0] = value
node1.childNode1:[0]:attribute1 = value
[selector].childNode1:[0] = value
[selector].childNode1:[0]:attribute1 = value
```

For extended selecting rules you can use `[selector]` syntax:

Example:
```
[div > p] = value
[p:contains("hello")] = value
[p.selected] = value
```
More syntax details you can find here [Cheerio - Selecting Elements](https://cheerio.js.org/docs/basics/selecting). 
