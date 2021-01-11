/* global logger */

import EditorController from '../controllers/design/editor';

export function initialize(application) {

    var DOMURL = window.URL || window.webkitURL || window;
    var store;

    var getLastPrintRequestId = function () {
        store = application.container.lookup('store:main');

        return store.all('design').get('lastObject.lastPrintRequestId');
    };

    window.addEventListener('message', function (event) {
        if (event.source !== window || !event.data.type) {
            return;
        }

        if (event.data.type === 'qa_getprintrequeststatus') {
            var lastPrintRequestId = getLastPrintRequestId();

            logger.debug('[qa-difftool] posting qa_printrequeststatus=' + lastPrintRequestId);

            window.postMessage({
                type: 'qa_printrequeststatus',
                version: '2.0',
                data: JSON.stringify({hasPrintRequest: lastPrintRequestId})
            }, '*');
        }

        if (event.data.type === 'qa_difftool_gendata') {
            store = application.container.lookup('store:main');
            var editorController = EditorController.create({store: store});

            store.all('position').filterBy('hasActiveComponent', true).forEach(function (position) {

                // FIXME this will not work as expected because the qron will
                // be masked out

                editorController._createPrintShapeCanvas(position, {showQRONs: true, maskOn: true, iconBorderCompensate: true}).then(function (rsCanvas1) {

                    var onscreenPNGURLClippedWithQRON = rsCanvas1.canvas.toDataURL();

                    editorController._createPrintShapeCanvas(position, {iconBorderCompensate: true}).then(function (rsCanvas) {

                        var onscreenPNGURL = rsCanvas.canvas.toDataURL();

                        editorController._createPrintShapeSVG(position).then(function (svgData) {

                            // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas

                            var lastPrintRequestId = getLastPrintRequestId();
                            var pdfURL;

                            var canvas = document.createElement('canvas');
                            canvas.width = position.get('activeComponent.activeShape.width');
                            canvas.height = position.get('activeComponent.activeShape.height');
                            var ctx = canvas.getContext('2d');

                            var img = new Image();
                            var svg = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                            var url = DOMURL.createObjectURL(svg);

                            img.onload = function () {
                                ctx.drawImage(img, 0, 0);
                                DOMURL.revokeObjectURL(url);

                                var printPNGURL = ctx.canvas.toDataURL();

                                if (lastPrintRequestId) {
                                    // e.g. https://localhost:2443/pdfs/54b67b0cfad9b439c7000009/Front%20Number%20Plate-01_01.pdf

                                    pdfURL = window.location.protocol + '//' + window.location.host + '/pdfs/' +
                                        lastPrintRequestId + '/' +
                                        encodeURIComponent(position.get('name')) + '-01_01.pdf';
                                }

                                var messageData = {
                                    position: position.get('id'),
                                    positionName: position.get('name'),
                                    onscreen: onscreenPNGURL,
                                    onscreenClippedWithQRON: onscreenPNGURLClippedWithQRON,
                                    print: printPNGURL,
                                    pdfURL: pdfURL,
                                    width: canvas.width,
                                    height: canvas.height
                                };

                                logger.debug('[qa-difftool] will post difftool data');

                                window.postMessage({
                                    type: 'qa_difftool_data',
                                    version: '2.0',
                                    data: JSON.stringify(messageData)
                                }, '*');
                            };

                            img.src = url;
                        });

                    });
                });
            });
        }
    }, false);

}

export default {
    name: 'ext-difftool',
    initialize: initialize
};
