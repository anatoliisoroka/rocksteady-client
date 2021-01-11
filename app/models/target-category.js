import DS from 'ember-data';
import RouteSlugMixin from '../mixins/route-slug';

export default DS.Model.extend(RouteSlugMixin, {
    name: DS.attr('string'),
    colourPalette: DS.belongsTo('colourPalette'),
    imageUrl: DS.attr('string')
});
