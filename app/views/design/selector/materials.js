/* globals $ */

import Ember from 'ember';
import config from '../../../config/environment';


export default Ember.View.extend({
    templateName: 'design/selector/materials',
    classNames: ['material-selector'],

    isMobile: Ember.computed.equal('controller.controllers.application.bootstrapBreakpoint', 'xs'),

    didInsertElement: function () {
        var view = this;
        var modal = this.$().find('.modal');

        modal.modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', function () {
                Ember.run(function () {
                    if (!$('#error-modal:visible').length && view && view.get('controller')) {
                        view.get('controller').replaceRoute('design.selector');
                    }
                });
            }.bind(this));

        $(window).on('debouncedresize.materials', function () {
            view.get('controller').replaceRoute('design.selector');
        });

        if (this.get('isMobile')) {
            this.hideZopim();
        }

        this._super();
    },

    willDestroyElement: function () {
        $(window).off('debouncedresize.materials');
        if (this.get('isMobile')) {
            this.showZopim();
        }
    },

    hideZopim: function () {
        if (config.zopim && typeof $zopim !== 'undefined') {
            $zopim.livechat.hideAll();
        }
    },

    showZopim: function () {
        if (config.zopim && typeof $zopim !== 'undefined') {
            $zopim.livechat.button.show();
        }
    }
});
