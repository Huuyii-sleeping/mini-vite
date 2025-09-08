const path = require('path')
const vuePlugin = require('./serverVueParserPlugin')
const hmrPlugin = require('./serverHMRPlugin')
const prebundlePlugin = require('./serverPrebundlePlugin')


// 插件是工厂函数返回插件对象
module.exports = {
    root: path.resolve(__dirname),
    plugins: [
        vuePlugin(),
        hmrPlugin(),
        prebundlePlugin()
    ]
}