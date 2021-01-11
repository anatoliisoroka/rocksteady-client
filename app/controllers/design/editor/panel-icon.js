import Ember from 'ember';

export default Ember.Controller.extend({
    needs: ['design', 'design/editor', 'application', 'design/editor/feature', 'design/editor/feature/uploadImage'],

    isTouch: Ember.computed.alias('controllers.application.isTouch'),
    isGraphicIcon: Ember.computed.alias('controllers.design/editor/feature.featureIsIcon'),

    recent3Graphics: Ember.computed.alias('controllers.design/editor/feature.recent3Graphics'),
    recent3FillColours: Ember.computed.alias('controllers.design/editor/feature.recent3FillColours'),
    recent3Stroke1Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke1Colours'),
    recent3Stroke2Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke2Colours'),
    recent3Stroke3Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke3Colours'),
    recent3Stroke4Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke4Colours'),
    iconIsMonocolour: Ember.computed.alias('controllers.design/editor/feature.iconIsMonocolour'),

    userAddedGraphicMax: function () {
        return this.get('controllers.application.config.APP.image_upload_max_scale');
    }.property('controllers.application.config.APP.image_upload_max_scale'),

    _flip (axis) {
        const key = `flip${axis.toUpperCase()}`;

        this.get('model')
            .setAndTrackAttributes([{ key, value: !this.get(`model.${key}`) }]);
    },

    actions: {
        navigateToStroke1Subpanel: function () {
            this.get('controllers.design/editor').set('activeProperty', 'strokeStyle1');
        },
        flipVertical: function () {
            this._flip('y');
        },
        flipHorizontal: function () {
            this._flip('x');
        },
        featureBackwards: function () {
            this.get('controllers.design/editor').send('featureBackwards');
        },
        featureForwards: function () {
            this.get('controllers.design/editor').send('featureForwards');
        },
        featureToFront: function () {
            this.get('controllers.design/editor').send('featureToFront');
        },
        featureToBack: function () {
            this.get('controllers.design/editor').send('featureToBack');
        },
        showMaximumScaleWarning: function () {
            var t = this.get('i18n').t.bind(this.get('i18n'));

            if (this.get('model.isUserAddedGraphic')) {
                this.get('controllers.application').send(
                    'toast',
                     t('editor.maximum_scale_user_added_graphic_warning').toString(),
                    'warning',
                    'toast-maximum-scale-user-added-graphic'
                );
            }
        }
    }
});
