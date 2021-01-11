import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'button',
    classNames: ['options-menu-button'],
    attributeBindings: ['id', 'title', 'type'],
    type: 'button',

    click() {
        this.send('toggleOptions');
    },

    actions: {
        toggleOptions: function () {
            this.set('menuOpen', !this.get('menuOpen'));
            this.$().tooltip('hide');
        }
    }
});
