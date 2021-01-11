import DS from 'ember-data';
import RouteSlugMixin from '../mixins/route-slug';

export default DS.Model.extend(RouteSlugMixin, {
    country: DS.attr('string', {defaultValue: 'US'}),

    didLoad: function () {
        const country = (this.get('country') || '').toLowerCase();
        //http://dev.maxmind.com/geoip/legacy/codes/iso3166/
        if (country === '' || country === 'a1' || country === 'a2' || country === '01') {
            this.set('country', 'US');
        }
    }
});
