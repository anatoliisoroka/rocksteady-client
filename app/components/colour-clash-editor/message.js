import Ember from 'ember';

export default Ember.Component.extend({

    hiddenGroup: false,
    stackOffset: null,
    topOffset: null,
    features: null,

    colourGroupName: Ember.computed('message', function () {
        return this.get('message.group').capitalize();
    }),

    colourList: Ember.computed('message.usedColours.@each.colour.name', function () {
        let usedColours = this.get('message.usedColours');
        let uniqueColours = _.uniqBy(usedColours, function (usedColour) {
            return usedColour.colour.get('name');
        });

        uniqueColours = uniqueColours.map(function (usedColour) {
            let rgbValue = usedColour.colour.get('displayRgb');
            let safeStyle = Ember.String.htmlSafe('background: ' + rgbValue + ';');
            Ember.set(usedColour, 'style', safeStyle);
            return usedColour;
        });

        return uniqueColours;
    }),

    colourNamesList: Ember.computed('colourList', function () {
        let colourList = this.get('colourList');
        return colourList.map(function (usedColour) {
            return usedColour.colour.get('name');
        });
    }),

    didInsertElement(){
        let $message = this.$('.colour-clash-message');
        let position = this.get('message.position');
        let stackOffset = this.get('stackOffset');
        let topOffset = this.get('topOffset');

        $message.css({top: topOffset + (stackOffset * position)});

        $message.css({'z-index': position + 1032});

        Ember.run.later(function () {
            $message.addClass('fade-slide-down');
        }, position * 100);
    },

    _usedColoursChange: function () {
        this.send('bringForward');
    }.observes('message.usedColours.@each'),

    _positionChange: function () {
        let $message = this.$('.colour-clash-message');
        let stackOffset = this.get('stackOffset');
        let position = this.get('message.position');
        let topOffset = this.get('topOffset');

        $message.css({'z-index': position + 1032});

        $message
            .stop()
            .delay(position * 100)
            .animate({
                top: topOffset + (stackOffset * position),
            }, 400);

    }.observes('message.position'),

    _changeAllColours(message, selectedColour){
        let thisColourId = selectedColour.colourId;

        let usedFeatures = message.usedColours.map(function (usedColour) {
            return usedColour.feature;
        });

        let backgroundFeature = usedFeatures.find(function (feature) {
            return feature.get('name') === 'Background';
        });

        //TODO this whole block is related to the background is only necessary due to the overlapping requirements in the background contrasting colours feature
        // See the fabric-bindings mixin for implementation
        if (backgroundFeature) {
            // Background contrasting colours feature only works if the active feature is the background
            this.get('editorController').send('setAsActive', backgroundFeature);

            message.usedColours.forEach(function (usedColour) {
                let feature = usedColour.feature;
                if(feature.innermostBorder()){
                    let newValue = feature.getAttribute(usedColour.attributeKey).get('value');
                    message.changeMadeByClick = true;
                    if (newValue !== thisColourId) {
                        feature.setAttribute(usedColour.attributeKey, thisColourId);
                    }
                }
            });

            backgroundFeature.setAttribute('fill', '');
            Ember.run.later(function () {
                backgroundFeature.setAttribute('fill', thisColourId);
            }, 10);
        } else {
            message.usedColours.forEach(function (usedColour) {
                message.changeMadeByClick = true;
                Ember.run.later(function(){
                    message.changeMadeByClick = false;
                }, 200);
                let newValue = usedColour.feature.getAttribute(usedColour.attributeKey).get('value');
                if(newValue !== thisColourId){
                    usedColour.feature.setAttribute(usedColour.attributeKey, thisColourId);
                }
            });
        }
    },

    animateRemove: function () {
        let $message = this.$('.colour-clash-message');

        if (this.get('message.shouldRemove')) {
            $message.addClass('fade-slide-up');
        } else {
            $message.removeClass('fade-slide-up');
        }
    }.observes('message.shouldRemove'),

    toggleGroup: function () {
        this.sendAction('hideGroup', this.get('message.group'), this.get('hiddenGroup'));
    }.observes('hiddenGroup'),

    actions: {

        changeAllColours: function (message, colour) {
            this._changeAllColours(message, colour);
        },

        remove: function () {
            this.set('message.shouldRemove', true);
        },

        bringForward: function () {
            this.sendAction('bringForward', this.get('message'));
        }
    }

});
