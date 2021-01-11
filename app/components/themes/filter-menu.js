import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    open: false,

    actions: {
        closeFilterMenu: function () {
            this.set('open', false);
        },

        setSortField: function (sortOrderSelection) {
            this.set('sortOrderSelection', sortOrderSelection);
        },

        clearAll: function () {
            this.sendAction('clearAllFilters');
        }
    }
});
