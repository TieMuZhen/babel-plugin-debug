# babel-plugin-debug
手写一个根据环境不同而移除代码的babel插件，环境可自定义。

> ## 前言
需要提前学习的知识：
- [babel原理及插件开发](https://juejin.cn/post/6844903603983892487)
- [实时解析和查看JavaScript 的AST的在线工具](https://astexplorer.net/)

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
