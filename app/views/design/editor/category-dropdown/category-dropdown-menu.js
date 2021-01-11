import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/editor/category_dropdown_menu',
    classNames: ['dropdown-menu'],
    tagName: 'ul',
    menuContent: ['category 1', 'category 2', 'category 3'],
    didInsertElement: function () {
        if (this.get('parentView.menuOpenByDefault')) {
            this.$().show();
        }
    }

});
