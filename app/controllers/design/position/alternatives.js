import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Controller.extend(Ember.Evented, {

    needs: ['application', 'design/selector', 'design/position'],

    chosenShape: {},

    actions: {
        chooseShape: function (component, shape, index, imgDataURL) {
            this.set('chosenShape', {
                component: component,
                shape: shape,
                index: index,
                imgDataURL: imgDataURL
            });
            this.trigger('chooseShape');
        },
        applyNewShape () {
            this.get('controllers.application').send('pushSpinner');

            Ember.run.later(this, function () {
                this.get('controllers.design/position').setAlternativeShape(this.chosenShape.component, this.chosenShape.shape);

                var oppositePosition = this.get('controllers.design/position.oppositePosition');

                this.get('controllers.design/selector').rerender().then(function () {
                    this.get('controllers.application').send('popSpinner');

                    if (oppositePosition && config.APP.features.auto_select) {
                        this.replaceRoute('design.position.autoselect', this.chosenShape.index);
                    } else {
                        this.replaceRoute('design.selector');
                    }
                }.bind(this));
            }, 100);
        }
    }

});
