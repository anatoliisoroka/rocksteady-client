import Ember from 'ember';

export default Ember.View.extend({

    didInsertElement: function () {
        this.get('controller.controllers.application').send('showApplicationError', this.get('controller.e'));
    }
});
