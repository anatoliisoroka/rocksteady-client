/* global logger */

export function localizeDeliveryEstimate(value, t) {

    var nice,
        dayMatches = value.match(/^([\d\-]+)$/);

    if (value === '1') {
        nice = t('checkout.day');
    } else if (dayMatches) {
        nice = t('checkout.days', {days: dayMatches[1]});
    } else {
        logger.warn('DeliveryEstimateWarning', 'Cannot parse delivery estimate \'' + value + '\'');
        nice = t('checkout.days', {days: 14});
    }

    return nice.toString();
}
