const fs = require('fs');
const path = require('path');
// https://github.com/nodejitsu/node-http-proxy
const proxy = require('http-proxy').createProxyServer({secure: false, changeOrigin: true});
const config = require('../config.js');
const ignoreRequestPathProxy = require('http-proxy').createProxyServer({secure: false, changeOrigin: true, ignorePath: true});

const proxyTarget = config.proxyTarget;
const apiProxyPath = config.apiProxyPath;
const adminProxyPath = config.adminProxyPath;
const promotionsProxyPath = config.promotionsProxyPath;
const internalProxyPath = config.internalProxyPath;
const upgProxyPath = config.upgProxyPath;
const dataProxyPath = config.dataProxyPath;
const authProxyPath = config.authProxyPath;
const authSandboxProxyPath = config.authSandboxProxyPath;
const loginProxyPath = config.loginProxyPath;

module.exports = function (app) {

    proxy.on('error', (err, req) => {
        console.error(err, req.url);
    });

    app.use(apiProxyPath, (req, res) => {
        req.url = path.join(apiProxyPath, req.url);
        proxy.web(req, res, {target: proxyTarget});
    });

    app.use(adminProxyPath, (req, res) => {
        req.url = path.join(adminProxyPath, req.url);
        proxy.web(req, res, {target: proxyTarget});
    });

    app.use(promotionsProxyPath, (req, res) => {
        req.url = path.join(promotionsProxyPath, req.url);
        proxy.web(req, res, {target: proxyTarget});
    });

    app.use(internalProxyPath, (req, res) => {
        req.url = path.join(internalProxyPath, req.url);
        proxy.web(req, res, {target: proxyTarget});
    });

    app.use(upgProxyPath, proxyReplaceUPGRedirect());

    app.use(dataProxyPath, (req, res) => {
        req.url = path.join(dataProxyPath, req.url);
        proxy.web(req, res, {target: proxyTarget});
    });

    app.use(upgProxyPath, (req, res) => {
        req.url = path.join(upgProxyPath, req.url);
        proxy.web(req, res, {target: proxyTarget});
    });

    // app.use(config.brandingProxyPath, (req, res) => {
    //     req.url = path.join('app', config.brandingProxyPath, req.url);
    //     console.log(proxyTarget, req.url);
    //     proxy.web(req, res, {target: proxyTarget});
    // });

    app.use(loginProxyPath, (req, res) => {
        req.url = path.join(loginProxyPath, req.url);
        proxy.web(req, res, {target: proxyTarget});
    });

    //Can use this for getting placeholder images that can be added to the canvas without CORS issues
    app.use('/placeholder', (req, res) => {
        req.url = path.join('/', req.url);
        ignoreRequestPathProxy.web(req, res, {target: 'https://via.placeholder.com' + req.url, 'ignorePath': true});
    });
};

//This method can be used to modify server responses for development
function proxyReplaceUPGRedirect() {
    let harmon = require('harmon');
    let selects = [];
    let simpleselect = {};

    simpleselect.query = 'script';

    simpleselect.func = function (node) {
        let data = '';
        let rs = node.createReadStream();
        let ws = node.createWriteStream({outer: false});

        rs.on('data', (chunk) => {
            data += chunk.toString();
        });

        rs.on('end', () => {
            data = data.replace(/https:\/\/.+"/,'*"');
            ws.end(data);
        });
    };

    selects.push(simpleselect);

    return harmon([], selects);
}
