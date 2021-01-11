/* global $ */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({
    templateName: 'design/editor/z_index_module',
    classNameBindings: ['rightAlign'],

    didInsertElement: function () {

        //tooltips
        if (config.APP.tooltips && this.$()) {
            this.$().find('button').each(function (index, button) {

                var name = $(button).attr('data-name');

                this.$('[data-name="' + name + '"]').tooltip({
                    placement: 'top',
                    'title': this.get('controller.i18n').t('editor.' + name.decamelize()).toString(),
                    html: false
                });

            }.bind(this));
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('[data-name]').tooltip('destroy');
        }
    }
});
