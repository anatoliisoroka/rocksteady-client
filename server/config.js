module.exports = {

    /* DEVELOPMENT */
    // proxyTarget: 'https://rockSteady:Simpsons@192.168.33.10',
    // proxyTarget: 'https://localhost:2443',

    /* MOTOCAL */
    proxyTarget: 'https://test.motocal.com',
    // proxyTarget: 'https://staging.motocal.com',
    // proxyTarget: 'https://design.motocal.com',

    /* DECALIO */
    // proxyTarget: 'https://staging.decalio.com',

    apiProxyPath: '/api',
    adminProxyPath: '/admin',
    promotionsProxyPath: '/promotions',
    internalProxyPath: '/internal',
    upgProxyPath: '/upg',
    dataProxyPath: '/data',
    brandingProxyPath: '/branding',
    //used for login/callback.html
    loginProxyPath: '/login',


    //Kits can be mocked and served from FS for testing kits that don't reside on the server
    proxyOrderKitsToFileSystem: false,
    orderKitPath: '/api/order_kits',
    fixtureDir: './server/mocks/fixtures/'
};
