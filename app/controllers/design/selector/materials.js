import Ember from 'ember';

export default Ember.Controller.extend({

    needs: ['design', 'application'],

    decalContainers: function () {
        var decalContainers = [];
        var decals = [];
        var kitMaterial = this.get('controllers.design.material');

        this.get('controllers.design.model.activeShapes').forEach(function (shape) {
            decals.addObjects(shape.component.get('decals'));
        });
        decals = decals.uniq();

        decals.forEach((decal) => {
            var decalContainer = {
                decal: decal
            };
            if (!this.get('isMaterialCustom')) {
                if (decal.get('name') === kitMaterial) {
                    decalContainer.selected = true;
                }
            }
            decalContainers.addObject(decalContainer);
        });

        return decalContainers.uniq();
    }.property('controllers.design.model.activeShapes', 'isMaterialCustom'),

    isMaterialCustom: function () {
        return this.get('i18n').t('selector.material_custom') === this.get('controllers.design.material');
    }.property('controllers.design.material'),

    actions: {
        selectQuality: function (decal) {
            if (!this.get('isMaterialCustom')) {
                var kitMaterial = this.get('controllers.design.material');
                if (decal.get('name') === kitMaterial) {
                    this.replaceRoute('design.selector');
                    return;
                }
            }

            this.get('controllers.design.model.activeComponents').forEach(function (component) {
                if (component.hasPriceForDecal(decal)) {
                    component.set('activeDecal', decal);
                }
            });

            var message = this.get('i18n').t('selector.material_flash_warning', { material: decal.get('name') }).toString();

            this.get('controllers.application').send(
                'toast',
                message,
                'success',
                'toast-setquality-success',
                true
                );

            this.replaceRoute('design.selector');
        }
    }
});
