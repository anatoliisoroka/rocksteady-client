import DS from 'ember-data';
import RouteSlugMixin from '../mixins/route-slug';

export default DS.Model.extend(RouteSlugMixin, {
    name: DS.attr('string'),
    children: DS.hasMany('use', {inverse: 'parent'}),
    parent: DS.belongsTo('use', {inverse: 'children'})
});
