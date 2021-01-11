import DS from 'ember-data';

export default DS.Model.extend({
    name: DS.attr('string'),
    fontData: DS.attr('string'),
    isRegulation: DS.attr('boolean'),
    isDesigner: DS.attr('boolean'),
    swatchURL: undefined
});
