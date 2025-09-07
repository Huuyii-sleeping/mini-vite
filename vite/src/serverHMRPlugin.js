// serverHMRPlugin.js
const WebSocket = require('ws')

let wsServer



/**
 * 组成：
 *      WebSocket服务端，监听文件的变化，通知浏览器
 *      文件监听器： chokidar 监听项目文件
 *      HTML注入中间件：向页面中注入客户端脚本
 */

// 创建WebSocket服务 当文件修改时候，服务器通过这个连接主动推送消息给浏览器
function createHMRServer() {
    wsServer = new WebSocket.Server({ port: 24678 }) // HMR 服务端口
    wsServer.on('connection', (socket) => {
        console.log('HMR client connected')
    })
    return wsServer
}

// 监听文件变化并发送更新
function sendUpdate() {
    if (wsServer) {
        // 遍历所有连接的客户端
        wsServer.clients.forEach((client) => {
            // 如果是open的状态 就发送消息 浏览器可以收到这个消息
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'update' }))
            }
        })
    }
}

function hmrPlugin({ app, root }) {
    // 创建 WebSocket 服务
    createHMRServer()

    // 监听文件变化
    const chokidar = require('chokidar')
    // 监听真个文章的目录 忽略node_modules
    const watcher = chokidar.watch(root, {
        ignored: ['**/node_modules/**'],
        ignoreInitial: true,
    })
    // 文件修改，触发change事件
    watcher.on('change', (file) => {
        console.log(`🔥 File changed: ${file}`)
        sendUpdate() // 文件修改，通知浏览器刷新
    })

    // 注入客户端 HMR 脚本
    app.use(async (ctx, next) => {
        await next()
        if (ctx.response.is('html')) {
            const content = ctx.body
            if (typeof content !== 'string') {
                console.warn('Content is not string, cannot inject HMR script')
                return
            }
            // 向HTML注入客户端脚本 实现监听
            const script = `
                <script type="module">
                const ws = new WebSocket('ws://localhost:24678')
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data)
                    if (data.type === 'update') {
                    console.log('🔁 Page reload by HMR')
                    location.reload()
                    }
                }
                </script>
            `.trim()
            // 在ctx当中插入对应的脚本
            ctx.body = content.replace(/<\/body>/, `${script}</body>`)
        }
    })
}

module.exports = { hmrPlugin }
