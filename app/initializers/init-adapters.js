import DS from 'ember-data';
import {guid} from '../utils/string-util';

export function initialize(/* container, application */) {
    DS.RESTAdapter.reopen({
        coalesceFindRequests: true
    });

    DS.RESTAdapter.reopen({
        generateIdForRecord: function () {
            return guid();
        }
    });
}

export default {
    name: 'init-adapters',
    initialize: initialize
};
