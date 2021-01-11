import Ember from 'ember';

export default Ember.View.extend({
    tagName: 'div',
    templateName: 'design/editor/subpanel/palette-container',

    allColoursShown: false,
    filterValue: '',
    filteredColours: function () {
        var colourCollection = this.get('allColours');
        var filterValue = this.get('filterValue');
        if (filterValue !== '') {
            return colourCollection.filter(function (colour) {
                return colour.get('name').toLowerCase().indexOf(filterValue.toLowerCase()) > -1;
            });
        } else {
            return colourCollection;
        }
    }.property('filterValue'),

    activeProperty: function () {
        return this.get('controller.controllers.design/editor').get('activeProperty');
    }.property(),

    actions: {
        showAllColours () {
            this.set('parentView.moreResultsShown', true);
        }
    }
});
