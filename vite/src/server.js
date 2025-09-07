

const Koa = require('koa')
const serveStaticPlugin = require('./serverStaticPlugin')
const { moduleRewritePlugin } = require('./serverModulePlugin')
const { moduleResolvePlugin } = require('./serverModuleResolve')
const { vueParserPlugin } = require('./serverVueParserPlugin')

function createServer() {
    let app = new Koa()

    // 实现静态插件
    const context = { // 创建上下文对象，来给不同的插件共享功能
        app,
        root: process.cwd() // 拿到对应的工作目录
    }

    // koa 洋葱模型 从后向前执行
    const resolvePlugin = [
        moduleRewritePlugin, // 重写我们的请求路径，重启之后浏览器会再次发送请求路径
        moduleResolvePlugin, // 这个的里面可能引入其他文件 也需要进行模块的解析
        vueParserPlugin, // 可能是vue文件 将vue文件进行解析
        serveStaticPlugin, // 静态服务插件 实现返回文件的功能
    ]

    resolvePlugin.forEach(plugin => plugin(context))

    return app
}

createServer().listen(4000, () => {
    console.log('vite start with 4000 ...')
})

// nodemon 实现热更新