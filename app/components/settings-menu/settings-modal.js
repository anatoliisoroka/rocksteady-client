import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    actions: {
        closeSettings: function () {
            this.set('menuOpen', false);
        },
        saveDesign: function () {
            this.sendAction('saveDesign');
        },
        socialShare: function () {
            this.sendAction('socialShare');
        },
        openComingSoonModal (subject, title, subtitle) {
            this.sendAction('openComingSoonModal', subject, title, subtitle);
            this.send('closeSettings');
        },
        openSubmitDesignModal () {
            this.sendAction('openSubmitDesignModal');
            this.send('closeSettings');
        },
        noop: function () {
        }
    }
});
