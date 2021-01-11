export default {
    date: {
        'time-style': {
            hour:   'numeric',
            minute: 'numeric',
            second: 'numeric'
        }
    },
    number: {
        EUR: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 },
        USD: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
        AUD: { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 },
        CAD: { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 },
        GBP: { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }
    },
    time: {
        hhmmss: {
            hour:   'numeric',
            minute: 'numeric',
            second: 'numeric'
        }
    }
};
