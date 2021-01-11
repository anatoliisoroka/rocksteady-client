import Ember from 'ember';

export default Ember.Component.extend({

    tagName: 'li',
    attributeBindings: ['name'],

    click: function () {
        if (this.get('enabled')) {
            this.sendAction('action', this.get('propertyName'));
        }
    },

    // a tab is enabled if it is available for use
    isEnabledObserver: function () {
        this.$().find('a').toggleClass('disabled', !this.get('enabled'));
    }.observes('enabled').on('didInsertElement'),

    //a selected tab is brought to the front
    isSelectedObserver: function () {
        this.$().toggleClass('selected', this.get('property'));
    }.observes('property').on('didInsertElement'),

    //a tab is active if it is IN use.
    isActiveObserver: function () {
        this.$().find('a').toggleClass('inactive', !this.get('active'));
        this.$().find('a').toggleClass('active', this.get('active'));
    }.observes('active').on('didInsertElement'),

    colourObserver: function () {
        var colourValue = this.get('value');

        if (this.get('enabled') && this.get('active')) {
            this.$().find('a').css({
                'border-top': '8px solid ' + colourValue
            });
        } else {
            this.$().find('a').css({
                'border-top': '8px solid transparent'
            });
        }
    }.observes('value', 'enabled', 'active').on('didInsertElement')
});
