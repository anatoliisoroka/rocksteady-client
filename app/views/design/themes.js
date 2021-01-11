/* globals $, logger, Hammer, $zopim */
import Ember from 'ember';
import config from '../../config/environment';

export default Ember.View.extend({

    templateName: 'design/themes',
    classNames: ['theme-selector'],

    submitDesignModalOpen: false,
    comingSoonModalOpen: false,

    init: function () {
        this._super(...arguments);
        this.set('controller.controllers.design/selector.themesModalVisited', true);
    },

    didInsertElement() {
        this._super(...arguments);

        let self = this;
        let $pages = this.$('.hammer-swipe');
        if ($pages.length) {
            let pagesEl = $pages[0];
            let manager = new Hammer.Manager(pagesEl);
            let Swipe = new Hammer.Swipe({
                touchAction: 'auto',
                direction: Hammer.DIRECTION_HORIZONTAL
            });

            manager.add(Swipe);

            manager.on('swipe', function (e) {
                let direction = e.offsetDirection;
                let targetClass = e.target.getAttribute('class');

                //Ignore elements that have their own swipe action
                if (targetClass && targetClass.indexOf('theme-preview-image') < 0 && targetClass.indexOf('image-mask') < 0) {
                    if (direction === 2) {
                        self.get('controller').send('nextPage');
                    } else if (direction === 4) {
                        self.get('controller').send('previousPage');
                    }
                }
            });

            $(document).on('keydown.themes', this._keypressHandler.bind(this));
        }
    },

    willDestroyElement() {
        this._super(...arguments);

        this.$(document).off('keydown.themes', 'document', this._keypressHandler.bind(this));
    },

    _themePreviewFullScreenVisible: function () {
        let $el = this.$('.theme-preview-image-container.preview-full-screen');
        return ($el && $el.length);
    },

    _keypressHandler(e) {
        let keyCode = e.keyCode;
        let self = this;
        let controller = self.get('controller');
        let leftArrowKeyCode = 37;
        let rightArrowKeyCode = 39;
        let themePreviewVisible = self._themePreviewFullScreenVisible();
        let comingSoonModalOpen = this.get('comingSoonModalOpen');
        let submitDesignModalOpen = this.get('submitDesignModalOpen');

        if (!(themePreviewVisible || comingSoonModalOpen || submitDesignModalOpen)) {
            switch (keyCode) {
                case leftArrowKeyCode:
                    controller.send('previousPage');
                    break;
                case rightArrowKeyCode:
                    controller.send('nextPage');
                    break;
                default:
                    break;
            }
        }
    },

    hideZopim: function () {
        if (config.zopim && typeof $zopim !== 'undefined') {
            $zopim.livechat.hideAll();
        }
    }.on('didInsertElement'),

    actions: {
        selectFilter: function (filter) {
            Ember.set(filter, 'active', true);
        },

        removeFilter: function (filter) {
            Ember.set(filter, 'active', false);
        },

        openFilterMenu: function () {
            this.toggleProperty('filterMenuOpen');
        },

        openSubmitDesign: function () {
            this.set('submitDesignModalOpen', true);
        },

        openFindDesigner: function () {
            this.set('comingSoonModalOpen', true);
        },

        importThemeJSON: function (alsoApply) {
            var controller = this.get('controller');

            if (this.get('controller.controllers.application.config.APP.features.import_theme_json')) {
                var handleJSONUpload = function () {
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        let themeJSON = JSON.parse(evt.target.result);
                        let theme = themeJSON.themes[0];
                        let themeId = theme.id;
                        let store = controller.store;

                        logger.debug('Importing theme JSON with theme.id=' + themeId);

                        window._rsThemeJSON = themeJSON;

                        theme.name = theme.id;
                        theme.author = 'Themes Tester';
                        theme.tags = [];

                        let serializer = store.serializerFor('theme');

                        // This is where we manually call the custom serializer to have the model interpreted as if it
                        // was loaded from the rest end-point, this will also add the model to the store
                        serializer.extractSingle(store, 'theme', themeJSON, theme.id);

                        store.find('theme', themeId).then(function (themeModel) {
                            let themesModel = controller.get('model.themes');
                            let newThemesModel = themesModel.toArray();

                            newThemesModel.pushObject(themeModel);

                            controller.set('model.themes', newThemesModel);

                            if (alsoApply) {
                                controller.applyTheme(themeModel).then(() => {
                                    controller.transitionToRoute('design.selector');
                                });
                            }
                        });
                    };
                    reader.readAsText(this.files[0]);
                };

                this.$().find('.json-upload-control').get(0).addEventListener('change', handleJSONUpload, false);
                this.$().find('.json-upload-control').click();
            }
        }

    }
});
