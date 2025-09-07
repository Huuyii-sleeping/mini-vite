const path = require('path')
const fs = require('fs').promises

function moduleResolvePlugin({app, root}){
    app.use(async (ctx, next) => {
        const reg = /^\/@modules\//
        // 没有 /@modules 直接执行就行
        if(!reg.test(ctx.path)){
            return next()
        } else {
            const id = ctx.path.replace(reg, '')
            let mapping = {
                vue: path.resolve(root, 'node_modules', '@vue/runtime-dom/dist/runtime-dom.esm-browser.js')
            }
            const content = await fs.readFile(mapping[id], 'utf-8')
            ctx.type = 'js' // 设置返回文件的类型  
            ctx.body = content
        }
    })
}

exports.moduleResolvePlugin = moduleResolvePlugin