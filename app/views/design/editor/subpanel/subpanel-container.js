import Ember from 'ember';

export default Ember.View.extend({
    tagName: 'li',
    classNames: ['subpanel'],
    templateName: 'design/editor/subpanel-container',

    moreResultsShown: false,

    didInsertElement: function () {
        var view = this;

        Ember.run.later(this, function () {
            if (view.$()) {
                view.$().addClass('slidein');
            }
        }, 50);
    },

    activeProperty: function () {
        return this.get('controller.controllers.design/editor').get('activeProperty');
    }.property(),

    paletteType: function () {
        var pType = this.get('activeProperty');

        if (pType === 'fill') {
            return 'More Fill Colours';
        } else if (pType.indexOf('strokeStyle') !== -1) {
            return 'More Border Colours';
        } else if (pType === 'graphic') {
            return 'More Graphics';
        } else if (pType === 'font') {
            return 'More Fonts';
        } else {
            return 'More';
        }

    }.property(),

    isFill: function () {
        if (this.get('activeProperty') === 'fill') {
            return 'true';
        }
    }.property(),

    isStrokeStyle: function () {
        if (this.get('activeProperty') === 'strokeStyle') {
            return 'true';
        }
    }.property(),

    isStrokeStyle1: function () {
        if (this.get('activeProperty') === 'strokeStyle1') {
            return 'true';
        }
    }.property(),

    isStrokeStyle2: function () {
        if (this.get('activeProperty') === 'strokeStyle2') {
            return 'true';
        }
    }.property(),

    isStrokeStyle3: function () {
        if (this.get('activeProperty') === 'strokeStyle3') {
            return 'true';
        }
    }.property(),

    isStrokeStyle4: function () {
        if (this.get('activeProperty') === 'strokeStyle4') {
            return 'true';
        }
    }.property(),

    isGraphic: function () {
        if (this.get('activeProperty') === 'graphic') {
            return 'true';
        }
    }.property(),

    isFont: function () {
        if (this.get('activeProperty') === 'font') {
            return 'true';
        }
    }.property(),

    actions: {
        addShapeFilter: function () {
            this.get('childViews')[0].send('setTagsByString', ['shapes']);
        },
        backToMainPanel () {
            if (this.get('moreResultsShown')) {
                this.set('moreResultsShown', false);
            } else {
                this.get('controller').send('backToMainPanel');
            }
        }
    }
});
