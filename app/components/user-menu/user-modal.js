import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    actions: {
        close: function () {
            this.set('menuOpen', false);
        },
        noop: function () {
        },
        openComingSoonModal(subject, title, subtitle) {
            this.sendAction('openComingSoonModal', subject, title, subtitle);
            this.send('close');
        },
        openAuthModal() {
            this.sendAction('openAuthModal');
            this.send('close');
        }
    }
});
