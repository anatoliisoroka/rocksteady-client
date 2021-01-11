import Ember from 'ember';

export default Ember.Controller.extend({

    needs: ['application'],

    conditionsTemplate: function () {
        return 'design/terms/termsAndConditions-' + this.get('controllers.application.locale');
    }.property('controllers.application.locale')
});
