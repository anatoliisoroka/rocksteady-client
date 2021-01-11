import Ember from 'ember';

/**
 * Mix this in to any controller that uses a combo-box with shippingOptions in it.
 * Provide shippingOptions from the controller.
 */
export default Ember.Mixin.create({

    init: function () {
        this._super();
    },

    selectedShippingOption: undefined,

    sortedShippingOptions: function () {
        return Ember.ArrayController.create({
            content: this.get('shippingOptions'),
            //sortProperties: ['priority', 'name'],
            sortAscending: true
        }).get('arrangedContent');
    }.property('shippingOptions'),

    actions: {
        selectShippingOption: function (shippingOption, context) {
            this.set(context, shippingOption);
        }
    },

    shippingOptionFilter: '',

    filteredShippingOptions: Ember.computed.oneWay('sortedShippingOptions'),

    _shippingOptionFilterer () {
        var filter = this.get('shippingOptionFilter').toLowerCase();

        this.set('filteredShippingOptions', this.get('sortedShippingOptions').filter((shippingOption) => {
            return shippingOption.get('cost')
                    .toString()
                    .toLowerCase()
                    .indexOf(filter) >= 0 ||
            shippingOption.get('time')
                    .toString()
                    .toLowerCase()
                    .indexOf(filter) >= 0;
        }));
    },

    shippingOptionFilterer: function () {
        Ember.run.debounce(this, this._shippingOptionFilterer, 500);
    }.observes('shippingOptionFilter')

});
