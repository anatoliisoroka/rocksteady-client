/* global Modernizr, $ */

import Ember from 'ember';

var WIDTH_OF_A_CAROUSEL_CONTROLLER = 80; // FIXME - should not be done in JS!
var MAX_ITEMS_PER_PAGE = 5;

export default Ember.View.extend({
    layoutName: 'carousel',
    classNames: ['carousel-view'],
    classNameBindings: ['isInitialising'],
    isInitialising: true,
    itemsPerPage: 0,
    curPage: 0,
    lastPage: 0,

    carouselLeftEnabled: function () {
        return this.get('curPage') > 0;
    }.property('curPage'),

    carouselRightEnabled: function () {
        return this.get('curPage') < this.get('lastPage');
    }.property('curPage', 'lastPage'),

    invalidatePage: function () {
        var rsci = this.$().find('.rs-carousel-inner');

        try {
            rsci.css('left', -rsci.find('.rs-carousel-item').eq(this.get('curPage') * this.get('itemsPerPage')).position().left + 'px');
        } catch (e) {
            return;
        }

        this.$().find('.rs-carousel-item').removeClass('visible');

        this.$().find('.rs-carousel-item').slice(
            this.get('curPage') * this.get('itemsPerPage'),
            this.get('curPage') * this.get('itemsPerPage') + this.get('itemsPerPage')).addClass('visible');

        if (!Modernizr.touch) {
            this.$().find('input').focus();
        }
    }.observes('curPage', 'isInitialising'),

    didInsertElement: function () {
        this._super();

        this.$().find('.carousel-control.left').on('click', this.carouselLeft = function (e) {
            e.preventDefault();
            var view = this;

            Ember.run(function () {
                if (view.get('curPage') > 0) {
                    view.set('curPage', view.get('curPage') - 1);
                }
            });
        }.bind(this));

        this.$().find('.carousel-control.right').on('click', this.carouselRight = function (e) {
            e.preventDefault();
            var view = this;

            Ember.run(function () {
                if (view.get('curPage') < view.get('lastPage')) {
                    view.set('curPage', view.get('curPage') + 1);
                }
            });
        }.bind(this));

        this.get('parentView.carouselContent');

        var view = this;

        $(window).on('debouncedresize.carousel.' + view.get('elementId'), function () {
            window.tourMediator.trigger('close');

            Ember.run(view, function () {
                view.initCarousel();
            });
        });
    },

    willDestroyElement: function () {
        this.$().find('.carousel-control.left').off('click', this.carouselLeft);
        this.$().find('.carousel-control.right').off('click', this.carouselRight);
        $(window).off('debouncedresize.carousel.' + this.get('elementId'));
    },

    observeContent: function () {
        Ember.run.scheduleOnce('afterRender', this, this.initCarousel);
    }.observes('parentView.carouselContent'),

    initCarousel: function () {

        // (re)initialise the carousel
        var controlWidth = this.get('controlwidth') || WIDTH_OF_A_CAROUSEL_CONTROLLER,
            $el = this.$(),
            rsci,
            c = 0,
            lastLeft = 0,
            itemContainerWidth,
            carousel = this;

        if (!$el) {
            return;
        }

        rsci = $el.find('.rs-carousel-inner');

        $el.find('.rs-carousel-wrapper').width('auto');
        carousel.set('itemsPerPage', 5);
        itemContainerWidth = $el.find('.rs-carousel-wrapper').width();

        if (itemContainerWidth === 0) {
            return;
        }

        this.set('isInitialising', true);
        this.get('parentView.carouselContent.length');

        // calc how many items fit in the dialog for this window size

        $el.find('.rs-carousel-item.placeholder').show();
        $el.find('.rs-carousel-item').each(function () {
            var left = $(this).position().left;

            if (left > itemContainerWidth + 1 || c > MAX_ITEMS_PER_PAGE) {
                carousel.set('itemsPerPage', c - 1);
                return false;
            }

            lastLeft = left;
            c++;
        });

        if (this.get('itemsPerPage') === 0) {
            this.set('itemsPerPage', 1);
            lastLeft = $el.find('.rs-carousel-item:nth-of-type(2)').position().left;
        }

        itemContainerWidth = lastLeft;
        $el.find('.rs-carousel-wrapper').width(lastLeft);

        this.get('parentView').send('handleCarouselSizeHint', {
            width:  $el.find('.rs-carousel-wrapper').width() + (controlWidth * 2),
            marginLeft:  ($el.find('.rs-carousel-wrapper').width() + (controlWidth * 2)) / -2
        });

        // trim placeholder shapes
        $el.find('.rs-carousel-item').addClass('visible');
        $el.find('.rs-carousel-item.placeholder').hide().removeClass('visible');

        var wantPlaceholders =  this.get('itemsPerPage') - ($el.find('.rs-carousel-item:not(.placeholder)').length % this.get('itemsPerPage'));

        if (wantPlaceholders === this.get('itemsPerPage')) {
            wantPlaceholders = 0;
        }

        $el.find('.rs-carousel-item.placeholder').slice(0, wantPlaceholders).show().addClass('visible');

        this.set('lastPage', parseInt(($el.find('.rs-carousel-item:visible').length - 1) / this.get('itemsPerPage')));
        this.set('curPage', 0);

        this.setupKeypressListener();

        if (Modernizr.touch) {
            var showTouchFeedback = function () {
                var item = $(this);
                item.addClass('show-touch-feedback');
                window.setTimeout(function () {
                    item.removeClass('show-touch-feedback');
                }, 500);
            };

            this.$().find('.rs-carousel-item').off('click', showTouchFeedback);
            this.$().find('.rs-carousel-item').on('click', showTouchFeedback);
        }

        this.set('isInitialising', false);
    },

    setupKeypressListener: function () {
        var input = this.$().find('input'),
            view = this;

        if (!input || input._initialized) {
            return;
        }

        // input focus is handled by the parent view (this is because the
        // parent view must take care of transitions etc. focusing the input
        // too early can mess up smooth scrolling and transitions.

        input.keypress(function (e) {
            if (e.keyCode === 13) {
                view.$().find('.rs-carousel-item.selected').click();
            } else {
                Ember.run.debounce(view, 'keypressSearch', 1000);
            }
        });

        input._initialized = true;
    },

    keypressSearch: function () {
        if (!this.get('controller.typeaheadValue')) {
            return;
        }

        var view = this,
            c = 0,
            typeaheadValue = this.get('controller.typeaheadValue').toLowerCase(),
            carouselItems = this.$().find('.rs-carousel-item');

        if (typeaheadValue === '') {
            return;
        }

        carouselItems.each(function () {
            var item = view.$(this);

            if (item.data('searchfor') && item.data('searchfor').toLowerCase().indexOf(typeaheadValue) === 0) {

                item.addClass('indicate');
                item.addClass('selected');
                setTimeout(function () {
                    item.removeClass('indicate');
                }, 2000);

                view.set('curPage', Math.floor(c / view.get('itemsPerPage')));

                return true;
            }

            c++;
        });

        this.set('controller.typeaheadValue', '');
    }
});

