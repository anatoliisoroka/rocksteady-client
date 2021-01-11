import Ember from 'ember';
import DS from 'ember-data';
import logger from '../lib/rs-logger';

export default DS.Model.extend({
    name: DS.attr('string'),
    displayRgb: DS.attr('string'),
    indexedRgb: DS.attr('string'),
    printCmyk: DS.attr('string'),
    contrastingIds: DS.attr('string'),
    complementaryIds: DS.attr('raw'),
    design: DS.belongsTo('design'),
    contrastingId: Ember.computed.alias('contrastingIds'),
    group: DS.attr('string'),
    groupDefault: DS.attr('boolean'),
    contrastingColours: function () {
        return this._getAssociatedColoursByIds('contrastingIds');
    }.property('contrastingIds'),
    complementaryColours: function () {
        return this._getAssociatedColoursByIds('complementaryIds');
    }.property('complementaryIds'),
    didLoad: function () {
        if (this.get('displayRgb')) {
            this.set('displayRgb', this.get('displayRgb').toLowerCase());
        }
    },
    isValid: function () {
        return !!(/^#[\dabcdef]{6}$/.exec(this.get('displayRgb')));
    }.property('displayRgb'),
    _getAssociatedColoursByIds(idPropertyName) {
        const associatedIds = [].concat(this.get(idPropertyName));
        const associatedColours = associatedIds.map((colourId) => {
            if (!this.get('store').getById('colour', colourId)) {
                logger.warn('Missing Colours - ' + idPropertyName + ' reference not found id: ' + colourId + ' in colour with id: ' + this.get('id'));
            }
            return this.get('store').getById('colour', colourId);
        }).compact();
        return associatedColours;
    },
});
