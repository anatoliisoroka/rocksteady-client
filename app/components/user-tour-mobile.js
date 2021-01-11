import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',

    didInsertElement () {
        this.$().find('.modal').modal('show');
    }
});
