import Ember from 'ember';

export default Ember.Component.extend({
    designId: null,
    features: null,
    fattributes: null,
    positions: null,
    colourGroups: Ember.A(),
    usedColours: [],
    coloursInteractedWith: null,
    leftOffset: function () {
        let sideMenuOpen = this.get('sideMenuOpen');
        let padding = 10;
        return sideMenuOpen ? 300 + padding : padding;
    }.property('sideMenuOpen'),

    colourClashes: function () {
        let newColourGroups = this._findClashingColourGroups();
        let existingGroups = this.get('colourGroups');
        let coloursInteractedWith = this.get('coloursInteractedWith');

        if (coloursInteractedWith) {
            coloursInteractedWith.forEach((groupName) => {
                let newGroup = newColourGroups.findBy('group', groupName);
                let existingGroup = existingGroups.findBy('group', groupName);

                if (newGroup && !existingGroup) {
                    this._addNewColourGroup(newGroup);
                }
            }, this);
        }

        this._resetColoursInteractedWith();

    }.on('didInsertElement'),

    _attachFeatureAdditionObservers: function () {
        this._removeFeatureAdditionObservers();
        this.get('features').addEnumerableObserver(this, this._featureEnumerableObserver);
    }.on('didInsertElement'),

    _removeFeatureAdditionObservers: function () {
        this.get('features').removeEnumerableObserver(this, this._featureEnumerableObserver);
    }.on('willDestroyElement'),

    featureEnabledChange: function () {
        if (this.get('featureEnabled')) {
            this._attachFeatureAdditionObservers();
            this._attachPositionObservers();
        } else {
            this._removeFeatureAdditionObservers();
            this._removeAllObservers();
            this._resetColoursInteractedWith();
            this.get('colourGroups').clear();
        }
    }.observes('featureEnabled'),

    _featureEnumerableObserver: {
        willChange: function () {
        },
        didChange: function (features, removed, adding) {
            adding.forEach(function (feature) {
                //new features position property is changed asynchronously
                Ember.run.later(this, function () {
                    this._onSelectorFeatureAddition(feature.get('position'));
                }, 200);
            }, this);
        }
    },

    //TODO Use an Enumerable observer here
    _attachPositionObservers: function () {
        let positions = this.get('positions') || Ember.A();

        positions.forEach(function (position) {
            Ember.addObserver(position, 'isIncluded', this, this._onSelectorDesignChanges);
        }, this);

    }.on('didInsertElement'),

    _removeAllObservers: function () {
        let positions = this.get('positions') || Ember.A();
        positions.forEach(function (position) {
            Ember.removeObserver(position, 'isIncluded', this, this._onSelectorDesignChanges);
        }, this);
    }.on('willDestroyElement'),

    _resetColoursInteractedWith: function () {
        this.set('coloursInteractedWith', Ember.A());
    },

    _onSelectorDesignChanges: function (positionIncluded) {
        this.positionIncluded = positionIncluded;
        Ember.run.debounce(this, this._onSelectorDesignChangesDebounced, 200);
    },

    _onSelectorFeatureAddition: function (positionIncluded) {
        let newColourGroups = this._findClashingColourGroupsForPosition(positionIncluded);
        let existingGroups = this.get('colourGroups') || [];

        newColourGroups.forEach(function (newGroup) {
            let existingGroup = existingGroups.findBy('group', newGroup.group);
            if (existingGroup) {
                this._updateColourGroup(existingGroup, newGroup);
            } else if (positionIncluded.get('isIncluded')) {
                this._addNewColourGroup(newGroup);
            }
        }, this);

        existingGroups.forEach((existingGroup) => {
            let clashingGroup = this._findClashingColourGroups().findBy('group', existingGroup.group);
            if (!clashingGroup) {
                this._removeColourGroup(existingGroup);
            }
        }, this);
    },

    _onSelectorDesignChangesDebounced: function () {
        let positionIncluded = this.positionIncluded;
        let newColourGroups = this._findClashingColourGroupsForPosition(positionIncluded);
        let existingGroups = this.get('colourGroups');

        newColourGroups.forEach(function (newGroup) {
            let existingGroup = existingGroups.findBy('group', newGroup.group);
            if (existingGroup) {
                this._updateColourGroup(existingGroup, newGroup);
            } else if (positionIncluded.get('isIncluded')) {
                this._addNewColourGroup(newGroup);
            }
        }, this);

        existingGroups.forEach((existingGroup) => {
            let clashingGroup = this._findClashingColourGroups().findBy('group', existingGroup.group);
            if (!clashingGroup) {
                this._removeColourGroup(existingGroup);
            }
        }, this);
    },

    _addNewColourGroup(newColourGroup){
        let colourGroups = this.get('colourGroups');
        Ember.set(newColourGroup, 'usedColours', newColourGroup.usedColours.sortBy('colour.name'));
        colourGroups.pushObject(newColourGroup);
    },

    _updateColourGroup(existingGroup, newGroupToMerge){
        Ember.set(newGroupToMerge, 'usedColours', newGroupToMerge.usedColours.sortBy('colour.name'));
        Ember.set(existingGroup, 'usedColours', newGroupToMerge.usedColours);
    },

    _removeColourGroup(existingGroup){
        if (!existingGroup.changeMadeByClick) {
            Ember.set(existingGroup, 'shouldRemove', true);
        }
    },

    _findClashingColourGroupByName(name){
        return this._findClashingColourGroups().findBy('group', name);
    },

    //1. Go through each position and find groups of clashing colours from all other positions
    //2. Go through all groups found and compare that to the colour groups in the current position
    //3. We are left with all clashing groups across positions and clashing groups within the related position
    //TODO refactor
    _findClashingColourGroups: function () {
        let _this = this;
        let clashingColoursBetweenPositions = {};
        let clashingColoursGrouped = [];
        let positions = this.get('positions');

        positions
            .filterBy('isIncluded')
            .forEach((position) => {
                let usedColours = position.get('usedColours');
                let otherPositions = positions
                    .filterBy('isIncluded')
                    .filter(function (otherPosition) {
                        return otherPosition.get('name') !== position.get('name');
                    });

                otherPositions.forEach(function (otherPosition) {
                    clashingColoursBetweenPositions = this._getClashingColourGroupsFromUsedColours(usedColours, otherPosition.get('usedColours'), clashingColoursBetweenPositions);
                }, this);

                _.forEach(clashingColoursBetweenPositions, function (otherPositionUsedColours) {
                    clashingColoursBetweenPositions = _this._getClashingColourGroupsFromUsedColours(usedColours, otherPositionUsedColours, clashingColoursBetweenPositions);
                });
            }, this);

        _.forEach(clashingColoursBetweenPositions, function (value, key) {
            clashingColoursGrouped.push({
                group: key,
                usedColours: value
            });
        });

        return clashingColoursGrouped;
    },

    _findClashingColourGroupsForPosition: function (position) {
        let _this = this;
        let clashingColoursBetweenPositions = {};
        let clashingColoursGrouped = [];
        let positions = this.get('positions');
        let usedColours = position.get('usedColours');

        if(positions) {
            positions
                .filterBy('isIncluded')
                .forEach((position) => {
                    let usedColours = position.get('usedColours');
                    let otherPositions = positions
                        .filterBy('isIncluded')
                        .filter(function (otherPosition) {
                            return otherPosition.get('name') !== position.get('name');
                        });

                    otherPositions.forEach(function (otherPosition) {
                        clashingColoursBetweenPositions = this._getClashingColourGroupsFromUsedColours(usedColours, otherPosition.get('usedColours'), clashingColoursBetweenPositions);
                    }, this);

                    _.forEach(clashingColoursBetweenPositions, function (otherPositionUsedColours) {
                        clashingColoursBetweenPositions = _this._getClashingColourGroupsFromUsedColours(usedColours, otherPositionUsedColours, clashingColoursBetweenPositions);
                    });
                }, this);


            if (position.get('isIncluded')) {
                let newclashingColoursBetweenPositions = {};
                position.get('usedColours').forEach(function (usedColourToKeep) {
                    let groupKey = _this._getColourKeyFromColourName(usedColourToKeep.colour.get('name'));
                    if (clashingColoursBetweenPositions[groupKey]) {
                        newclashingColoursBetweenPositions[groupKey] = clashingColoursBetweenPositions[groupKey];
                    }
                });
                clashingColoursBetweenPositions = newclashingColoursBetweenPositions;
            } else {
                clashingColoursBetweenPositions = _this._removeUsedColoursFromPosition(usedColours, clashingColoursBetweenPositions);
            }

            _.forEach(clashingColoursBetweenPositions, function (value, key) {
                clashingColoursGrouped.push({
                    group: key,
                    usedColours: value
                });
            });

        }
        return clashingColoursGrouped;
    },

    _removeUsedColoursFromPosition(usedColours, clashingColoursBetweenPositions){
        let _this = this;
        usedColours.forEach(function (usedColourToRemove) {
            let groupKey = _this._getColourKeyFromColourName(usedColourToRemove.colour.get('name'));
            if (clashingColoursBetweenPositions[groupKey]) {
                clashingColoursBetweenPositions[groupKey].forEach(function (usedColour) {
                    if (usedColourToRemove.fattribute.get('id') === usedColour.fattribute.get('id')) {
                        clashingColoursBetweenPositions[groupKey].removeObject(usedColour);
                    }
                });
            }
        });
        return clashingColoursBetweenPositions;
    },

    _getClashingColourGroupsFromUsedColours(usedColours1, usedColours2, clashingColours){
        let _this = this;
        usedColours1.forEach(function (usedColour1) {
            usedColours2.forEach(function (usedColour2) {
                let isClashing = _this._isClashingColour(usedColour1.colour, usedColour2.colour);
                if (isClashing) {
                    let groupKey = _this._getColourKeyFromColourName(usedColour1.colour.get('name'));
                    if (!_this._isHiddenGroup(groupKey)) {
                        clashingColours[groupKey] = clashingColours[groupKey] || Ember.A();
                        clashingColours[groupKey] = clashingColours[groupKey].addObjects([usedColour1, usedColour2]);
                    }
                }
            });
        });
        return clashingColours;
    },

    _isClashingColour(colour1, colour2){
        if (typeof colour1 !== 'undefined' && typeof colour2 !== 'undefined') {
            let colour1Name = colour1.get('name');
            let colour2Name = colour2.get('name');
            return this._isClashingColourByName(colour1Name, colour2Name);
        }
        return false;
    },

    _isClashingColourByName(colour1Name, colour2Name){
        if (colour1Name.trim().toLowerCase() === colour2Name.trim().toLowerCase()) {
            return false;
        }
        let colour1ComparisonName = this._getColourKeyFromColourName(colour1Name);
        let colour2ComparisonName = this._getColourKeyFromColourName(colour2Name);
        return colour1ComparisonName === colour2ComparisonName;
    },

    _getColourKeyFromColourName(colourName){
        return colourName.match(/\s?(\w+)$/i)[0].trim().toLowerCase();
    },

    _isHiddenGroup: function (group) {
        let storageVariable = this._getGroupStorageKey(group);
        return window[storageVariable];
    },

    _getGroupStorageKey(group){
        let designId = this.get('designId');
        return ('hidden_colour_group_' + designId + '_' + group).replace(/\s+/ig, '_').toLowerCase();
    }

});
