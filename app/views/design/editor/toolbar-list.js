/* global $ */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({
    tagName: 'ul',
    templateName: 'design/editor/toolbar_list',
    classNames: ['toolbar-list'],

    didInsertElement: function () {
        this._super();

        //tooltips
        if (config.APP.tooltips) {

            this.$().find('[name]').each(function (index,el) {

                var name = $(el).attr('name');

                this.$('[name="' + name + '"]').tooltip({
                    placement: 'bottom',
                    title: this.get('controller.i18n').t('editor.' + name.decamelize()).toString(),
                    html: false,
                    container: 'body'
                });

            }.bind(this));
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips) {
            this.$().find('[name]').tooltip('destroy');
        }
    },

    isTouch: Ember.computed.alias('controller.controllers.application.isTouch'),

    actions: {
        addGraphic: function () {
            // Defining events here and delgating to the
            // controller in case any extra dom manipulation
            // required at this stage
            this.get('controller').send('addGraphic');
        },

        addText: function () {
            // Defining events here and delgating to the
            // controller in case any extra dom manipulation
            // required at this stage
            this.get('controller').send('addText');
        },

        editText: function () {
            this.get('controller').set('removedFeaturesPanelOn', false);
            this.get('controller').send('backToMainPanel');
        }
    }
});
