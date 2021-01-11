/* global Modernizr */
import Ember from 'ember';
import config from '../config/environment';
import rsLogger from '../lib/rs-logger';

//TODO: invalid tokens

export default Ember.Service.extend({
    user: {
        name: null,
        email: null,
        id: null
    },
    isAuthenticated: false,
    isLoggingIn: false,
    token: null,
    providers: [
        {key: 'facebook', name: 'Facebook'},
        {key: 'google', name: 'Google'},
        {key: 'microsoft', name: 'Microsoft'}
    ],

    init() {
        this._super(...arguments);

        //setup callback handlers for login providers
        window.addEventListener("message", this._authTokenCallback(this), false);

        //Restore a session from local storage
        this.restoreSessionFromStorage();
    },

    /* Provider interactions */

    attemptLogIn(provider) {
        let self = this;

        self.set('isLoggingIn', true);

        self.invalidateSession();

        let loginPromise = new Ember.RSVP.Promise(function (resolve, reject) {
            self.set('loginResolve', resolve);
            self.set('loginReject', reject);

            // The provider window will execute the loginResolve or loginReject callbacks respectively
            self.openProviderWindow(provider);
        });

        return loginPromise.then((user) => {
            let session = this.get('session');
            self.updateSession(session);
            self.set('isLoggingIn', false);
            return user;
        }).catch((message) => {
            //TODO show message to user?
            self.invalidateSession();
            self.set('isLoggingIn', false);
            rsLogger.error('authentication', 'Login failed: ' + message);
        }).finally(() => {
            self.set('loginResolve', null);
            self.set('loginReject', null);
        });
    },

    _authTokenCallback(service) {
        return function (event) {
            let origin = event.origin;
            let domainRegEx = new RegExp(/https?:\/\/(\w+\.)?(motocal|decalio|localhost)(\.com)?/);

            if (!domainRegEx.exec(origin)) {
                return;
            }

            let messageData = event.data;
            let messageType = messageData.type;

            if (messageType === 'success') {
                let token = messageData.token;

                service.set('token', token);

                return service.getUserInfo().then((user) => {
                    if (typeof service.get('loginReject') === 'function') {
                        service.get('loginResolve')(user);
                    }
                }).catch(() => {
                    if (typeof service.get('loginReject') === 'function') {
                        service.get('loginReject')('Error getting user info with new token');
                    }
                });
            } else {
                let errorMessage = messageData.errorText || 'Error getting auth token';
                if (typeof service.get('loginReject') === 'function') {
                    service.get('loginReject')(errorMessage);
                }
            }
        };
    },

    openProviderWindow(provider, windowName = 'Authorize') {
        let rsAuthPath = config.APP.auth_endpoint;
        let rsAuthExtraParams = config.APP.auth_extra_params;
        let redirectPath = config.APP.auth_redirect_path;

        let url = rsAuthPath + '?provider=' + provider + '&redirect_path=' + redirectPath + rsAuthExtraParams;
        let authWindow = window.open(url, windowName, 'height=600,width=800');

        if (window.focus) {
            authWindow.focus();
        }

        return false;
    },

    getUserInfo() {
        let self = this;
        let token = this.get('token');

        return new Ember.RSVP.Promise(function (resolve, reject) {
            Ember.$.ajax({
                url: config.APP.user_endpoint,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + token);
                },
                type: 'get',
                dataType: 'JSON',
                success: function (data) {
                    if (data.user && data.user.email) {
                        self.updateUser(data.user);
                        self.validateSession();
                        resolve(self.get('user'));
                    } else {
                        rsLogger.error('authentication', 'Failed to log in: no user data');
                        self.invalidateSession();
                        reject('No user data');
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    self.invalidateSession();

                    if (jqXHR.status !== 401) {
                        rsLogger.error('authentication', 'Failed to log in: error: ' + errorThrown);
                    } else {
                        resolve();
                    }
                }
            });
        });
    },

    /* Session handling */

    session: function () {
        let user = this.get('user');
        let token = this.get('token');

        return {user, token};
    }.property('user.name', 'user.email', 'token'),

    updateSession(session = {}) {
        let token = session.token || null;

        this.set('token', token);
        this.updateUser(session.user);
        this.validateSession();
    },

    invalidateSession() {
        this.set('isAuthenticated', false);
        this.set('token', null);
        this.updateUser();
        this.removeSessionFromStorage();
    },

    validateSession() {
        this.set('isAuthenticated', true);
        this.updateSessionInStorage();
    },

    updateUser(user = {}) {
        let id = user.id || null;
        let name = user.name || null;
        let email = user.email || null;

        this.set('user.id', id);
        this.set('user.name', name);
        this.set('user.email', email);
    },

    /* Storage */

    storageKey: 'rs-session',

    storage: function () {
        return Modernizr.localstorage && window.localStorage;
    }.property(),

    removeSessionFromStorage() {
        let storage = this.get('storage');
        let storageKey = this.get('storageKey');

        if (storage) {
            storage[storageKey] = null;
        }
    },

    restoreSessionFromStorage() {
        let storage = this.get('storage');
        let storageKey = this.get('storageKey');

        if (storage) {
            try {
                let stringifiedSession = storage[storageKey];
                if (stringifiedSession) {
                    let oldSession = JSON.parse(storage[storageKey]);

                    if (oldSession && oldSession.token) {
                        this.updateSession(oldSession);
                        return true;
                    }
                }
            } catch (error) {
                this.removeSessionFromStorage();
            }
        }
    },

    updateSessionInStorage() {
        let storage = this.get('storage');
        let storageKey = this.get('storageKey');

        if (storage) {
            let session = JSON.stringify(this.get('session'));
            storage[storageKey] = session;
        }
    }
});

