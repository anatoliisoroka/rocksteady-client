export function initialize(application) {
    var router = application.container.lookup('router:main');

    router.on('didTransition', function () {
        application.container.lookup('view:application').send('cleanupOnRouteTransition');
    });
}

export default {
    name: 'route-cleanup',
    initialize: initialize
};
