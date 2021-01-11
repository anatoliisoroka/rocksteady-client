export function initialize(/* container, application */) {
    window.FastClick.attach(document.body);
}

export default {
    name: 'init-fastclick',
    initialize: initialize
};
