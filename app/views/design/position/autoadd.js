/* global $ */

import Ember from 'ember';
import RsSingleComponentCanvas from '../../../lib/rs-single-component-canvas';

export default Ember.View.extend({
    templateName: 'design/position/autoadd',

    classNames: ['autoadd'],

    actions: {
        autoadd: function () {
            var view = this,
                controller = this.get('controller');

            controller.get('controllers.design/position').addPosition().then(function () {
                view.get('parentView.parentView').rerender().then(function () {
                    controller.transitionToRoute('design.selector');
                });
            });
        },

        hidePopover: function () {
            if (this.$()) {
                this.$().find('.modal').modal('hide');
            }
        }
    },

    didInsertElement: function () {

        var view = this;

        this._super();

        this.$().find('.modal')
            .modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', function () {
                if (!$('#error-modal:visible').length && view && view.get('controller')) {
                    view.get('controller').replaceRoute('design.selector');
                }
            }.bind(this));

        Ember.run.scheduleOnce('afterRender', this, this.renderCanvas.bind(this));
    },

    renderCanvas: function () {
        if (!this.$()) {
            return;
        }

        var options = {
            width: 200,
            height: 200,
            canvasType: 'static',
            canvasPadding: 5,
            maskOn: false,
            virtualContainerOn: true,
            dropShadow: true,
            virtualContainerSizeCue: this.get('virtualContainerSizeCue')
        };

        this.$().find('.canvas-wrapper').append(this.$('<canvas/>'));
        var $canvas = this.$().find('canvas');

        new RsSingleComponentCanvas($canvas[0],
            options,
            this.get('controller'),
            this.get('controller.model.defaultComponent'),
            this.get('controller.model.defaultComponent.activeShape'));
    }

});
