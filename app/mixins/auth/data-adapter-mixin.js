import Ember from 'ember';

export default Ember.Mixin.create({
    authentication: Ember.inject.service('authentication'),

    ajaxOptions() {
        let hash = this._super(...arguments);
        let {beforeSend} = hash;

        hash.beforeSend = (xhr) => {

            let token = this.get('authentication.token');

            if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            }

            if (beforeSend) {
                beforeSend(xhr);
            }
        };
        return hash;
    },

    ajaxError(jqXHR) {
        let status = jqXHR.status;
        this.ensureResponseAuthorized(status);
    },

    ensureResponseAuthorized(status/* ,headers, payload, requestData */) {
        if (status === 401) {
            this.get('authentication').invalidateSession();
        }
    }
});
