import Ember from 'ember';
import DS from 'ember-data';
import RouteSlugMixin from '../mixins/route-slug';

export default DS.Model.extend(RouteSlugMixin, {

    i18n: Ember.inject.service(),

    iso_alpha_2: DS.attr('string'),
    iso_numeric: DS.attr('string'),
    slug: Ember.computed.alias('iso_alpha_2'),
    code: Ember.computed.alias('iso_alpha_2'),
    currency: DS.belongsTo('currency'),
    addressFormat: DS.attr('raw'),
    priority: DS.attr('number'),
    imageUrl: DS.attr('string'),
    graphicId: DS.attr('number'),
    addressFields: function () {

        var subRegion = this.translateField('subRegion') || this.get('i18n').t('formInputLabels.form_input_state');
        var postCode  = this.translateField('postCode')  || this.get('i18n').t('formInputLabels.form_input_postcode');
        var address1  = this.translateField('address1')  || this.get('i18n').t('formInputLabels.form_input_address_line_1');
        var address2  = this.translateField('address2')  || this.get('i18n').t('formInputLabels.form_input_address_line_2');
        var city      = this.translateField('city')      || this.get('i18n').t('formInputLabels.form_input_city');

        return {
            subRegion: subRegion,
            postcode:  postCode,
            address1:  address1,
            address2:  address2,
            city: city
        };

    }.property('addressFormat'),

    translateField: function (field_name) {
        var address_key = this.get('addressFormat.' + field_name).underscore().replace(/\_\/\_/g, '_');

        if (address_key) {
            return this.get('i18n').t('formInputLabels.form_input_' + address_key);
        }

        return null;
    },

    name: Ember.computed.alias('translatedRegionName'),
    nationality: Ember.computed.alias('translatedNationality'),

    translatedRegionName: function () {
        return this.get('i18n').t('region.' + this.get('code')).toString();
    }.property('code'),

    translatedNationality: function () {
        return this.get('i18n').t('nationality.' + this.get('code')).toString();
    }.property('code')

});
