import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    actions: {
        saveDesign: function () {
            this.sendAction('saveDesign');
        },
        socialShare: function () {
            this.sendAction('socialShare');
        },
        openComingSoonModal (subject, title, subtitle) {
            this.sendAction('openComingSoonModal', subject, title, subtitle);
        },
        openSubmitDesignModal () {
            this.sendAction('openSubmitDesignModal');
        }
    }
});
