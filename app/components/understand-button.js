import Ember from 'ember';

export default Ember.Component.extend({
    iUnderstand: false,
    iDontUnderstand: Ember.computed.not('iUnderstand'),

    actions: {
        doAction: function () {
            if (this.get('target') === 'self') {
                this.send(this.get('action'));
            } else if (this.get('target') === 'view') {
                this.get('parentView').send(this.get('action'));
            } else {
                this.get('parentView.controller').send(this.get('action'));
            }
        },

        dismissUserTour: function () {
            window.tourMediator.trigger('close');
        }
    }
});
