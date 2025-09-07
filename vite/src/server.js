

const Koa = require('koa')
const serveStaticPlugin = require('./serverStaticPlugin')
const moduleRewritePlugin = require('./serverModulePlugin')

function createServer() {
    let app = new Koa()

    // 实现静态插件
    const context = { // 创建上下文对象，来给不同的插件共享功能
        app,
        root: process.cwd() // 拿到对应的工作目录
    }

    // koa 洋葱模型 从后向前执行
    const resolvePlugin = [
        moduleRewritePlugin, // 重写我们的请求路径，重启之后浏览器重新发送请求路径
        serveStaticPlugin, // 静态服务插件 实现返回文件的功能
    ]

    resolvePlugin.forEach(plugin => plugin(context))

    return app
}

createServer().listen(4000,() => {
    console.log('vite start with 4000 ...')
})

// nodemon 实现热更新