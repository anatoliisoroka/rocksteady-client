import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
    i18n: Ember.inject.service(),
    name: DS.attr('string'),
    description: DS.attr('string'),
    inStock: DS.attr('boolean'),
    properties: function () {

        let properties = [];
        this.get('description').split(/\|/).forEach((description) => {
            const attrs = description.match(/\s*(.*?):(\d)\s*/);
            if (attrs) {
                properties.push({
                    name: attrs[1],
                    rating: +attrs[2],
                    ratingClass: `rating-${attrs[2]}`,
                    colourClass: 'blue'
                });
            }
        });
        return properties;

    }.property('description')

});
