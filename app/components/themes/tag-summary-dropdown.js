import Ember from 'ember';

/** @namespace Ember.Component */
export default Ember.Component.extend({
    tagName: 'div',
    classNameBindings: [':theme-tag-list-wrapper', 'hasFilters:has-filters', 'open:open'],
    open: false,
    rowHeight: 28,
    elementHeight: 0,

    didInsertElement: function () {
        this.$(window).on('debouncedresize.theme-tags', () => {
            this.handleToggle();
        });
    },

    willDestroyElement: function () {
        this.$(window).off('debouncedresize.theme-tags');
    },

    handleToggle: function () {
        //Have to wait for DOM to update for new height of tags.
        Ember.run.scheduleOnce('afterRender', this, function () {
            let $tags = this.$('.theme-tag-list');
            let $tagsWrapper = this.$();

            if ($tags) {
                let isOpen = this.get('open');
                let scrollHeight = $tags.prop('scrollHeight');
                let rowHeight = this.get('rowHeight');
                let hasFilters = this.get('hasFilters');
                let hasSecondRow = this.get('hasSecondRow');
                let newHeight = isOpen ? scrollHeight : rowHeight;

                if (!hasFilters) {
                    newHeight = 0;
                }

                if (!hasSecondRow && hasFilters) {
                    newHeight = rowHeight;
                    this.set('open', false);
                }

                $tagsWrapper
                    .stop()
                    .animate({height: newHeight}, 300);
            }

        });
    }.observes('open', 'hasFilters', 'hasSecondRow', 'filters.length'),

    hasFilters: function () {
        let filters = this.get('filters');

        return filters && filters.length > 0;
    }.property('filters.length'),

    hasSecondRow: function () {
        let $tags = this.$('.theme-tag-list');
        let hasFilters = this.get('hasFilters');
        let rowHeight = this.get('rowHeight');
        let scrollHeight = $tags.prop('scrollHeight');

        return hasFilters && (scrollHeight > rowHeight);
    }.property('filters.length'),

    actions: {

        removeFilter: function (filter) {
            Ember.set(filter, 'active', false);
        },

        toggleOpen: function () {
            this.toggleProperty('open');
        }
    }
});
