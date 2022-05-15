# babel-plugin-debug
手写一个根据环境不同而移除代码的babel插件，环境可自定义。

> ## 前言
需要提前学习的知识：
- [babel原理及插件开发](https://juejin.cn/post/6844903603983892487)
- [实时解析和查看JavaScript 的AST的在线工具](https://astexplorer.net/)

### 1、访问者模式
Babel 插件的设计遵循访问者（Visitor）模式

当 Babel 处理一个节点时，是以访问者的形式获取节点信息，并进行相关操作，这种方式是通过一个`visitor`对象来完成的。在 visitor 对象中定义了对于各种节点的访问函数，这样就可以针对不同的节点做出不同的处理。

我们编写的 Babel 插件其实也是通过定义一个`实例化visitor对象`处理一系列的`AST`节点，来完成我们对代码的修改操作。

### 2、@babel/core
babel的编译器。其被拆分三个模块：`@babel/parser`、`@babel/traverse`、`@babel/generator`

- `@babel/parser`：接受源码，进行词法分析、语法分析，生成`AST`。
- `@babel/traverse`：接受一个`AST`，并对其遍历，根据`preset`、`plugin`进行逻辑处理，进行替换、删除、添加节点。
- `@babel/generator`：接受最终生成的`AST`，并将其转换为代码字符串，同时此过程也可以创建`source map`。

babel转码流程：`input string` -> `@babel/parser parser` -> `AST` -> `transformer[s]` -> `AST` -> `@babel/generator` -> `output string`。

> ## 启动
开发babel插件必须的开发包安装如下：
```
npm i @babel/core -D
```
安装好后运行`test.js`即可
> ## 源码讲解
`test.js`文件中是整体逻辑代码
- `const content = ...` ：要转换的代码
- `transformSync()`：转换传入的代码。返回包含生成的代码、源映射和AST的对象。
代码如下：
```
const { transformSync } = require("@babel/core");

// 要转换的代码
const content = `
    console.log("我不受影响");

    if (DEBUG) {
        // 1、在 dev 环境下执行
        // 2、到了 prod 环境下代码被移除
        const a = 1;
        const b = 2;
        console.log(a + b);
    }
`

const babelConfig = {
    plugins: [
        [
            "./index.js",
            {
                env: "production" // 配置什么环境下移除 DEBUG 块代码
            }
        ]
    ]
}
const output = transformSync(content, babelConfig);

console.log(output); // 打印转换结果
```

`index.js`文件是对转换的具体实现
```
module.exports = function ({types: t}) {
    return {
        visitor: {
            Identifier(path) {
                // 程序不识别未声明的 DEBUG ，所以要将 DEBUG 转为 "DEBUG"
                const parentNodeIsIfStatement = t.isIfStatement(path.parent);
                const isDebug = path.node.name === "DEBUG";

                if (isDebug && parentNodeIsIfStatement) {
                    // 把 Identifier 转换成 string
                    const stringNode = t.StringLiteral("DEBUG");
                    path.replaceWith(stringNode);
                }
            },

            StringLiteral(path, state) {
                const parentNodeIsIfStatement = t.isIfStatement(path.parent);
                const isDebug = path.node.value === "DEBUG";

                if(isDebug && parentNodeIsIfStatement) {
                    // 控制 env 是什么环境下来移除
                    if (process.env.NODE_ENV === state.opts.env) {
                        path.parentPath.remove();
                    }
                }
            }
        }
    }
}
```
> ## 运行结果
因为设置了`env: "production"`，所以当前环境是`production`时，转换结果为
```
console.log("我不受影响");
```
如果当前环境不是`production`，结果如下，丝毫不影响
```
console.log("我不受影响");

if (DEBUG) {
    // 1、在 dev 环境下执行
    // 2、到了 prod 环境下代码被移除
    const a = 1;
    const b = 2;
    console.log(a + b);
}
```
> ## ESLint
如果你使用`ESLint`，你必须把`DEBUG`添加到`eslint.config.js`下的`globals `
```
module.exports = {
    globals: {
        DEBUG: true
    }
}
```
> ## 使用
将开发的`babel-plugin-debug`插件添加到`babel.config.js`中
```
module.exports = {
    plugins: ["./index.js"] // 使用编写的插件
}
```
