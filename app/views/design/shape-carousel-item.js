import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/shape_carousel_item',
    classNames: ['rs-carousel-item'],
    classNameBindings: ['isActive'],
    isActive: true,

    init: function () {

        this._super();

        this.set('isActive',
            this.get('content.component.isActive') &&
            this.get('content.component.activeShape') === this.get('content.shape'));
    },

    click: function (e) {
        e.preventDefault();

        var imgData = this.$('canvas')[0].toDataURL();
        this.get('controller').send('chooseShape', this.get('content.component'), this.get('content.shape'), this.get('content.index'), imgData);
    }
});

