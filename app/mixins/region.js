import Ember from 'ember';

/*
 *Mix this in to any controller that uses a combo-box with regions in it.
 */

export default Ember.Mixin.create({

    init: function () {
        this._super();
        this.set('regions', this.store.all('region'));
    },

    regions: Ember.A(),

    sortedRegions: function () {
        return Ember.ArrayController.create({
            content: this.get('regions'),
            sortProperties: ['priority', 'name'],
            sortAscending: true
        }).get('arrangedContent');
    }.property('regions.@each'),

    actions: {
        selectRegion: function (region, context) {
            this.set(context, region);
        }
    },

    regionFilter: '',

    filteredRegions: Ember.computed.oneWay('sortedRegions'),

    // Example of ES6 object literal!

    _regionFilterer () {
        var filter = this.get('regionFilter').toLowerCase();

        if (!this.get('filterBy')) {
            this.set('filterBy', 'name');
        }

        // Example of ES6 fat arrow!

        this.set('filteredRegions', this.get('sortedRegions').filter(r => r.get(this.get('filterBy')).toLowerCase().indexOf(filter) === 0));
    },

    regionFilterer: function () {
        Ember.run.debounce(this, this._regionFilterer, 500);
    }.observes('regionFilter')

});
