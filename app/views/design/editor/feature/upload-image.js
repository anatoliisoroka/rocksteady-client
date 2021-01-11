/* globals $, fabric */

import Ember from 'ember';
import config from '../../../../config/environment';

import {floodfill} from '../../../../lib/rs-canvas-floodfill';
import {getImageURL} from '../../../../utils/url-util';

export default Ember.View.extend({
    classNames: ['upload-image-modal'],
    templateName: 'design/editor/feature/uploadImage',

    _userActionService: Ember.inject.service('user-action-service'),

    changes: 0,

    noChanges: function () {
        return this.get('changes') === 0;
    }.property('changes'),

    isApplyingChanges: false,
    understandCheckboxIsUnchecked: false,

    swapInCanvas: function () {
        //set up background of canvas with the decal
        var $img = this.$().find('.upload-image-preview img'),
            $previewCanvas = this.$().find('#upload-image-canvas'),
            previewContext = $previewCanvas.get(0).getContext('2d'),
            imageWidth = $img.width(),
            imageHeight = $img.height();
        this.$workingCanvas = this.$('<canvas></canvas>');
        var workingContext = this.$workingCanvas.get(0).getContext('2d');

        if (!this.downScale) {
            if (imageWidth > imageHeight) {
                this.downScale = $previewCanvas.get(0).width / imageWidth;
            } else {
                this.downScale = $previewCanvas.get(0).height / imageHeight;
            }
            this.downScale = this.downScale / 0.7;
        }

        //load image into working canvas
        this.$workingCanvas.attr('width', imageWidth).attr('height', imageHeight);
        workingContext.drawImage($img.get(0), 0, 0, imageWidth, imageHeight);

        //load image into preview canvas
        $previewCanvas.attr('width', Math.floor(imageWidth * this.downScale)).attr('height', Math.floor(imageHeight * this.downScale));
        previewContext.drawImage($img.get(0), 0, 0, $previewCanvas.get(0).width, $previewCanvas.get(0).height);
        $img.hide();

        $previewCanvas.off('click');

        $previewCanvas.on('click', (e) => {
            this.set('isApplyingChanges', true);
            this.incrementProperty('changes');

            var imageX = Math.floor(e.offsetX * (1 / this.downScale));
            var imageY = Math.floor(e.offsetY * (1 / this.downScale));

            floodfill(
                imageX,
                imageY,
                {r: 1, g: 255, b: 1, a: 255},
                workingContext,
                this.$workingCanvas.get(0).width,
                this.$workingCanvas.get(0).height,
                32);

            //refresh content
            previewContext.clearRect(0, 0, $previewCanvas.get(0).width, $previewCanvas.get(0).height);
            previewContext.drawImage(this.$workingCanvas.get(0), 0, 0, $previewCanvas.get(0).width, $previewCanvas.get(0).height);

            Ember.run.later(this, function () {
                this.set('isApplyingChanges', false);
            }, 500);
        });

        //align it with css
        var top = (this.$().find('.upload-image-canvas-container').height() - this.$().find('#upload-image-canvas').height()) / 2;
        $previewCanvas.css('margin-top', top);

        //set background
        this.applyCanvasCointainerBackground();

        this.set('changes', 0);
    },

    applyCanvasCointainerBackground () {
        var $uploadImageCanvasContainer = this.$().find('.upload-image-canvas-container');

        var canvas = new fabric.Canvas('temp-upload-image-canvas', {
            width: this.$().find('.upload-image-canvas-container').width(),
            height: this.$().find('.upload-image-canvas-container').height()
        });

        var svg = this.get('controller.controllers.design/editor.model.component.shape.svg');
        var canvasBackground;

        fabric.loadSVGFromString(svg, (objects, options) => {
            canvasBackground = fabric.util.groupSVGElements(objects, options);
            canvasBackground.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                selectable: false
            });

            canvas.add(canvasBackground).renderAll();

            fabric.util.loadImage(getImageURL('background-grid-excluded.png'), function (img) {
                canvasBackground.setFill(new fabric.Pattern({
                    source: img,
                    repeat: 'repeat'
                }));
                canvas.renderAll();

                $uploadImageCanvasContainer.css('background-image', 'url(' + canvas.toDataURL() + ')');
            });
        });
    },

    uploadImage () {
        const designController = this.get('controller.controllers.design');
        const graphicData = this.get('changes') ? this.$workingCanvas.get(0).toDataURL() : this.get('controller.fileData');
        const newGraphic = designController.store.createRecord('graphic', {
            name: 'New Graphic',
            graphicData,
            isDesigner: false,
            isUserAdded: true,
            multicoloured: true,
            tags: []
        });

        const feature = this.get('controller.controllers.design/editor/feature.model');
        const applyImage = (id, data, scale) => {
            feature.setAttributeOnly('icon', id);
            feature.set('icon', data);
            feature.set('scale', scale);
        };
        const applyUploadedImage = applyImage.bind(
            null,
            newGraphic.get('id'),
            newGraphic.get('graphicData'),
            config.APP.image_upload_initial_scale
        );

        applyUploadedImage();

        //Push new Graphic into design.graphics
        designController.get('model.graphics').pushObject(newGraphic);
    },

    didInsertElement: function () {
        this.$infoEditUploadedGraphicModal = this.$().find('#info-edit-uploaded-graphic');
        this.$editUploadedGraphicModal = this.$().find('#edit-uploaded-graphic');

        this.$infoEditUploadedGraphicModal.modal('show');

        //unbind editor keys
        this.set('controller.controllers.design/editor.bindKeys', false);

        this._super();
    },

    willDestroyElement: function () {
        //bind editor keys again
        this.set('controller.controllers.design/editor.bindKeys', true);
    },

    actions: {

        reset: function () {
            this.swapInCanvas();
        },

        cancel: function () {
            this.$editUploadedGraphicModal.modal('hide');
        },

        understandColourDifferences: function () {
            if (!this.get('understandCheckbox')) {
                return;
            }

            this.$infoEditUploadedGraphicModal.modal('hide');

            this.$editUploadedGraphicModal.modal('show')
                .on('shown.bs.modal', () => {
                    this.swapInCanvas();
                })
                .on('hidden.bs.modal', () => {
                    Ember.run(() => {
                        if (!$('#error-modal:visible').length && this && this.get('controller')) {
                            this.get('controller').replaceRoute('design.editor.feature');
                        }
                    });
                });
        },

        applyChanges: function () {
            this.uploadImage();

            this.$().find('.modal').modal('hide');

        }

    }
});
