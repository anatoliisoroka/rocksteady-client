/* global $, logger */

import Ember from 'ember';
import config from '../../../../config/environment';
import { dataURIToBlob } from '../../../../utils/url-util';

export default Ember.TextField.extend({
    type: 'file',
    reader: undefined,
    fileType: undefined,
    fileData: undefined,
    graphicType: undefined,
    fileReaderSupported: undefined,

    willInsertElement: function () {

        if ('FileReader' in window) {
            this.set('fileReaderSupported', true);
        } else {
            this.set('fileReaderSupported', false);
        }
    },

    willDestroyElement: function () {
        $('.property-panel').off('drop.upload');
        $('body').off('dragenter.upload dragover.upload drop.upload');
    },

    didInsertElement: function () {

        var self = this;
        this._super();

        var $propertyPanel = $('.property-panel');

        if (this.get('fileReaderSupported')) {
            var reader = new window.FileReader();
            this.set('reader', reader);
        }

        // drag and drop functionality for IE
        // requires the following jQuery blocks
        Ember.run.scheduleOnce('afterRender', function () {

            $propertyPanel.on('drop.upload', function (e) {
                e.preventDefault();

                if (!self.get('fileReaderSupported')) {
                    self.notifyBrowserNotSupported();
                    return;
                }

                var filelist = e.dataTransfer.files;

                if (!filelist) {
                    return;
                }

                if (filelist.length > 0) {
                    var file = filelist[0];
                    self.uploadFile(file);
                }
            });

            $propertyPanel.dragster({
                enter: function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $(e.target).find('.drag-here').show();
                },
                leave: function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $(e.target).find('.drag-here').hide();
                }
            });

            //disable browser redirect on dropped files
            $('body').on('dragenter.upload dragover.upload drop.upload', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });
        });
    },

    change: function () {
        if (this.get('fileReaderSupported')) {
            var el = this.$();
            var file = el[0].files[0];
            this.uploadFile(file);
            this.$().val('');
        } else {
            this.notifyBrowserNotSupported();
        }
    },

    addGraphic: function () {
        var feature = this.get('parentView.controller.controllers.design/editor/feature.model'),
        designController = this.get('parentView.controller.controllers.design');

        var newGraphic = designController.store.createRecord('graphic', {
            name: 'New Graphic',
            graphicData: this.get('fileData'),
            isDesigner: false,
            isUserAdded: true,
            multicoloured: true,
            tags: []
        });

        var graphic_id = newGraphic.get('id');

        feature.getAttribute('icon').set('value', graphic_id);
        feature.set('icon', newGraphic.get('graphicData'));
        feature.set('scale', config.APP.image_upload_initial_scale);

        //Push new Graphic into design.graphics
        designController.get('model.graphics').pushObject(newGraphic);
    },

    obtainFirstUnassignedNumber (arr) {
        const usedIndexes = arr
            .map((colour) => parseInt(
                colour
                    .get('name')
                    .match(/\s\d*/)[0]
                    .trim()
            ));

        const set = new Set(usedIndexes);
        let i = 1;

        while (set.has(i)) {
            ++i;
        }
        return i;
    },

    convertToColourModels (colours) {
        const store = this.get('controller.parentView.controller.store');
        const white = store
            .all('colour')
            .findBy('name', 'White')
            .get('id');
        const design = store
            .all('design')
            .get('lastObject');
        let uploadColours = store
            .all('colour')
            .filterBy('group', 'Upload');

        return colours
            .map(({ rgb: displayRgb }) => {
                const existingColour = uploadColours.findBy('displayRgb', displayRgb.toLowerCase());

                if (existingColour) {
                    return existingColour;
                }

                const newColour = store.createRecord(
                    'colour',
                    {
                        name: `Upload ${this.obtainFirstUnassignedNumber(uploadColours)}`,
                        displayRgb,
                        group: 'Upload',
                        groupDefault: false,
                        design,
                        contrastingIds: Ember.A([white]),
                        complementaryIds: Ember.A([white]),
                    }
                );
                uploadColours.push(newColour);
                return newColour;
            });
    },

    obtainMostUsedColours () {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const formData = new FormData();

            let image = new Image();
                image.src = this.get('fileData');

            let canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');

            image.onload = function(){
                canvas.width = 600;
                canvas.height = 400;
                ctx.drawImage(image, 0, 0, 600, 400);

                formData.append('image', dataURIToBlob(canvas.toDataURL()));
                Ember.$.ajax({
                    type: 'POST',
                    url: '/api/most_used_colours',
                    data: formData,
                    enctype: 'multipart/form-data',
                    processData: false,
                    contentType: false,
                    cache: false,
                    success: ({ most_used_colours }) => resolve(this.convertToColourModels(most_used_colours)),
                    error: (err) => reject(err)
                });
            }.bind(this);
        });
    },

    fileDataChanged () {
        const panelController = this.get('parentView.controller');
        const uploadController = panelController.get('controllers.design/editor/feature/uploadImage');

        if (this.get('graphicType') === 'SVG') {
            this.addGraphic();
        } else {
            uploadController.set('fileData', this.get('fileData'));
            uploadController.set('mostUsedColours', Ember.A());
            this.obtainMostUsedColours()
                .then((colours) => {
                    uploadController.set(
                        'mostUsedColours',
                        colours.map((colour) => ({
                            colourStyle: Ember.String.htmlSafe(`background: ${colour.get('displayRgb')}`),
                            name: colour.get('name')
                        }))
                    );
                });
            panelController.transitionToRoute('design.editor.feature.upload-image');
        }
    },

    determineDataType: function () {
        // Supported Mime Types
        if (this.get('parentView.controller.controllers.application.config.APP.features.svg_upload') && this.get('fileType') === 'image/svg+xml') {
            this.set('graphicType', 'SVG');
        } else if (this.get('fileType') === 'image/jpeg') {
            this.set('graphicType', 'JPG');
        } else if (this.get('fileType') === 'image/png') {
            this.set('graphicType', 'PNG');
        } else {
            this.set('graphicType', undefined);
        }
    },

    uploadFile: function (file) {

        if (file) {
            var self = this;
            var $dropBox = $('.drag-here');

            Ember.run.scheduleOnce('afterRender', this, function () {

                this.set('fileType', file.type);
                this.determineDataType();

                if (!this.get('graphicType')) {
                    this.send('displayUploadWarning',
                        'editor.wrong_file_type',
                        'toast-filetype-warning');
                } else if (this.get('isDestroyed') || !file || !file.size) {
                    logger.error('UploadFileError', 'Uploaded file is missing file size or view is destroyed');

                } else if (file.size > config.APP.image_upload_max_size && this.get('graphicType') !== 'SVG') {
                    this.send('displayUploadWarning',
                      'editor.file_size_limit_warning',
                      'toast-filesize-warning');

                } else if (file.size < config.APP.image_upload_min_size && this.get('graphicType') !== 'SVG') {
                    this.send('displayUploadWarning',
                      'editor.file_size_min_warning',
                      'toast-filesize-warning');

                } else {

                    if (this.get('graphicType') === 'SVG') {
                        this.get('reader').readAsText(file);
                    } else if (this.get('graphicType') !== undefined) {
                        this.get('reader').readAsDataURL(file);
                    } else {
                        this.send('displayUploadWarning',
                          'editor.wrong_file_type',
                          'toast-filetype-warning');
                    }

                    this.get('reader').onload = function () {
                        Ember.run(function () {
                            self.set('fileData', self.get('reader').result);
                            self.fileDataChanged();
                        });
                    };
                }

                $dropBox.hide();
            });
        }
    },

    notifyBrowserNotSupported: function () {

        var $dropBox = $('.drag-here');

        this.send('displayUploadWarning',
            'editor.no_upload_support',
            'toast-poorquality-warning');

        $dropBox.hide();

        //clear input field
        this.$().val('');
    },

    actions: {

        displayUploadWarning: function (translation_key, selector_class) {
            var t = this.get('parentView.controller').get('i18n').t.bind(this.get('parentView.controller.i18n')),
                view = this;

            Ember.run.later(this, function () {
                if (view && !view.get('isDestroyed')) {
                    view.get('parentView.controller.controllers.application').send(
                        'toast',
                        t(translation_key).toString(),
                        'warning',
                        selector_class
                    );
                }
            }, 1000);
        }
    }
});
