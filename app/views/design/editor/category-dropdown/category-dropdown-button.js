import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/editor/category_dropdown_button',
    classNames: ['btn', 'dropdown-toggle'],

    click: function () {
        // Check if menu is open if so hide, if not show
        var $dropdownMenu = this.$().siblings('.dropdown-menu');

        if ($dropdownMenu.is(':visible')) {
            $dropdownMenu.hide();
        } else {
            $dropdownMenu.show();
        }
    }

});
