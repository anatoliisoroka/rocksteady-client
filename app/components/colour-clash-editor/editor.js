import Ember from 'ember';

export default Ember.Component.extend({
    features: null,
    colours: null,
    designId: null,
    positionName: null,
    coloursInteractedWith: null,

    colourGroups: Ember.A(),

    resetColoursInteractedWith: function () {
        this.set('coloursInteractedWith', Ember.A());
    }.on('didInsertElement'),

    removeAllObservers: function () {
        let features = this.get('features');
        features.forEach(function (feature) {
            let fattributes = feature.get('fattributes');
            fattributes.forEach(function (fattribute) {
                if (fattribute.get('isColour')) {
                    Ember.removeObserver(fattribute, 'content');
                    Ember.removeObserver(fattribute, 'isEnabled');
                }
            });
        });
    }.on('willDestroyElement'),

    // Fattributes are pushed asynchronously hence the de-bounce
    debounceColourChangeObservers: function () {
        Ember.run.debounce(this, this.attachColourChangeObservers, 500);
    }.observes(
        'features.@each.deleted'
    ).on('didInsertElement'),

    attachColourChangeObservers(){
        let features = this.get('features');
        this.removeOldColourGroups();

        if (features) {
            features.forEach(function (feature) {
                let fattributes = feature.get('fattributes');

                fattributes.forEach(function (fattribute) {

                    //Unless this function is called on the fattributes it is not computed and the observer does not fire correctly
                    fattribute.get('isEnabled');

                    if (fattribute.get('isColour')) {
                        Ember.removeObserver(fattribute, 'content', this, this.onColourChange);
                        Ember.removeObserver(fattribute, 'isEnabled', this, this.onColourChange);
                        if (!feature.get('deleted')) {
                            Ember.addObserver(fattribute, 'content', this, this.onColourChange);
                            Ember.addObserver(fattribute, 'isEnabled', this, this.onColourChange);
                        }
                    }
                }, this);
            }, this);
        }
    },

    onColourChange: function (fattribute) {
        let colourId = fattribute.get('value') + '';
        let colour = this.getColourById(colourId);

        if (colour) {
            let colourName = colour.get('name');
            let colourGroupKey = this.getColourKeyFromColourName(colourName);
            let isHiddenGroup = this._isHiddenGroup(colourGroupKey);
            let colourGroupFound = this.getClashingColourGroup(colourGroupKey);
            let existingGroup = this.findExistingGroup(colourGroupKey);

            this.get('coloursInteractedWith').push(colourGroupKey);
            let uniqueColoursInteractedWith = _.uniq(this.get('coloursInteractedWith').reverse());
            this.set('coloursInteractedWith', uniqueColoursInteractedWith.reverse());

            if (!isHiddenGroup) {
                if (colourGroupFound && !existingGroup) {
                    this.addNewColourGroup(colourGroupFound);
                } else if (colourGroupFound && existingGroup) {
                    Ember.set(existingGroup, 'shouldRemove', false);
                    if (!existingGroup.changeMadeByClick) {
                        colourGroupFound.usedColours = colourGroupFound.usedColours.sortBy('colour.name');
                        Ember.set(existingGroup, 'usedColours', colourGroupFound.usedColours);
                    }
                } else {
                    this.removeOldColourGroups();
                }
            }
        }
    },

    findExistingGroup(colourGroupKey){
        let existingGroup = this.get('colourGroups').find(function (colourGroup) {
            return colourGroupKey === colourGroup.group;
        });

        return existingGroup;
    },

    removeOldColourGroups(){
        let colourGroups = this.get('colourGroups');

        if (colourGroups) {
            colourGroups.forEach((existingGroup) => {
                let colourGroupKey = this.getColourKeyFromColourName(existingGroup.group);
                let currentColourGroup = this.getClashingColourGroup(colourGroupKey);
                let isHiddenGroup = this._isHiddenGroup(colourGroupKey);

                Ember.set(existingGroup, 'shouldRemove', false);

                if ((!currentColourGroup && !existingGroup.changeMadeByClick) || isHiddenGroup) {
                    Ember.set(existingGroup, 'shouldRemove', true);
                }
            });
        }
    },

    addNewColourGroup(newColourGroup){
        let colourGroups = this.get('colourGroups');
        newColourGroup.usedColours = newColourGroup.usedColours.sortBy('colour.name');
        Ember.set(newColourGroup, 'position', colourGroups.length + 1);
        colourGroups.pushObject(newColourGroup);
    },

    getClashingColourGroup: function (colourGroupKey) {
        let colourGroups = this.findClashingColourGroups();
        let foundGroup = colourGroups.find(function (colourGroup) {
            return colourGroup.group === colourGroupKey;
        });
        return foundGroup;
    },

    findClashingColourGroups: function () {
        let usedColours = this.getAllUsedColours();
        let clashingColours = {};
        let clashingColoursGrouped = [];

        for (let i = 0; i < usedColours.length; i++) {
            for (let j = i + 1; j < usedColours.length; j++) {
                if (this.isClashingColour(usedColours[i].colour, usedColours[j].colour)) {
                    let group = this.getColourKeyFromColourName(usedColours[i].colour.get('name'));
                    clashingColours[group] = clashingColours[group] || [];
                    clashingColours[group] = clashingColours[group].addObjects([usedColours[j], usedColours[i]]);
                }
            }
        }

        _.forEach(clashingColours, function (value, key) {
            clashingColoursGrouped.push({
                group: key,
                usedColours: value,
                shouldRemove: false
            });
        });

        return clashingColoursGrouped;
    },

    getAllUsedColours(){
        let features = this.get('features');
        let usedColours = [];

        features.forEach(function (feature) {
            if (!feature.get('deleted')) {
                feature.get('fattributes').forEach(function (fattribute) {
                    if (fattribute.get('isColour') && fattribute.get('isEnabled')) {
                        let colourId = fattribute.get('value') + '';
                        usedColours.push({
                            attributeKey: fattribute.get('key'),
                            colourId: colourId,
                            colour: this.getColourById(colourId),
                            feature: feature
                        });
                    }

                }, this);
            }
        }, this);

        return usedColours;
    },

    isClashingColour(colour1, colour2){
        if (typeof colour1 !== 'undefined' && typeof colour2 !== 'undefined') {
            let colour1Name = colour1.get('name');
            let colour2Name = colour2.get('name');
            return this.isClashingColourByName(colour1Name, colour2Name);
        }
        return false;
    },

    isClashingColourByName(colour1Name, colour2Name){
        if (colour1Name.trim().toLowerCase() === colour2Name.trim().toLowerCase()) {
            return false;
        }
        let colour1ComparisonName = this.getColourKeyFromColourName(colour1Name);
        let colour2ComparisonName = this.getColourKeyFromColourName(colour2Name);
        return colour1ComparisonName === colour2ComparisonName;
    },

    getColourKeyFromColourName(colourName){
        return colourName.match(/\s?(\w+)$/i)[0].trim().toLowerCase();
    },

    getColourById(id){
        let colours = this.get('colours');
        if (colours) {
            return colours.findBy('id', id.toString());
        }
    },

    _isHiddenGroup: function (group) {
        let storageVariable = this._getGroupStorageKey(group);
        return window[storageVariable];
    },

    _getGroupStorageKey(group){
        let positionName = this.get('positionName');
        let designId = this.get('designId');

        return ('hidden_colour_group_' + designId + '_' + positionName + '_' + group).replace(/\s+/ig, '_').toLowerCase();
    },

});
