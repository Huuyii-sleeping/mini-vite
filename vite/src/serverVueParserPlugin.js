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
                    const compiledScript = compileScript(descriptor, { id: 'component' }) // id 必须传
                    code += `\n${compiledScript.content}` // 已包含 export default { ... }
                    code = code.replace(/export default/, 'const __script =') // 替换为赋值
                }
                // componsition
                if (descriptor.script) {
                    let content = descriptor.script.content
                    code += content.replace(/((?:^|\n|;)\s*)export default/, '$1const __script=')
                }
                // template
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
                const { code } = compileTemplate({
                    source: descriptor.template.content,
                    filename: path.basename(filePath),
                    id: 'component',
                    // 👇 关键配置
                    compilerOptions: {
                        mode: 'module', // 生成 ES Module 语法
                    },
                    transformAssetUrls: false,
                })

                // 🔥 手动注入 import
                ctx.body = `
                import { h, toDisplayString } from 'vue'
                ${code}
                 `.trim()
            }
        }
    })
}

exports.vueParserPlugin = vueParserPlugin