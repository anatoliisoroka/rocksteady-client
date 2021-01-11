import Ember from 'ember';

export default Ember.Component.extend({

    hiddenGroup: false,
    stackOffset: null,
    topOffset: null,
    leftOffset: 0,

    minZIndex: 1020,

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
        let leftOffset = this.get('leftOffset');

        $message.css({
            top: topOffset + (stackOffset * position),
            left: leftOffset
        });

        $message.css({'z-index': position + this.get('minZIndex')});

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
        let leftOffset = this.get('leftOffset');

        $message.css({'z-index': position + this.get('minZIndex')});

        let closingDelay = 0;
        if(leftOffset<300){
            closingDelay = 100;
        }

        $message
            .stop()
            .delay(closingDelay)
            .animate({
                left: leftOffset
            }, 300, 'swing')
            .delay(position * 100)
            .animate({
                top: topOffset + (stackOffset * position)
            }, 300);

    }.observes('message.position', 'leftOffset'),

    _changeAllColours(message, selectedColour){
        let thisColourId = selectedColour.colourId;
        message.changeMadeByClick = true;
        Ember.run.later(function(){
            message.changeMadeByClick = false;
        }, 700);

        message.usedColours.forEach(function (usedColour) {
            usedColour.feature.setAttribute(usedColour.attributeKey, thisColourId);
        });

        //TODO the call below re-renders the entire view, investigate how to update all elements and not just the active element
        this.get('selectorView.fabricMapCanvasView').renderCanvas();

        this.get('selectorView.controller.controllers.design').save();

        //FIXME Below works but overlays shadows each time...
        // this.get('selectorView.fabricMapCanvasView.rsSelectorCanvas').render();
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
