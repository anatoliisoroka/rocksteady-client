import Ember from 'ember';

export default Ember.Route.extend({
    model ({ theme_name }) {
        this.set('themeName', theme_name);
        return this.store.all('design').get('lastObject');
    },
    actions: {
        didTransition () {
            this.controller.send('exportTheme', this.get('themeName'));
        }
    }
});
