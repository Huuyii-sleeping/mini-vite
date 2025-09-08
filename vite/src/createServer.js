const Koa = require('koa')
const path = require('path')

async function createServer() {
    const app = new Koa()

    let userConfig = {}
    try {
        const configPath = path.resolve('src/vite.config.js')
        const configModule = await import('./vite.config.js')
        userConfig = configModule.default || configModule
    } catch (error) {
        console.log(error)
        console.log('no vite.config.js FOUND')
    }

    // 创建上下文
    const context = {
        app,
        root: userConfig.root || process.cwd(),
        config: userConfig
    }

    // 加载插入模块
    const plugins = userConfig.plugins || []

    for (const plugin of plugins) {
        if(typeof plugin === 'function'){
            const resolvedPlugin = plugin()
            if(resolvedPlugin.configureServer){
                await resolvedPlugin.configureServer(context)
            }
        } else if(plugin && typeof plugin === 'object'){
            if(plugin.configureServer){
                await plugin.configureServer(context)
            }
        }
    }
    return app
}

module.exports = { createServer }