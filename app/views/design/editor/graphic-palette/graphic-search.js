/* global $, Modernizr */

import Ember from 'ember';

export default Ember.TextField.extend({
    placeholder: 'Filter by tag',
    classNames: ['graphic-search'],
    name: 'graphicFilter',

    didInsertElement: function () {
        var view = this;

        this.get('content.tags', []);

        Ember.run.later(this, function () {

            // Hack: running this after subpanel slideout because: a bug in
            // tokenfield causes some jumping on the transition

            if (view.$()) {
                view.$().tokenfield({tokens: view.get('content.tags')}).on('removeToken', function (e) {
                    var removed_token = {id: e.token.value, type: 'graphics'};

                    Ember.run(function () {
                        view.get('parentView.controller').send('addFavouriteTag', removed_token);
                    });
                });

                $('#graphicFilter .tokenfield').removeClass('form-control');
                $('#graphicFilter').show();

                Ember.run.later(this, function () {
                    if (view.get('parentView')) {
                        view.get('parentView').send('show');
                    }
                }, 500);

                view.formatTokens();
            }

        }, 750);
    },

    change: function () {
        var new_tags = this.$().tokenfield('getTokens').map(function (token) {
            return (token && token.value ? token.value.toLowerCase() : token.toString());
        });

        this.set('content.tags', new_tags);
        this.formatTokens();
    },

    formatTokens: function () {
        //capitalize the tokens, and delimit with a comma (for touch)
        var tokens = this.$().parent('.tokenfield').find('.token-label');

        //make token box visible(touch)
        if (Modernizr.touch && tokens.length > 0) {
            this.$().parent('.tokenfield').addClass('is-visible');
        }

        $(tokens).each(function (index) {

            var txt = $(this).text();

            if (Modernizr.touch && index !== tokens.length - 1 && txt.charAt(txt.length - 1) !== ',') {
                $(this).text(txt + ',');
            }
        });
    }
});
