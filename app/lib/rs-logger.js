/* global Bugsnag */

import Ember from 'ember';
import config from '../config/environment';

if (typeof Bugsnag !== 'undefined') {

    var bs = Bugsnag;//.noConflict();
    bs.releaseStage = config.APP.environment;
    bs.appVersion = config.APP.version;
    bs.apiKey = '4077c5376febcba18347f78228a994f6';
    bs.context = window.location.toString();
    bs.notifyReleaseStages = [];
    bs.metaData = {};

    if (config.APP.bugsnag) {
        bs.notifyReleaseStages.push(config.APP.environment);
    }

    window.addEventListener('popstate', function () {
        bs.context = window.location.toString();
    });

    Ember.onerror = (error = Error('Ember internals encounter an error')) => {
        bs.context = window.location.toString();
        bs.notifyException(error);

        if (console && error.stack) {
            console.error(error.stack);
        }
    };

    Ember.RSVP.on('error', function (error) {
        bs.context = window.location.toString();
        bs.notifyException(error);
    });

    Ember.Logger.error = (message, cause) => {
        bs.context = window.location.toString();
        const error = Error(message);
        bs.notifyException(error, null, { cause });

        if (console && error.stack) {
            console.error(error.stack);
        }
    };
}

export default {

    log:    function (logName, logMessage) {
        logMessage = logMessage || logName;
        Ember.Logger.log(logMessage);
    },

    debug:  function (logName, logMessage) {
        if (config.APP.debugging) {
            logMessage = logMessage || logName;
            Ember.Logger.debug(logMessage);
        }
    },

    info:   function (logName, logMessage) {
        logMessage = logMessage || logName;
        Ember.Logger.info(logMessage);
    },

    warn (logName, logMessage = logName) {
        if (bs) {
            bs.context = window.location.toString();
            bs.notify(logName, logMessage, { groupingHash: logName }, 'warning');
        }

        Ember.Logger.warn(logMessage);
    },

    error (logName, logMessage = logName) {
        if (bs) {
            bs.context = window.location.toString();
            bs.notify(logName, logMessage, { groupingHash: logName }, 'error');
        }

        Ember.Logger.error(logMessage);
    },

    event:  function (msg) {
        Ember.Logger.info('EVENT: ' + msg);
    },

    time:   function (msg) {
        this.debug('Time', '[' + (new Date()).toISOString() + '] ' + msg);
    },

    setUser: function (id, email, name) {
        if (bs) {
            bs.user = {
                id: id,
                email: email,
                name: name
            };
        }
    },

    setSessionId: function (sessionId) {
        if (bs) {
            bs.metaData.sessionId = sessionId;
        }
    }
};
