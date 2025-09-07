const static = require('koa-static')
const path = require('path')

function serveStaticPlugin({ app, root }) {
    // 配置静态服务
    app.use(static(root))
    app.use(static(path.resolve(root, 'public')))
}

module.exports = serveStaticPlugin
