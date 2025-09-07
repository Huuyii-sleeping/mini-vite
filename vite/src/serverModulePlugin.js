const { readBody } = require("./utils")
const { parse } = require('es-module-lexer')
const maginString = require('magic-string')

function rewriteImports(source) {
    let imports = parse(source)[0]
    let ms = new maginString(source)

    if (imports.length > 0) {
        for (let i = 0; i < imports.length; i++) {
            let { s, e } = imports[i]
            let id = source.slice(s, e)
            if (/^[^\/\.]/.test(id)) {
                id = `/@modules/${id}`
                ms.overwrite(s, e, id)
            }
        }
    }
    return ms.toString()
}


function moduleRewritePlugin({ app, root }) {
    app.use(async (ctx, next) => {
        // 请求之前 TODO

        await next() // 后面的先执行(静态服务)

        // 请求之后 TODO
        // 将流转换成字符串 只需要处理js文件
        if (ctx.body && ctx.response.is('js')) {
            let r = await readBody(ctx.body)
            const result = rewriteImports(r)
            ctx.body = result
        }
    })
}

exports.moduleRewritePlugin = moduleRewritePlugin