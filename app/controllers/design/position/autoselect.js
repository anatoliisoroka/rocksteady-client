/* global logger */

import Ember from 'ember';
import config from '../../../config/environment';
import PositionController from '../position';

export default Ember.Controller.extend({

    needs: ['application', 'design/selector', 'design/position'],

    position: Ember.computed.alias('controllers.design/position.model'),
    oppositePosition: Ember.computed.alias('controllers.design/position.oppositePosition'),

    oppositePositionMatchingShape: function () {

        if (!this.get('oppositePosition.componentShapes.length')) {
            logger.warn('AutoSelectOppositePositionWarning', 'Could not auto-select alternative for position ' + this.get('position').toString() + ' at index ' + this.get('model.index') + ' because opposite position ' + this.get('oppositePosition').toString() + ' has no component shapes.');
            return null;
        }

        var oppositeComponentShape = this.get('oppositePosition').getComponentShapeAtIndex(parseInt(this.get('model.index')));

        if (!oppositeComponentShape) {
            logger.warn('AutoSelectOppositePositionMatchingShapeWarning', 'Could not auto-select alternative  for position ' + this.get('position').toString() + ' at index ' + this.get('model.index') + ' because opposite position ' + this.get('oppositePosition').toString() + ' has no matching component shape');
            return null;
        }

        return oppositeComponentShape;

    }.property('oppositePosition', 'model.index'),

    actions: {
        autoselect: function () {
            this.get('controllers.application').send('pushSpinner');

            Ember.run.later(this, function () {
                if (config.APP.features.auto_select && this.get('oppositePositionMatchingShape')) {
                    PositionController.create({
                            model: this.get('oppositePosition'),
                            store: this.store,
                            container: this.container})
                        .setAlternativeShape(
                            this.get('oppositePositionMatchingShape').component,
                            this.get('oppositePositionMatchingShape').shape);
                }

                this.get('controllers.design/selector').rerender().then(function () {
                    this.get('controllers.application').send('popSpinner');
                    this.replaceRoute('design.selector');
                }.bind(this));
            }, 100);
        }
    }

});
