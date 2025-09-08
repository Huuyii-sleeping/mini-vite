const { createServer } = require('./createServer')

createServer().then(app => {
    app.listen(4000, () => {
        console.log('server running ...')
    })
})