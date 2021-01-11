import DS from 'ember-data';

export default DS.Model.extend({
    themeId: DS.attr('string'),
    theme: DS.belongsTo('theme'),

    didLoad() {
        let store = this.get('store');
        let themeId = this.get('themeId');
        let theme = store.getById('theme', themeId);

        if (theme) {
            theme.set('viewed', this);
        }
    }
});
