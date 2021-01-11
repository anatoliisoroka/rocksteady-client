/* global $, Modernizr */

import Ember from 'ember';

export default Ember.View.extend({

    templateName: 'design/editor/paged_composite_graphics',

    didInsertElement: function () {
        var view = this;

        view.$().hide();

        if (!Modernizr.touch) {
            Ember.run.scheduleOnce('afterRender', this, function () {
                this.$().find('.token-input').focus();
            });
        }

        $(window).off('debouncedresize.pcgv');
        $(window).on('debouncedresize.pcgv', function () {
            Ember.run(function () {
                this.send('fixHeight');
            }.bind(this));
        }.bind(this));

        this.get('controller').on('favouriteTagsChanged', function () {
            Ember.run.scheduleOnce('afterRender', this, function () {
                view.send('fixHeight');
            });
        });

    },

    willDestroyElement: function () {
        $(window).off('debouncedresize.pcgv');
    },

    hasControlsContainer: function hasControlsContainer() {
        return this.$().find('.paging-controls-container').outerHeight(true) !== null;
    },

    actions: {

        addTag: function (tag) {
            this.$().find('[name="graphicFilter"]').tokenfield('createToken', tag.id);
            //remove tag from favourites
            this.get('controller').send('removeFavouriteTag', tag);
            this.send('fixHeight');
        },

        setTagsByString: function (tags) {
            this.$().find('[name="graphicFilter"]').tokenfield('setTokens', tags);
        },

        clearTags: function () {
            this.$().find('[name="graphicFilter"]').tokenfield('setTokens', []);
            this.$().find('.tokenfield').removeClass('is-visible');
            this.set('controller.tags', []);
            this.send('fixHeight');
        },

        show: function () {
            if (this.$()) {
                this.$().show();
                //TODO Re-test this when Chrome version > 54 (MOT-1481)
                setTimeout(function(){
                    window.editorCanvas.rsRenderAll();
                }, 100);
            }

            this.send('fixHeight');
        },

        fixHeight: function () {
            //Calculation only needed when we have a Controls Container
            if (this.$() && this.hasControlsContainer()) {
                var itemsPerLine = 4;
                var paddingAllowance = 40;
                var paddingAllowanceTwo = 20;

                var pagedCompositeGraphicsContainer = this.$().find('.paged-composite-graphics-container');
                var windowHeight = $(window).height();
                var paletteContainerOffsetTop = this.$().find('.palette-container')[0].getBoundingClientRect().top;
                var controlsContainerHeight = this.$().find('.paging-controls-container').outerHeight(true);

                var graphicSwatch = pagedCompositeGraphicsContainer.find('.graphic-swatch-list');
                var graphicSwatchLiHeight = graphicSwatch.find('li').outerHeight(true);

                var spaceAvailable = windowHeight - paletteContainerOffsetTop - controlsContainerHeight - paddingAllowance;


                var numberOfLines = Math.floor(spaceAvailable / graphicSwatchLiHeight);
                numberOfLines = Math.max(numberOfLines, 1);

                var graphicSwatchHeight = (numberOfLines * graphicSwatchLiHeight) + paddingAllowanceTwo;
                graphicSwatch.css('height', graphicSwatchHeight);

                var itemsPerPage = numberOfLines * itemsPerLine;
                this.get('controller').set('itemsPerPage', itemsPerPage);
            }
        }
    }

});

