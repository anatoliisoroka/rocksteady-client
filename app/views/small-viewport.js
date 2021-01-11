import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'small-viewport',

    didInsertElement: function () {
        this.$().find('#viewport-too-small').removeAttr('style');
    }
});
