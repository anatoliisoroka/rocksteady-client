import Ember from 'ember';

export default Ember.Controller.extend({
    designService: Ember.inject.service('design-service'),
    exportThemeService: Ember.inject.service('export-theme-service'),

    actions: {
        exportTheme (themeName) {
            this.get('exportThemeService')
                .exportTheme(this.get('model'), themeName);
        }
    }
});
