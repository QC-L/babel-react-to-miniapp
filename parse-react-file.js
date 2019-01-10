const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse');
const t = require('@babel/types');
const fs = require('fs');
const reactStr = fs.createReadStream('./index.js', { encoding: 'utf8' });

reactStr.on('data', (chunk) => {
  let obj = babelParser.parse(chunk, {
    sourceType: 'module',
    plugins: [
      "jsx",
      "flow"
    ]
  });
  console.dir(obj, {
    depth: null,
    colors: true
  });
  console.log(traverse);
  traverse(obj, {
    enter(path) {
      if (t.isIdentifier(path.node, { name: "x" })) {
        path.node.name = "x";
      }
    }
  });
  const stream = fs.createWriteStream('./result.json');
  stream.write(JSON.stringify(obj), 'utf8');
  stream.end();
  stream.on('error', (error) => {
    console.error(error);
  });
});
