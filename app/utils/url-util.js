function getURLCommon(resourceName, basePath) {
    return `${window.location.protocol}//${window.location.host}${window.location.pathname}${basePath}/${resourceName}`;
}

export function getImageURL(imageName) {
    return getURLCommon(imageName, 'images');
}

export function getBrandingImageURL(imageName) {
    return getURLCommon(imageName, 'branding/images');
}

export function getPageURL(pageName) {
    return getURLCommon(pageName, 'html');
}

export function dataURIToBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const ia = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; ++i) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: dataURI.split(',')[0].split(':')[1].split(';')[0] });
}
