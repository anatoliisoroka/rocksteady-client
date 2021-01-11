import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    enabled: true,
    classNameBindings: [':rs-icon', ':icon-arrow', 'background:icon-background', 'enabled::disabled']
});
