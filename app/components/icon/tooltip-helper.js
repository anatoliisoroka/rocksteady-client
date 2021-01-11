import Ember from 'ember';
import config from '../../config/environment';

export default Ember.Component.extend({
    tagName: 'div',
    text: '',

    didInsertElement: function () {
        if (config.APP.tooltips && this.$()) {
            this.$().tooltip({
                title: this.get('text'),
                container: 'body'
            });
        }
    },
});
