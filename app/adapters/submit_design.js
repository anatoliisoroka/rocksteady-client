/* global logger, mixpanel */
import ApplicationAdapter from './application';
import Ember from 'ember';
import config from '../config/environment';


export default ApplicationAdapter.extend({

    pathForType: function () {
        return this.apiEndpoint('submitted_designs');
    },

    createRecord: function (store, type, snapshot) {
        let data = {};
        let serializer = store.serializerFor(type.modelName);
        window.mixpanel = window.mixpanel || false;

        serializer.serializeIntoHash(data, type, snapshot, {includeId: false});

        return new Ember.RSVP.Promise(function (resolve, reject) {
            let ajaxPost = {
                type: 'POST',
                url: this.buildURL('submittedDesigns'),
                data: data.submit_design
            };

            Ember.$
                .ajax(ajaxPost)
                .then(function (data, textStatus, jqXHR) {
                    let status = jqXHR.status;
                    if (status === 201) {
                        if (config.mixpanel.enabled && window.mixpanel) {
                            mixpanel.track('SubmitDesign', {
                                action: 'POST'
                            });
                        }
                        Ember.run(null, resolve);
                    } else {
                        logger.error('SubmitDesign', 'POST ' + status);
                        Ember.run(null, reject, jqXHR);
                    }
                }, function (jqXHR) {
                    let ErrorCode = jqXHR.status + '_error POST_SubmitDesign';
                    let ErrorMessage = 'Response: ' + jqXHR.responseText + 'Status: ' + jqXHR.statusText;
                    logger.error(ErrorCode, ErrorMessage);

                    jqXHR.then = null; // tame jQuery's ill mannered promises
                    Ember.run(null, reject, jqXHR);
                });
        }.bind(this));
    }
});
