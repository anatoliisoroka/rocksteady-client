import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    actions: {
        openComingSoonModal (subject, title, subtitle) {
            this.sendAction('openComingSoonModal', subject, title, subtitle);
        },
        openAuthModal(){
            this.sendAction('openAuthModal');
        }
    }
});
