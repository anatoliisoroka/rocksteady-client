import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    store: Ember.inject.service(),
    authentication: Ember.inject.service(),

    providers: Ember.computed.alias('authentication.providers'),

    isAuthenticated: Ember.computed.alias('authentication.isAuthenticated'),
    isLoggingIn: Ember.computed.alias('authentication.isLoggingIn'),
    userName: Ember.computed.alias('authentication.user.name'),
    userEmail: Ember.computed.alias('authentication.user.email'),

    savingDesign: false,

    saveDesignToEmail(newUserEmail) {
        let self = this;
        self.set('savingDesign', true);

        return this.get('designController')
            .saveToEmail(newUserEmail)
            .then(function () {
                self.set('savingDesign', false);
            }, function () {
                // can't save
            });
    },

    actions: {
        outsideClick() {
            this.send('closeModal');
        },
        noop() {
        },
        closeModal() {
            this.set('modalOpen', false);
        },
        logIn(provider) {
            let auth = this.get('authentication');
            auth.attemptLogIn(provider).then((/*user*/) => {
                this.send('closeModal');
            });
        },
        logOut() {
            let auth = this.get('authentication');
            auth.invalidateSession();
            this.send('closeModal');
        },
        submit() {
            let newUserEmail = this.get('newUserEmail');
            let isEmailValid = this.get('isEmailValid');

            if (isEmailValid) {
                this.saveDesignToEmail(newUserEmail).then(() => {
                    this.send('logOut');
                });
            } else {
                this.send('logOut');
            }
        }
    }
});
