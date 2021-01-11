import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    open: false,
    click: function () {
        this.toggleProperty('open');
    }
});
