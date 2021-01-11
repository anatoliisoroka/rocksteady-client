import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Component.extend({
    classNames: ['colour-group-selector'],
    colours: null,

    colourGroups: function () {
        let colours = this.get('colours');
        let colourGroups = {};
        colours.forEach((colour) => {
            colour.set('isAcgColour', this.isAcgColour(colour));
        });

        colours.forEach((colour) => {
            let group = colour.get('group');
            colourGroups[group] = colourGroups[group] || [];
            colourGroups[group].push(colour);
        });

        let cga = [];
        _.each(colourGroups, (groupColours, groupName) => {
            const defaultColour = groupName === 'Upload' ?
                colours.findBy('name', 'White') : groupColours.findBy('groupDefault', true);

            cga.push({
                colourName: defaultColour.get('name'),
                groupName: groupName,
                default: defaultColour,
                group: groupColours
            });
        });

        if (config.APP.global_edit.colour_groups_display_order.length) {
            return config.APP.global_edit.colour_groups_display_order.map((groupName) => {
                return cga.findBy('groupName', groupName);
            }).compact();
        }

        return cga.sortBy('groupName');
    }.property('colours', 'acgColours'),

    isAcgColour(colour){
        return this.get('acgColours').contains(colour);
    },

    activeGroup: null,

    open: Ember.computed.notEmpty('activeGroup'),

    toggleScrollbars: function () {
        let open = this.get('open');
        let overflowProp = open ? 'auto' : 'hidden';
        let $colourGroupDropdown = this.$().find('.colour-group-dropdown');

        $colourGroupDropdown.css({
            overflow: overflowProp
        });
    },

    toggleScrollbarsAfterAnimation: function () {
        let open = this.get('open');

        if (open) {
            Ember.run.later(this, () => {
                this.toggleScrollbars();
            }, 300);
        } else {
            this.toggleScrollbars();
        }
    }.observes('open'),


    actions: {
        selectColourGroup(colourGroup) {
            this.set('activeGroup', colourGroup);
        },

        selectColour(colour) {
            this.sendAction('selectColour', colour);
        },

        closeColourGroup() {
            this.set('activeGroup', null);
        },
        outsideClick() {
            if (this.get('open')) {
                Ember.run.later(this, () => this.send('closeColourGroup'), 400);
            }
        }
    }
});
