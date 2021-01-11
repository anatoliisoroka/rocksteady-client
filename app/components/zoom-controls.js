import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: ['editor-zoom-controls', 'btn-group'],

    isMinZoom: Ember.computed('zoom', function () {
        var availableZoomScales = this.get('availableZoomScales');
        return this.get('zoom') === availableZoomScales[0];
    }),

    isMaxZoom: Ember.computed('zoom', function () {
        var availableZoomScales = this.get('availableZoomScales');
        return this.get('zoom') === availableZoomScales[availableZoomScales.length - 1];
    }),

    actions: {
        zoomIn () {
            var zoom = this.get('zoom');
            var availableZoomScales = this.get('availableZoomScales');

            if (zoom !== availableZoomScales[availableZoomScales.length - 1]) {
                var currentZoomIndex = availableZoomScales.indexOf(zoom);
                this.sendAction('setZoom', availableZoomScales[currentZoomIndex + 1]);
            }
        },
        zoomOut () {
            var zoom = this.get('zoom');
            var availableZoomScales = this.get('availableZoomScales');

            if (zoom !== availableZoomScales[0]) {
                var currentZoomIndex = availableZoomScales.indexOf(zoom);
                this.sendAction('setZoom', availableZoomScales[currentZoomIndex - 1]);
            }
        }
    }
});
