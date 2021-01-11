import Ember from 'ember';
import config from '../config/environment';

export default Ember.Component.extend({

    classNames: ['combobox'],
    classNameBindings: ['isFullWidth', 'comboboxClass'],

    didInsertElement: function () {
        var view = this;

        this.$('input').on('focus.filterBy', function () {
            view.get('parentView.controller').set('filterBy', view.get('filterBy'));
        });

        var component = this,
            combobox = this.$('.combobox-input'),
            menu = this.$('.dropdown-menu');

        combobox.on('keyup', function (e) {
            if (e.keyCode === 13) {
                menu.find('a').first().click();
            } else if (e.keyCode === 40) {
                menu.find('a').first().focus();
            }
        });

        this.$('.dropdown-toggle').dropdown();

        this.$('.dropdown')
            .on('hidden.bs.dropdown', function () {
                component.set('filter', '');
            })
            .on('shown.bs.dropdown', function () {
                combobox.focus();

                if (config.APP.testing) {
                    combobox.on('click', function (e) {
                        e.stopPropagation();
                    });
                }
            });

        if (config.APP.tooltips && this.$()) {
            this.$().find('[title]').tooltip({ container: 'body' });
        }
    },

    willDestroyElement: function () {
        this.$('input').off('focus.filterBy');
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('[title]').tooltip('destroy');
        }
    }
});
