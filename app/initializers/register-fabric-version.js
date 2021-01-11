/* global fabric */

import Ember from 'ember';

export function initialize(/* container, application */) {
    Ember.libraries.register("Fabric", fabric.version);
}

export default {
    name: 'register-fabric-version',
    initialize: initialize
};
