import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    iconClass: Ember.computed('baseIconClass', 'disabled', function () {
        return `${this.get('baseIconClass')}${this.get('disabled') ? '-disabled' : ''}`;
    }),

    actions: {
        trigger () {
            this.sendAction();
        }
    }
});
