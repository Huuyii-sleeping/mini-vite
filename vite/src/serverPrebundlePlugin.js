// 依赖预构建
const esbuild = require('esbuild')
const path = require('path')

/** 
 * 不进行预构建操作：
 *      直接从node_modules进行访问 会发送很多的HTTP请求
 *      首次加载慢
 * 预构建插件：
 *      启动时候使用esbuild打包 node_modules中的模块
 *      返回一个打包之后的文件
 *      减少HTTP请求
*/

async function prebundle(deps = ['vue', 'react', 'lodash']) {
    const result = await esbuild.build({ // 直接进行打包的操作 进行预构建
        entryPoints: deps,
        bundle: true,
        format: 'esm',
        target: 'es2020',
        write: false,
        outfile: 'out.js'
    })

    return result.outputFiles[0].text
}

// 存储预构建结果（缓存）
let bundleCode = null
let pendingPromise = null

function prebundlePlugin() {
    return {
        name: 'preBundle',
        async configureServer({ app, next }) {
            async function getBundleCode() {
                if (bundleCode) return bundleCode
                if (pendingPromise) return pendingPromise

                // 首次构建 不要重复的执行
                pendingPromise = prebundle(['vue'])
                try {
                    bundleCode = await pendingPromise
                    pendingPromise = null
                    console.log('预构建完成')
                } catch (error) {
                    pendingPromise = null
                    console.log('预构建失败:', e)
                    throw e
                }
                return bundleCode
            }

            app.use(async (ctx, next) => {
                if (ctx.path.startsWith('/@modules/')) {
                    const packageName = ctx.path.slice('/@modules'.length)

                    // 只处理我们预构建的包
                    if (packageName === 'vue') {
                        try {
                            const code = await getBundleCode()
                            ctx.type = 'js'
                            ctx.body = code
                            return
                        } catch (error) {
                            ctx.status = 500
                            ctx.body = `PreBundle failed: ${e.message}`
                            return
                        }
                    }
                }
                await next() // 提前进行打包预构建
            })
        }
    }
    // 启动项目时候进行预构建 （懒加载，首次构建请求）
}

exports.prebundlePlugin = prebundlePlugin
