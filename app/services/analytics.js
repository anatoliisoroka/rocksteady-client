import Ember from 'ember';
import config from '../config/environment';
import rsLogger from '../lib/rs-logger';

/** @namespace Ember.Service */
export default Ember.Service.extend({

    authentication: Ember.inject.service(),

    userId: Ember.computed.alias('authentication.user.id'),

    eventsEndpoint: config.APP.analytic_events_endpoint,

    sendAnalyticsEvent(eventName = 'unknown', resourceId = 'unknown') {
        let eventsEndpoint = this.get('eventsEndpoint');
        let event = {name: eventName, resource_id: resourceId};
        let userId = this.get('userId');

        if (userId) {
            event.user_id = userId;
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            Ember.$.ajax({
                type: 'POST',
                url: eventsEndpoint,
                data: event
            }).then(function () {
                Ember.run(null, resolve);
            }, function (jqXHR) {
                let ErrorCode = 'Analytics Event POST' + jqXHR.status + '_error';
                let ErrorMessage = 'Response: ' + jqXHR.responseText + 'Status: ' + jqXHR.statusText;

                rsLogger.error(ErrorCode, ErrorMessage);

                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
            });
        });
    }
});
