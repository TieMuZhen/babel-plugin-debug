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