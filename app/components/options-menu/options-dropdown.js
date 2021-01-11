import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    actions: {
        outsideClick: function () {
            this.set('menuOpen', false);
        }
    }
});
