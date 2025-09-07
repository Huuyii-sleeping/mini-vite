const path = require('path')
const fs = require('fs').promises

function vueParserPlugin({ app, root }) {
    app.use(async (ctx, next) => {
        if (!ctx.path.endsWith('.vue')) {
            return next()
        } else {
            const filePath = path.join(root, ctx.path)
            const content = await fs.readFile(filePath, 'utf-8')

            // 解析vue文件
            const { compileTemplate, parse, compileScript } = require('@vue/compiler-sfc')
            const { descriptor } = parse(content) // 对vue文件进行解析
            //  App.vue 没有query参数
            if (!ctx.query.type) {
                let code = ''
                // setup
                if (descriptor.scriptSetup) {
                    const compiledScript = compileScript(descriptor, { 
                        id: 'component',
                        sourceMap: true,                        
                     }) // id 必须传
                    code += `\n${compiledScript.content}` // 已包含 export default { ... }
                    code = code.replace(/export default/, 'const __script =') // 替换为赋值
                }
                // componsition
                if (descriptor.script) {
                    let content = descriptor.script.content
                    code += content.replace(/((?:^|\n|;)\s*)export default/, '$1const __script=')
                }
                // template 在这注入 Source Map
                if (descriptor.template) {
                    const requestPath = ctx.path + '?type=template'
                    code += `\nimport { render as __render } from "${requestPath}"`
                    code += `\n__script.render = __render`
                }
                code += `\nexport default __script`
                ctx.type = 'js'
                ctx.body = code
            } else if (ctx.query.type === 'template') {
                ctx.type = 'js'
                const { code, map } = compileTemplate({
                    source: descriptor.template.content,
                    filename: path.basename(filePath),
                    id: 'component',
                    compilerOptions: {
                        mode: 'module',
                    },
                    transformAssetUrls: false,
                    sourceMap: true,
                })
                const base64Map = Buffer.from(JSON.stringify(map)).toString('base64')
                ctx.body = `
                import { h, toDisplayString } from 'vue'
                ${code} 
                //# sourceMappingURL=data:application/json;base64,${base64Map}
                 `.trim()
                // 进行sourceMap注入 保存原有的sourceMap
            }
        }
    })
}

exports.vueParserPlugin = vueParserPlugin