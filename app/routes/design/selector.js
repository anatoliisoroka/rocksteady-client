import Ember from 'ember';
import PositionController from '../../controllers/design/position';
import rsLogger from '../../lib/rs-logger';

const loggerPath = 'routes__selector';

export default Ember.Route.extend({
    model: function () {
        return this.modelFor('design');
    },
    afterModel (design) {
        const applicationController = this.controllerFor('application');
        if (applicationController.get('bootstrapBreakpoint') !== 'xs') {
            applicationController.send('popSectionSpinner');
        }
        const selectorController = this.controllerFor('design.selector');
        return this.getAvailableThemes(design)
            .then((themes) => {
                selectorController.set('availableThemes', themes.get('length'));
            })
            .catch((err) => {
                rsLogger.error(`${loggerPath}__after_model`, err);
                selectorController.set('availableThemes', 0);
            })
            .finally(() =>
                applicationController.send('popSpinner')
            );
    },
    setupController(controller, model) {
        // Solve issues around the observer not firing in the slidePanel
        controller.set('activeAccentColourGroup', null);
        controller.set('slidePanelOpen', false);
        this._super(...arguments);
    },
    getAvailableThemes (design) {
        const target_name = design.get('target.name');
        const target_category_name = design.get('targetCategory.name');
        const productLineNameMissing = !design.get('productLine.name');
        const productLineName = productLineNameMissing ? 'Motorbike Decals' : design.get('productLine.name');
        const themeParams = Object.assign(
            {},
            {
                product_line_name: productLineName,
                manufacturer_name: design.get('manufacturer.name'),
                grouped_year: design.get('targetKit.name')
            },
            target_name ? { target_name } : target_category_name ? { target_category_name } : {}
        );
        if (productLineNameMissing) {
            rsLogger.error(
                `${loggerPath}__get_available_themes`,
                'Product Line name is missing in the design.'
            );

            rsLogger.warn(
                `${loggerPath}__get_available_themes`,
                `Default value of "${productLineName}" has been used in order to fetch the available themes`
            );
        }
        return this.store.find('theme', themeParams);
    },
    allowUserToDismissSmallScreenModal : function(){
        const helloSmallScreenModal = this.controllerFor('application').get('helloSmallScreenModal');
        if (helloSmallScreenModal.shown === true) {
            this.controllerFor('application').set('helloSmallScreenModal.isDismissable', true);
        }
    },
    removeComponentsWithZeroQuantity: function(){
        this.controllerFor('design').send('removeComponentsWithZeroQuantity');
    },
    startSaveTimerIfNeeded: function () {
        if (this.get('controller.model') && this.get('controller.model.isDirty')) {
            this.get('controller.controllers.design').startSaveTimerIfNeeded();   // save when first time created kit
        }
    },
    handleOppositePositionClone (positionToMirror) {
        const oppositePosition = PositionController
            .create({ model: positionToMirror, container: this.container })
            .get('oppositePosition');

        if (oppositePosition) {
            oppositePosition
                .save()
                .then((savedPosition) => {
                    Ember.run.later(
                        this,
                        () => this.replaceWith('design.position.automirror', savedPosition.get('id')),
                        2000
                    );
                });
        }
    },
    handleDirtyPosition (dirtyPosition) {
        dirtyPosition
            .save()
            .then((savedPosition) => this.handleOppositePositionClone(savedPosition));
    },
    showAutoMirrorPromptIfNecessary () {
        if (this.controllerFor('design').get('model.doNotShowAutoMirrorAgain')) {
            return;
        }

        const dirtyPosition = this
            .get('controller.model.positions')
            .findBy('isDirty');

        if (dirtyPosition) {
            this.handleDirtyPosition(dirtyPosition);
        }
    },
    setupRouterTransitionRunLoop: function () {
        Ember.run.scheduleOnce('routerTransitions', this,  () => {
            this.controllerFor('interview').get('controllers.progressBar').send('designStage');
            this.startSaveTimerIfNeeded();
            this.showAutoMirrorPromptIfNecessary();
        });
    },
    activate: function () {
        this._super();
         //let the user dismiss the hello small
        this.allowUserToDismissSmallScreenModal();
        this.removeComponentsWithZeroQuantity();
        this.setupRouterTransitionRunLoop();
    }
});
