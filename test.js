const { transformSync } = require("@babel/core");

// 要转换的代码
const content = `
    console.log("我不受影响");

    // DEBUG 中的代码只有在 dev 环境下才存在，其余环境都移除
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
                env: "production"
            }
        ]
    ]
}
const output = transformSync(content, babelConfig);

console.log(output); // 打印转换结果