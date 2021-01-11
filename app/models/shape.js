import Ember from 'ember';
import DS from 'ember-data';
import config from '../config/environment';

export default DS.Model.extend({

    components: DS.hasMany('component', { inverse: 'shapes' }),
    width: DS.attr('number'),
    height: DS.attr('number'),
    svg: DS.attr('string'),
    internal_id: DS.attr('number'),
    name: DS.attr('string'),
    shareable: DS.attr('boolean'),
    design: DS.belongsTo('design'),
    qron: DS.attr('raw'),     // positional information about the qron
    decal_prices: DS.attr('raw'),
    initialFeaturePosition: DS.attr('string'),
    positionsIndex: DS.attr('raw'),     // where does this shape initially appear in a positions alternate shapes view
    printOffset: DS.attr('raw'),
    qronFeature: null,               // the actual generated qron feature
    area: Ember.computed('width', 'height', function () {
        return this.get('width') * this.get('height');
    }),

    displayName: function () {
        if (!Ember.isEmpty(this.get('name'))) {
            return this.get('name');
        } else {
            //return 'Shape ' + this.get('internal_id');
            return '';
        }
    }.property('name'),

    qronSize: function () {
        return config.APP.motocal_mm_px_ratio * config.APP.qron_size_mm;
    }.property(),

    widthWithQRON: function () {
        if (this.get('qron.centre_x') + this.get('qronSize') / 2 > this.get('width')) {
            return this.get('qron.centre_x') + this.get('qronSize') / 2 + config.APP.qron_print_margin;
        } else {
            return this.get('width');
        }
    }.property('width', 'qron'),

    heightWithQRON: function () {
        if (this.get('qron.centre_y') + this.get('qronSize') / 2 > this.get('height')) {
            return this.get('qron.centre_y') + this.get('qronSize') / 2 + config.APP.qron_print_margin;
        } else {
            return this.get('height');
        }
    }.property('height', 'qron')

});
