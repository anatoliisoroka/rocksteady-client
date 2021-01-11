/* global _ */
import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'span',
    name: '',
    classNames: ['filter-menu-dropdown-icon'],

    iconNameMap: [
        {name: 'new', iconPath: 'branding/images/themes/side-menu/new.svg'},
        {name: 'popular', iconPath: 'branding/images/themes/side-menu/popular.svg'},
        {name: 'user-viewed', iconPath: 'branding/images/themes/side-menu/user-viewed.svg'},
        {name: 'engagement-metric', iconPath: 'branding/images/themes/side-menu/engagement-metric.svg'},
        {name: 'user-bookmarked', iconPath: 'branding/images/themes/side-menu/user-bookmarked.svg'}
    ],

    iconPath: function () {
        let name = this.get('name');
        let iconNameMap = this.get('iconNameMap');
        let iconName = _.find(iconNameMap, {name: name});

        if (iconName) {
            return iconName.iconPath;
        } else {
            return 'branding/images/themes/side-menu/popular.svg';
        }
    }.property('name')
});
