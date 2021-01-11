import Ember from 'ember';

export default Ember.Controller.extend({

    interview: null,
    design: null,
    checkout: null,
    isProgressBarVisible: false,

    actions: {

        interviewStage: function () {
            this.set('interview', true);
            this.set('design', false);
            this.set('checkout', false);
        },

        designStage: function () {
            this.set('interview', false);
            this.set('design', true);
            this.set('checkout', false);
        },

        checkoutStage: function () {
            this.set('interview', false);
            this.set('design', false);
            this.set('checkout', true);
        }
    }
});

