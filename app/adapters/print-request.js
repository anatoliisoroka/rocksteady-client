/* global logger, mixpanel */

import Ember from 'ember';
import ApplicationAdapter from './application';
import config from '../config/environment';

export default ApplicationAdapter.extend({
    createRecord: function (store, type, snapshot) {
        var data = {},
            model = store.modelFor('printRequest'),
            serializer = store.serializerFor(model.modelName);

        serializer.serializeIntoHash(data, model, snapshot, { includeId: false });

        return new Ember.RSVP.Promise(function (resolve, reject) {
            Ember.$.ajax({
                type: 'POST',
                url: this.buildURL('printRequests'),
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(data),
                dataType: 'json'
            }).then(function (responseData, textStatus, jqXHR) {
                var ErrorReportingData = jqXHR.status + " " + textStatus;

                if (responseData.print_request && responseData.print_request.id) {
                    snapshot.record.set('id', responseData.print_request.id); // print request ID from server
                    snapshot.record.set('UPGTransactionId', responseData.print_request.UPGTransactionId); // UPG transaction ID from server
                    if(config.mixpanel.enabled){
                        mixpanel.track("PrintRequestSent", { "action" : "POST" , "id" : responseData.print_request.id, "UPGTransactionId" : responseData.print_request.UPGTransactionId});
                    }
                 }else{
                    if(!responseData.print_request){
                        logger.error('PrintRequestError', "POST - No print request: " + ErrorReportingData);
                    }else if(!responseData.print_request.id){
                        logger.error('PrintRequestError', "POST - No print request ID: " + ErrorReportingData);
                    }else if(!responseData.print_request.UPGTransactionId){
                        logger.error('PrintRequestError', "POST - No UPG Transaction ID: " + ErrorReportingData);
                    }
                }

                Ember.run(null, resolve);
            }, function (jqXHR) {
                var ErrorCode = ' PrintRequest POST' + jqXHR.status + '_error';
                var ErrorMessage = 'Response: ' + jqXHR.responseText + 'Status: ' + jqXHR.statusText;
                logger.error(ErrorCode, ErrorMessage);

                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
             });
        }.bind(this));
    },

    updateRecord: function (store, type, snapshot) {
        var data = {},
            model = store.modelFor('printRequest'),
            serializer = store.serializerFor(model.modelName);

        serializer.serializeIntoHash(data, model, snapshot, { includeId: false });
        var dataStr = JSON.stringify(data);
        var doGzip = config.APP.gzip_pr_put_request && !config.APP.testing;

        if (doGzip) {
            logger.time('[pako] uncompressed print request length = ' + dataStr.length);
            var gz = window.pako.gzip(dataStr);


        return new Ember.RSVP.Promise(function (resolve, reject) {
            Ember.$.ajax({
                type: 'PUT',
                url: this.buildURL('printRequests', snapshot.record.get('id')),
                contentType: 'application/json; charset=utf-8',
                headers: {'Content-Encoding': 'gzip'},
                data: gz.buffer,
                processData: false,
                dataType: 'text'

            }).then(function (responseData) {
                if(config.mixpanel.enabled){
                    mixpanel.track("PrintRequestSent", { "action" : "PUT", "compressed" : doGzip ,"id" : snapshot.record.get('id'), "responseData" : responseData});
                }
                Ember.run(null, resolve);
            }, function (jqXHR) {

                var ErrorCode = 'PrintRequest PUT' + jqXHR.status + '_error';
                var ErrorMessage = 'Compressed:' + doGzip + ' Response: ' + jqXHR.responseText + 'Status: ' + jqXHR.statusText;
                logger.error(ErrorCode, ErrorMessage);

                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);

            });
        }.bind(this));

        } else {
            return new Ember.RSVP.Promise(function (resolve, reject) {
                Ember.$.ajax({
                    type: 'PUT',
                    url: this.buildURL('printRequests', snapshot.record.get('id')),
                    contentType: 'application/json; charset=utf-8',
                    data: dataStr,
                    dataType: 'text'

                }).then(function (responseData) {
                    if(config.mixpanel.enabled) {

                        mixpanel.track("PrintRequestSent", {
                            "action": "PUT",
                            "compressed": doGzip,
                            "id": snapshot.record.get('id'),
                            "responseData": responseData
                        });
                    }
                    Ember.run(null, resolve);
                }, function (jqXHR) {
                    var ErrorCode = 'PrintRequest PUT' + jqXHR.status + '_error';
                    var ErrorMessage = 'Compressed:' + doGzip + ' Response: ' + jqXHR.responseText + 'Status: ' + jqXHR.statusText;
                    logger.error(ErrorCode, ErrorMessage);

                    jqXHR.then = null; // tame jQuery's ill mannered promises
                    Ember.run(null, reject, jqXHR);
                });
            }.bind(this));

        }
    }
});
