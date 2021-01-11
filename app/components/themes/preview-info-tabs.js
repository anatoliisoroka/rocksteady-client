import Ember from 'ember';

export default Ember.Component.extend({
    store: Ember.inject.service(),
    tagName: 'div',
    themeSummary: null,

    designTimeText: function () {
        let designTimeInSeconds = this.get('theme.designTime');

        return Math.ceil(designTimeInSeconds / 60 / 60);
    }.property('theme.deignTime'),

    regionFlagUrl: function () {
        let regionId = this.get('theme.designer.nationality.region_id');
        let region = this.get('store').getById('region', regionId);
        if (region) {
            return region.get('imageUrl');
        } else {
            return '';
        }
    }.property('theme.designer.nationality.region_id'),

    specialityText: Ember.computed.alias('theme.designer.speciality.text'),

    hasProductLineIds: function () {
        let productLineIds = this.get('theme.designer.speciality.product_line_ids');
        return productLineIds && (productLineIds.length > 0);
    }.property('theme.designer.speciality.product_line_ids'),

    productLines: function () {
        let productLineIds = this.get('theme.designer.speciality.product_line_ids');
        let self = this;

        return productLineIds.map(function (productLineId) {
            let productLine = self.get('store').getById('productLine', productLineId);
            return productLine;
        });
    }.property('theme.designer.speciality.product_line_ids'),


    regulationNames: function(){
        let regulationNameString = this.get('theme.regulation.name');
        return regulationNameString.split(' / ');
    }.property('theme.regulation.name'),

    actions: {
        closeInfo: function () {
            this.set('infoOpen', false);
        }
    }
});
