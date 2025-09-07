const { Readable } = require('stream')

async function readBody(stream) {
    if (stream instanceof Readable) {
        return new Promise((resolve, reject) => {
            let res = ''
            stream.on('data', (chunk) => {
                res += chunk
            })
            stream.on('end', () => {
                resolve(res)
            })
        })
    } else {
        return stream
    }
}

exports.readBody = readBody