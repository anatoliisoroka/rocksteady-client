import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: ['theme-preview-description-summary'],
    summary: '',
    open: false,
    click: function () {
        this.toggleProperty('open');
    }
});
