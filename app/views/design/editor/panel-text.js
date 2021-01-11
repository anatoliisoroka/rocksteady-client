import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({
    didInsertElement: function () {
        if (config.APP.tooltips && this.$()) {
            this.$().find('[title]').tooltip({container: 'body' });
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('[title]').tooltip('destroy');
        }
    }
});
