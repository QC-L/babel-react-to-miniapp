const operationStr = `(add 4 (subtract 5 3))`;
console.log('原代码字符串: ', operationStr);
function tokenizer(input) {
  var current = 0;
  var tokens = [];

  while(current < input.length) {
    var char = input[current];

    // 判断左括号
    if (char === '(') {
      var token = {
        type: 'paren',
        value: char
      }
      tokens.push(token);
      current++;
      continue;
    }
    // 判断右括号
    if (char === ')') {
      var token = {
        type: 'paren',
        value: char
      }
      tokens.push(token);
      current++;
      continue;
    }
    // 判断是否为空格
    var WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }
    // 当遇到数字时, 从这里开始
    var NUMBER = /[0-9]/;
    if (NUMBER.test(char)) {
      var value = '';
      while(NUMBER.test(char)) {
        value += char;
        char = input[++current];
      }

      var token = {
        type: 'number',
        value: value
      }
      tokens.push(token);
      continue;
    }

    var LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      var value = '';
      while(LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }
      var token = {
        type: 'name',
        value: value
      }
      tokens.push(token);
      continue;
    }
    throw new Error('I dont know what this character is: ' + char);
  }
  return tokens;
}

// var tokens = tokenizer(operationStr);
// console.log('生成的词法数组为：');
// console.log(tokens);

// 生成 AST
function parser(tokens) {
  let current = 0;
  function walk() {
    let token = tokens[current];
    if (token.type === 'number') {
      current++;
      return {
        type: 'NumberLiteral',
        value: token.value
      }
    }

    if (token.type === 'string') {
      current++;
      return {
        type: 'StringLiteral',
        value: token.value
      }
    }

    if (
      token.type === 'paren' && 
      token.value === '('
    ) {
      token = tokens[++current];

      let node = {
        type: 'CallExpression',
        name: token.value,
        params: []
      }

      token = tokens[++current];
      while(
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        node.params.push(walk());
        token = tokens[current];
      }

      current++;
      return node;
    }
    throw new TypeError(token.type);
  }

  let ast = {
    type: 'Program',
    body: []
  }

  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

// let ast = parser(tokens);
// console.log('生成的 AST 结构为: ');
// console.dir(ast, {
//   color: true,
//   depth: null
// });

// AST 遍历器
// 访问器模式
function traverser(ast, visitor) {

  function traverseArray(array, parent) {
    array.forEach(function (child) {
      traverseNode(child, parent);
    })
  }

  function traverseNode(node, parent) {
    let method = visitor[node.type];
    if (method && method.enter) {
      method.enter(node, parent);
    }

    switch(node.type) {
      case 'Program':
        traverseArray(node.body, node);
        break;
      case 'CallExpression':
        traverseArray(node.params, node);
        break;
      case 'NumberLiteral':
      case 'StringLiteral': 
        break; 
      default:
        throw new TypeError(node.type);
    }

    if (method && method.exit) {
      method.exit(node, parent);
    }
  }

  traverseNode(ast, null);
}

// 转换器
function transformer(ast) {
  let newAst = {
    type: 'Program',
    body: []
  };

  ast._content = newAst.body;
  traverser(ast, {
    CallExpression: {
      enter(node, parent) {
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name
          },
          arguments: []
        }

        node._content = expression.arguments;

        if (parent.type !== 'CallExpression') {
          expression = {
            type: 'ExpressionStatement',
            expression: expression
          }
        }

        parent._content.push(expression);
      }
    },
    NumberLiteral: {
      enter(node, parent) {
        parent._content.push({
          type: 'NumberLiteral',
          value: node.value
        })
      }
    },
    StringLiteral: {
      enter(node, parent) {
        parent._content.push({
          type: 'StringLiteral',
          value: node.value
        })
      }
    }
  });

  return newAst;
}

// let newAst = transformer(ast);
// console.log('新生成的 AST 结构为: ');
// console.dir(newAst, {
//   color: true,
//   depth: null
// });


function codeGenerator(node) {
  switch (node.type) {
    case 'Program':
      return node.body.map(codeGenerator).join('\n');
    case 'ExpressionStatement':
      return codeGenerator(node.expression) + ';'
    case 'CallExpression':
      return (
        codeGenerator(node.callee) + '(' + node.arguments.map(codeGenerator).join(', ') + ')'
      );
    case 'Identifier':
      return node.name;
    case 'NumberLiteral':
      return node.value;
    case 'StringLiteral':
      return '"' + node.value + '"';
    default:
      throw new TypeError(node.type);
  }
}

function compiler(input) {
  // 词法分析，生成词法结构
  let tokens = tokenizer(input);
  // 生成 AST
  let ast    = parser(tokens);
  // 转译代码，生成新 AST
  let newAst = transformer(ast);
  // 生成新的代码
  let output = codeGenerator(newAst);
  return output;
}

var output = compiler(operationStr);
console.log('转译后的代码: ', output);

function add(a, b) {
  console.log(a, b);
  return a + b;
}

function subtract(a, b) {
  console.log(a, b);
  return a - b;
}

eval(output);
