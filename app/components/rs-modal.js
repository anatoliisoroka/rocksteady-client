import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    modalClass: '',

    actions: {
        outsideClick: function () {
            this.set('modalOpen', false);
            this.sendAction('onClosed');
        }
    }
});
