/* global $, $zopim */

import Ember from 'ember';
import config from '../../config/environment';

export default Ember.View.extend({
    fabricMapCanvasView: null,
    isTouch: Ember.computed.alias('controller.controllers.application.isTouch'),
    isMobile: Ember.computed.equal('controller.controllers.application.bootstrapBreakpoint', 'xs'),
    tourPosition: Ember.computed.alias('controller.model.furthestRightPosition'),

    didInsertElement: function () {
        const view = this;
        const isMobile = this.get('isMobile');

        Ember.run.later(this, function () {
            if (view && !view.get('isDestroyed') && view.get('controller.controllers.application')) {
                if (isMobile) {
                    Ember.run.later(view, function () {
                        if (view && !view.get('isDestroyed') && view.get('controller.controllers.design')) {
                            view.get('controller.controllers.design').promptToSave();
                        }
                    }, config.APP.toastr_timeout);
                }
            }
        }, 1000);

        Ember.run.scheduleOnce('afterRender', this, function () {
            this.initGlobalEditComponent();
            if (!isMobile) {
                this.initUserTour();
            }
        });
    },

    willDestroyElement: function () {
        this.get('controller.controllers.application').off('showUserTour-selectmap');
        this.get('controller.controllers.application').off('completeUserTour');
        $('.selectmap-single-position-canvas').remove();
    },

    observeGlobalSelectorEdit: function () {
        let showGlobalSelectorEdit = this.get('controller.showGlobalSelectorEdit');
        const isMobile = this.get('isMobile');
        const isTouch = this.get('isTouch');

        if (showGlobalSelectorEdit && (isMobile || isTouch)) {
            this.hideZopim();
        } else {
            //Allow for global edit panel animation
            Ember.run.later(this, () => {
                showGlobalSelectorEdit = this.get('controller.showGlobalSelectorEdit');
                if (!showGlobalSelectorEdit) {
                    this.showZopim();
                }
            }, 350);
        }
    }.observes('controller.showGlobalSelectorEdit', 'isMobile', 'isTouch'),

    initGlobalEditComponent: function () {
        const isMobile = this.get('isMobile');
        const isTouch = this.get('isTouch');

        if (isMobile) {
            this.set('controller.showGlobalSelectorEdit', false);
            this.showZopim();
        } else if (isTouch) {
            this.set('controller.showGlobalSelectorEdit', true);
            this.hideZopim();
        } else {
            this.set('controller.showGlobalSelectorEdit', true);
            this.showZopim();
        }
    },

    initUserTour: function () {
        var view = this;

        this.get('controller.controllers.application').on('showUserTour-selectmap', function () {
            view.send('prepareUserTour');
            window.tourMediator.resetStep('targetcategorywarning');
        });

        this.get('controller.controllers.application').on('completeUserTour', () => this.send('cleanupUserTour'));

        if (view && !view.get('isDestroyed') && !window.tourMediator.hasShown('selectmap')) {
            this.set('controller.showGlobalSelectorEdit', false);
        }

        if (this.get('fabricMapCanvasView')) {
            this.get('fabricMapCanvasView').one('rendered', function () {
                if (view && !view.get('isDestroyed') && !window.tourMediator.hasShown('selectmap')) {
                    Ember.run.later(this, () => {
                        if (view && !view.get('isDestroyed')) {
                            window.tourMediator.trigger('show-once-selectmap', {
                                hide: function () {
                                    view.get('fabricMapCanvasView').transitionToPosition(view.get('tourPosition.id'));
                                }
                            });
                        }
                    }, 800);
                }
            });
        }
    },

    showZopim: function () {
        if (config.zopim && typeof $zopim !== 'undefined') {
            $zopim.livechat.button.show();
        }
    },

    hideZopim: function () {
        if (config.zopim && typeof $zopim !== 'undefined') {
            $zopim.livechat.hideAll();
        }
    },

    rerender: function () {
        return this.get('fabricMapCanvasView').renderCanvas();
    },

    actions: {
        cleanupUserTour: function () {
            $('.selectmap-single-position-canvas').hide();
            this.get('fabricMapCanvasView').transitionToPosition(this.get('tourPosition.id'));
        },

        prepareUserTour: function () {
            var view = this;

            if (!this.$()) {
                return;
            }

            if ($('.selectmap-single-position-canvas').length) {
                $('.selectmap-single-position-canvas').show()
                    .off('click')
                    .on('click', () => view.get('fabricMapCanvasView').transitionToPosition(view.get('tourPosition.id')));
                return;
            }

            var position = this.get('tourPosition'),
                $container = this.$().find('.map-canvas .canvas-container'),
                $canvas = $(this.get('fabricMapCanvasView').renderSinglePosition(position, 'selectmap-single-position-canvas'));

            // place it into the canvas container

            $container.append($canvas);

            var offset = $canvas.offset();

            // now make it float with the same position

            $canvas.css({
                position: 'float',
                left: offset.left,
                top: offset.top
            });

            $(document.body).append($canvas);

            $canvas.on('click', function () {
                view.send('cleanupUserTour');
                window.tourMediator.trigger('close');
                view.get('fabricMapCanvasView').transitionToPosition(view.get('tourPosition.id'));
            });

            //this.set('tourPosition', position);
            this.set('tourPositionCanvas', $canvas);
        },

        rerender: function () {
            var view = this.get('fabricMapCanvasView');

            this.get('controller.controllers.application').runWithSpinner(this, function () {
                Ember.run.scheduleOnce('render', this, function () {
                    view.renderCanvas();
                });
            });
        },

        showMobileHelp: function () {
            this.set('showMobileHelp', true);
        }
    }
});
