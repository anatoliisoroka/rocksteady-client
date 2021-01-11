import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: ['side-menu-panel'],
    open: false,

    panelChange: function () {
        let open = this.get('open');
        this.togglePanel(open);
    }.observes('open'),

    togglePanel: function (open) {
        let $panel = this.$().find('.slide-panel');
        $panel.css({
            right: open ? 0 : '100%'
        });
    }
});
