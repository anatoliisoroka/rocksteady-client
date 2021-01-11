import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['side-menu'],
    classNameBindings: ['open:open'],
    tagName: 'div'
});
