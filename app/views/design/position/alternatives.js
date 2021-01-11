/* global $, logger */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({
    templateName: 'design/position/alternatives',

    classNames: ['alternative-shapes'],

    shapeChosen: false,

    actions: {
        applyChanges: function () {
            this.get('controller').send('applyNewShape');
            this.send('hidePopovers');
        },
        cancel: function () {
            this.send('hidePopovers');
        },
        hidePopovers: function () {
            if (this.$()) {
                this.$().find('.modal').modal('hide');
            }
        },
        handleCarouselSizeHint: function (position) {
            if (this.$()) {
                this.$().find('#alternatives-selector-modal').css('width', position.width);
            }
        }
    },

    redirectToSelector () {
        if (!$('#error-modal:visible').length && this && this.get('controller')) {
            this.get('controller').replaceRoute('design.selector');
        }
    },

    chooseShape () {
        this.set('shapeChosen', true);

        var shapeName = this.get('controller.chosenShape.shape.name').toLowerCase();
        var positionName = this.get('controller.chosenShape.component.position.name').toLowerCase();

        if (!/perforated/.test(shapeName) && /tank/.test(positionName)) {
            this.$().find('#alternatives-selector-modal')
                .modal('hide');
            this.$().find('#alternatives-advice-modal')
                .on('hidden.bs.modal', () => {
                    this.redirectToSelector();
                })
                .modal({'backdrop': true, show: true});
        } else {
            this.get('controller').send('applyNewShape');
        }
    },

    didInsertElement: function () {

        var view = this;

        this._super();

        this.$().find('#alternatives-selector-modal')
            .modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', () => {
                if (this.get('shapeChosen')) {
                    return;
                }
                this.redirectToSelector();
            })
            .on('shown.bs.modal', function () {
                if (this.get('childViews.firstObject')) {
                    Ember.run(function () {
                        view.get('childViews.firstObject').initCarousel();
                    });
                }

                setTimeout(function () {
                    window.getSelection().removeAllRanges();
                }, 500);

            }.bind(this));

        // not sure why default <escape> button behaviour doesn't work
        this.keys.bind('escape', this.handleEscape.bind(this));

        if (config.APP.testing || config.APP.debugging) {
            this.keys.bind('x', function () {
                logger.debug('Throwing unhandled exception for test ErrorStates.2');
                throw 'meow';
            });
        }

        $(window).on('debouncedresize.alternativeshapes', function () {
            Ember.run(view, function () {
                view.$().find('#alternatives-selector-modal').width('auto');
            });
        });

        this.get('controller').on('chooseShape', this, this.chooseShape);
    },

    handleEscape: function handleEscape(e) {
        if (e.which === 27) {
            this.send('hidePopovers');
        }
    },

    willDestroyElement: function () {
        this.keys.unbind('escape');

        if (config.APP.testing || config.APP.debugging) {
            this.keys.unbind('x');
        }

        $(window).off('debouncedresize.alternativeshapes');

        this.get('controller').off('chooseShape', this, this.chooseShape);
    }

});
