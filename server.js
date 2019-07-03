const http = require('http');
const fs = require('fs');

const PORT=8080;

http.createServer(function(request, response) {
    console.log('req', request.url, 'path', (request.url === '/' ? (process.cwd() + '/index.html') : (process.cwd() + request.url)))
    fs.readFile((request.url === '/' ? (process.cwd() + '/index.html') : (process.cwd() + request.url)), function (err, file) {
        if (err) throw err;
        let type = "text/html"
        let parts = request.url.split('.')
        let ext = parts[parts.length - 1]
        switch(ext) {
            case 'js':
                type = 'application/javascript'
                break
            case 'css':
                type = 'text/css'
                break
            case 'gif':
                type = 'image/gif'
                break
            case 'html':
            default:
                type = 'text/html'
                break
        }
        response.writeHeader(200, {"Content-Type": type});
        response.write(file);
        response.end();
    });

}).listen(PORT);


