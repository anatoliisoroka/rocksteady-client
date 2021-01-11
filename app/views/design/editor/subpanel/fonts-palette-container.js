import Ember from 'ember';

export default Ember.View.extend({
    tagName: 'div',
    templateName: 'design/editor/subpanel/fonts-palette-container',

    allFontsShown: false,
    filterValue: '',
    filteredFonts: function () {
        var fontCollection = this.get('allFonts');
        var filterValue = this.get('filterValue');
        if (filterValue !== '') {
            return fontCollection.filter(function (font) {
                return font.get('name').toLowerCase().indexOf(filterValue.toLowerCase()) > -1;
            });
        } else {
            return fontCollection;
        }
    }.property('filterValue'),

    activeProperty: function () {
        return this.get('controller.controllers.design/editor').get('activeProperty');
    }.property(),

    actions: {
        showAllFonts () {
            this.set('parentView.moreResultsShown', true);
        }
    }
});
