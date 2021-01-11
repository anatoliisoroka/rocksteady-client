import Ember from 'ember';
import ClickOutside from '../mixins/click-outside';
import layout from '../templates/components/click-outside';
import $ from 'jquery';

export default Ember.Component.extend(ClickOutside, {
    tagName: '',
    layout,

    clickOutside(e) {
        if (this.isDestroying || this.isDestroyed) {
            return;
        }

        const exceptSelector = this.get('except-selector');
        if (exceptSelector && $(e.target).closest(exceptSelector).length > 0) {
            return;
        }

        this.sendAction('outsideClick');

    },

    _attachClickOutsideHandler: function () {
        this._cancelOutsideListenerSetup = Ember.run.next(this, this.addClickOutsideListener);
    }.on('didInsertElement'),

    _removeClickOutsideHandler: function () {
        Ember.run.cancel(this._cancelOutsideListerSetup);
        this.removeClickOutsideListener();
    }.on('willDestroyElement')
});
