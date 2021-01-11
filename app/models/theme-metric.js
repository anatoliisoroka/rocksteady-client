import DS from 'ember-data';

export default DS.Model.extend({
    themeId: DS.attr('string'),
    name: DS.attr('string'),
    value: DS.attr('number'),
    theme: DS.belongsTo('theme'),

    didLoad() {
        let store = this.get('store');
        let themeId = this.get('themeId');
        let theme = store.getById('theme', themeId);
        let metricName = this.get('name');
        let value = this.get('value');

        if (theme) {
            theme.set(metricName, value);
        }
    }
});
