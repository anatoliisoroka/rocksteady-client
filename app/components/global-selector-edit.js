import Ember from 'ember';

export default Ember.Component.extend({
    actions: {
        hide() {
            this.sendAction('hideAction');
        },
        openClearModal(title) {
            this.sendAction('openClearModalAction', title);
        }
    }
});
