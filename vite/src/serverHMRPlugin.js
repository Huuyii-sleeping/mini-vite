// serverHMRPlugin.js
const WebSocket = require('ws')
const fs = require('fs').promises

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

        // 客户端心跳检测 防止断连
        socket.isAlive = true
        socket.on('pong', () => {
            socket.isAlive = true
        })

        // 监听关闭
        socket.on('close', () => {
            console.log('HMR client disconnected')
        })
    })

    // 增加定期检查看客户端是否存活
    const interval = setInterval(() => {
        wsServer.clients.forEach((socket) => {
            if (!socket.isAlive) {
                return socket.terminate()
            }
            socket.isAlive = false
            socket.ping()
        })
    }, 30000)

    wsServer.on('close', () => {
        clearInterval(interval)
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

function getFileType(file) {
    if (file.endsWith('.vue')) return 'vue'
    if (file.endsWith('.js')) return 'js'
    if (file.endsWith('.css')) return 'css'
    return 'unknown'
}

function hmrPlugin({ app, root }) {
    // 创建 WebSocket 服务
    createHMRServer()

    // 监听文件变化 
    const chokidar = require('chokidar')
    // 监听真个文章的目录 忽略node_modules(设置监听)
    const watcher = chokidar.watch(root, {
        ignored: ['**/node_modules/**'],
        ignoreInitial: true,
    })
    // 文件修改，触发change事件
    watcher.on('change', async (file) => {
        const fileType = getFileType(file)
        console.log(`🔥 File changed: ${file}`)

        if (fileType === 'vue' || fileType === 'js') {
            sendUpdate('update', { path: file, type: 'js-update' })
        } else if (fileType === 'css') {
            sendUpdate('update', { path: file, type: 'css-update' })
        }
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

                // 心跳重连机制 new 
                let reconnectInterval
                function setupReconnect(){
                    if(reconnectInterval)return 
                    reconnectInterval = setInterval(() => {
                        console.log('HMR reconnecting...')
                        ws.close()
                        ws = new WebSocket('ws://localhost:24678')    
                    },1000)
                } 
                 
                ws.onopen = () => {
                    console.log('HMR copnnected')
                    clearInterval(reconnectInterval)
                    reconnectInterval = null    
                }

                ws.onclose = () => {
                    console.log('HMR disconnect')
                    setupReconnect()
                }
                
                ws.onmessage = async (event) => {
                    const data = JSON.parse(event.data)
                    console.log('HMR received:', data)

                    if (data.type === 'update') {
                        if(data['type'] === 'css-update'){
                            const href = location.origin + data.path
                            const link = document.querySelector(\`link[href*="\${href}"]\`)
                            if(link){
                                const newLink = link.cloneNode()
                                newLink.href = href + '?t=' + Date.now() // 加时间戳防止缓存
                                link.parentNode.insertBefore(newLink, link.nextSibling)
                                setTimeout(() => link.remove(), 0);
                            }
                        } else {
                            console.log('page reload by HMR')
                            location.reload() 
                        }
                    }
                }
                </script>
            `.trim()
            // 在ctx当中插入对应的脚本 对请求的数据进行更改
            ctx.body = content.replace(/<\/head>/, `${script}</head>`)
        }
    })
}

module.exports = { hmrPlugin }
