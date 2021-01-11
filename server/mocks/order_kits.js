const fs = require('fs');
const path = require('path');
const proxy = require('http-proxy').createProxyServer({secure: false});
const config = require('../config.js');

const orderKitPath = config.orderKitPath;
const fixtureDir = config.fixtureDir;
const proxyTarget = config.proxyTarget;

module.exports = function (app) {
    if(config.proxyOrderKitsToFileSystem) {
        proxy.on('error', (err, req) => {
            console.error(err, req.url);
        });
        app.use(orderKitPath, proxyLocalKitJson);
    }
};

//This method can be used to serve order_kit responses for development, while passing through normal requests
function proxyLocalKitJson(req, res) {
    req.url = path.join(orderKitPath, req.url);

    let id = req.url.match(/order_kits\/(.+)\?/)[1];
    let fileContents = fs.readFileSync(path.join(fixtureDir, 'order_kits', id + '.json'));

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(fileContents);
    res.end();
}
