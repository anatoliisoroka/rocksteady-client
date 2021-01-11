import DS from 'ember-data';

export default DS.Model.extend({
    design: DS.belongsTo('design'),
    selector: DS.attr('string'),
    url: DS.attr('string'),
    description: DS.attr('string')
});
