import DS from 'ember-data';

export default DS.Model.extend({
    emailAddress: DS.attr('string'),
    design: DS.belongsTo('design'),
    selector: DS.attr('string')
});
