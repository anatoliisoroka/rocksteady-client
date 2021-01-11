import DS from 'ember-data';

export default DS.Model.extend({

    name: DS.attr('string'),
    graphicData: DS.attr('string'),
    graphicUrl: DS.attr('string'),
    isDesigner: DS.attr('boolean'),
    isUserAdded: DS.attr('boolean'),
    isPlaceholder: DS.attr('boolean'),
    tags: DS.attr('raw'),
    multicoloured: DS.attr('boolean'),
    isThemeGraphic: DS.attr('boolean', {defaultValue: false}),
    designCategory: DS.attr('string'),

    // TODO: detect, cache and return graphicType via API
    // graphicType: DS.attr('string'),
    graphicType: function () {
        let graphicData = this.get('graphicData');
        let graphicUrl = this.get('graphicUrl');

        if (graphicUrl) {
            let isSvgUrl = graphicUrl.match(/.svg$/ig);
            if (isSvgUrl) {
                return 'SVG'
            }
            return 'BITMAP';
        } else if (graphicData) {
            let isBase64RegEx = /^data/;
            if (isBase64RegEx.test(graphicData)) {
                return 'BITMAP';
            }
            return 'SVG';
        }
    }.property('graphicData', 'graphicUrl'),

    isBitmap: function () {
        return this.get('graphicType') === 'BITMAP';
    }.property('graphicType')

});
