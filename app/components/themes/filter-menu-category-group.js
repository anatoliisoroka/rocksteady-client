import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    showMoreLimit: 10,
    showAll: false,

    hasMoreFilters: function () {
        let showMoreLimit = this.get('showMoreLimit');
        let visibleFilters = this.get('visibleFilters');
        return visibleFilters.length > showMoreLimit;
    }.property('visibleFilters'),

    visibleFilters: Ember.computed.alias('values'),

    initiallyVisibleFilters: function () {
        let showMoreLimit = this.get('showMoreLimit');
        let visibleFilters = this.get('visibleFilters');
        return visibleFilters.slice(0, showMoreLimit);
    }.property('visibleFilters.@each'),

    remainingFilters: function () {
        let showMoreLimit = this.get('showMoreLimit');
        let visibleFilters = this.get('visibleFilters');
        return visibleFilters.slice(showMoreLimit);
    }.property('visibleFilters.@each'),

    actions: {
        showAllFilters: function () {
            this.set('hasMoreFilters', false);
            this.set('showAll', true);
        }
    }
});
