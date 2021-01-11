import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
    name: DS.attr('string'),
    price: DS.attr('number'),
    tags: DS.attr('raw'),
    author: DS.attr('string'),
    previewURL: DS.attr('string'),
    features: DS.hasMany('feature'),
    fattributes: DS.hasMany('fattribute'),
    graphics: DS.hasMany('graphic', {async: true}),
    designURL: DS.attr('string'),
    productLineName: DS.attr('string'),
    targetName: DS.attr('string'),
    targetCategoryName: DS.attr('string'),
    manufacturerName: DS.attr('string'),
    groupedYear: DS.attr('string'),
    ruleSetName: DS.attr('string'),
    useCategoryName: DS.attr('string'),
    usePath: DS.attr('string'),
    previews: DS.attr('raw'),
    filters: DS.attr('raw'),
    flags: DS.attr('raw'),
    category: DS.attr('string'),
    regulation: DS.attr('raw'),
    designTime: DS.attr('number'),
    designer: DS.attr('raw'),
    description: DS.attr('string'),
    metrics: DS.attr('raw'),

    bookmark: DS.belongsTo('bookmarked-theme'),
    viewed: DS.belongsTo('viewed-theme'),

    //Used for natural sorting (as they appear in the spreadsheets)
    numericId: function () {
        let alphanumericId = this.get('id');
        let numericIdRe = /-(\d{1,5})/;
        let matches = numericIdRe.exec(alphanumericId);
        if (matches && matches[1]) {
            return parseInt(matches[1]);
        }
        return 0;
    }.property('id'),

    //Filters are combined from each theme to create the filter menu selections
    filtersFlattened: function () {
        let filtersFlattened = Ember.A();
        let themeFilters = this.get('filters') || [];

        themeFilters.forEach(function (filter) {
            filter.ordered_values.forEach(function (value) {
                filtersFlattened.push({
                    name: value,
                    active: false,
                    category: filter.name
                });
            });
        });

        return filtersFlattened;
    }.property('filters', 'tagsFlattened'),

    isRegulated: function () {
        return this.get('regulation.name');
    }.property('regulation.name')
});
