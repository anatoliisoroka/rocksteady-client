/* global fabric */

var RsVirtualContainerExport;

RsVirtualContainerExport = (function () {
    function RsVirtualContainer($, fabric, canvas, realWorldSize, canvasPadding, boundsOn) {
        this.$ = $;
        this.fabric = fabric;
        this.canvas = canvas;
        this.realWorldSize = realWorldSize;
        this.canvasPadding = canvasPadding;
        this.boundsOn = boundsOn;
        this.currentContainerSize = {
            width: 0,
            height: 0
        };
        this.currentContainerPosition = {
            x: 0,
            y: 0
        };
        this.currentContainerScale = 1;
        if (!this.canvasPadding) {
            this.canvasPadding = {};
        }
        if (!this.canvasPadding.percent) {
            this.canvasPadding.percent = 0;
        }
        if (!this.canvasPadding.right) {
            this.canvasPadding.right = 0;
        }
        if (this.boundsOn) {
            this.initBounds();
        }
        this.groupResize();
        if (this.boundsOn) {
            this.updateBounds();
        }
    }

    RsVirtualContainer.prototype.initBounds = function () {
        this.bounds = new fabric.Rect();
        return this.canvas.add(this.bounds);
    };

    RsVirtualContainer.prototype.updateBounds = function () {
        this.bounds.set('width', this.currentContainerSize.width).set('height', this.currentContainerSize.height).set('left', this.currentContainerPosition.x + (this.currentContainerSize.width / 2)).set('top', this.currentContainerPosition.y + (this.currentContainerSize.height / 2)).set('fill', 'transparent').set('stroke', 'green');
        this.bounds.active = false;
        return this.bounds.selectable = false;
    };

    RsVirtualContainer.prototype._positionContainer = function () {
        var canvasHeight, canvasWidth, currentContainerHeight, currentContainerWidth;
        canvasHeight = this.canvas.getHeight();
        canvasWidth = this.canvas.getWidth();
        currentContainerWidth = this.realWorldSize.width * this.currentContainerScale;
        currentContainerHeight = this.realWorldSize.height * this.currentContainerScale;
        if (this.realWorldSize.shapeWidth) {
            currentContainerWidth = this.realWorldSize.shapeWidth * this.currentContainerScale;
            currentContainerHeight = this.realWorldSize.shapeHeight * this.currentContainerScale;
        }
        this.currentContainerPosition.x = (canvasWidth - currentContainerWidth) / 2 - (this.canvasPadding.right / 2);
        return this.currentContainerPosition.y = (canvasHeight - currentContainerHeight) / 2;
    };

    RsVirtualContainer.prototype._getAspectRatio = function (objWidth, objHeight) {
        var aspectRatio;
        return aspectRatio = objWidth / objHeight;
    };

    RsVirtualContainer.prototype.groupResize = function () {
        var canvasAspectRatio, canvasHeight, canvasWidth, containerAspectRatio;
        canvasWidth = this.canvas.getWidth();
        canvasHeight = this.canvas.getHeight();
        canvasWidth -= this.canvasPadding.right;
        canvasAspectRatio = this._getAspectRatio(canvasWidth, canvasHeight);
        containerAspectRatio = this._getAspectRatio(this.realWorldSize.width, this.realWorldSize.height);
        if (canvasAspectRatio > 1 && containerAspectRatio > 1) {
            if (containerAspectRatio > canvasAspectRatio) {
                this.currentContainerSize.width = canvasWidth;
                this.currentContainerScale = this.currentContainerSize.width / this.realWorldSize.width;
                this.currentContainerSize.height = this.currentContainerScale * this.realWorldSize.height;
            } else {
                this.currentContainerSize.height = canvasHeight;
                this.currentContainerScale = this.currentContainerSize.height / this.realWorldSize.height;
                this.currentContainerSize.width = this.currentContainerScale * this.realWorldSize.width;
            }
        } else if (canvasAspectRatio < 1 && containerAspectRatio < 1) {
            if (containerAspectRatio < canvasAspectRatio) {
                this.currentContainerSize.height = canvasHeight;
                this.currentContainerScale = this.currentContainerSize.height / this.realWorldSize.height;
                this.currentContainerSize.width = this.currentContainerScale * this.realWorldSize.width;
            } else {
                this.currentContainerSize.width = canvasWidth;
                this.currentContainerScale = this.currentContainerSize.width / this.realWorldSize.width;
                this.currentContainerSize.height = this.currentContainerScale * this.realWorldSize.height;
            }
        } else if (canvasAspectRatio < 1 && containerAspectRatio > 1) {
            this.currentContainerSize.width = canvasWidth;
            this.currentContainerScale = this.currentContainerSize.width / this.realWorldSize.width;
            this.currentContainerSize.height = this.currentContainerScale * this.realWorldSize.height;
        } else if (canvasAspectRatio > 1 && containerAspectRatio < 1) {
            this.currentContainerSize.height = canvasHeight;
            this.currentContainerScale = this.currentContainerSize.height / this.realWorldSize.height;
            this.currentContainerSize.width = this.currentContainerScale * this.realWorldSize.width;
        } else if (canvasAspectRatio === 1 && containerAspectRatio < 1) {
            this.currentContainerSize.height = canvasHeight;
            this.currentContainerScale = this.currentContainerSize.height / this.realWorldSize.height;
            this.currentContainerSize.width = this.currentContainerScale * this.realWorldSize.width;
        } else if (canvasAspectRatio === 1 && containerAspectRatio >= 1) {
            this.currentContainerSize.width = canvasWidth;
            this.currentContainerScale = this.currentContainerSize.width / this.realWorldSize.width;
            this.currentContainerSize.height = this.currentContainerScale * this.realWorldSize.height;
        } else if (canvasAspectRatio > 1 && containerAspectRatio === 1) {
            this.currentContainerSize.height = canvasHeight;
            this.currentContainerScale = this.currentContainerSize.height / this.realWorldSize.height;
            this.currentContainerSize.width = this.currentContainerScale * this.realWorldSize.width;
        }
        this.currentContainerScale *= (100 - this.canvasPadding.percent) / 100;
        this.currentContainerSize.height *= (100 - this.canvasPadding.percent) / 100;
        this.currentContainerSize.width *= (100 - this.canvasPadding.percent) / 100;
        this._positionContainer();
        if (this.boundsOn) {
            return this.updateBounds();
        }
    };

    RsVirtualContainer.prototype.offsetObject = function (fabObj) {
        var offScale, offsetX, offsetY, sxb, syb;
        offScale = this.offsetScale(fabObj);
        offsetY = this.offsetTop(fabObj);
        offsetX = this.offsetLeft(fabObj);
        fabObj.set('left', offsetX);
        fabObj.set('top', offsetY);
        sxb = fabObj.get('scaleX');
        syb = fabObj.get('scaleY');
        fabObj.scale(offScale);
        fabObj.set('scaleX', sxb * this.currentContainerScale);
        return fabObj.set('scaleY', syb * this.currentContainerScale);
    };

    RsVirtualContainer.prototype.offsetScale = function (fabObj) {
        return fabObj.get('scaleX') * this.currentContainerScale;
    };

    RsVirtualContainer.prototype.offsetTop = function (fabObj) {
        return (fabObj.get('top') * this.currentContainerScale) + this.currentContainerPosition.y;
    };

    RsVirtualContainer.prototype.offsetLeft = function (fabObj) {
        return (fabObj.get('left') * this.currentContainerScale) + this.currentContainerPosition.x;
    };

    RsVirtualContainer.prototype.getOffset = function (fabObj) {
        var offset;
        offset = {};
        offset.x = this.offsetLeft(fabObj);
        offset.y = this.offsetTop(fabObj);
        offset.scale = this.offsetScale(fabObj);
        return offset;
    };

    RsVirtualContainer.prototype.rmOffsetOnObject = function (obj) {
        var originalPlacement, scale, x, y;
        originalPlacement = {};
        scale = this.rmScaleOffset(obj);
        x = this.rmLeftOffset(obj);
        y = this.rmTopOffset(obj);
        originalPlacement.scale = scale;
        originalPlacement.x = x;
        originalPlacement.y = y;
        return originalPlacement;
    };

    RsVirtualContainer.prototype.rmScaleOffset = function (obj) {
        var containerScale, objScale;
        objScale = obj.get('scaleX');
        containerScale = this.currentContainerScale;
        return this.rmScaleOffsetCalc(containerScale, objScale);
    };

    RsVirtualContainer.prototype.rmScaleOffsetCalc = function (containerScale, objScale) {
        return objScale / containerScale;
    };

    RsVirtualContainer.prototype.rmLeftOffset = function (obj) {
        var containerOffsetX, containerScale, objLeft;
        containerScale = this.currentContainerScale;
        containerOffsetX = this.currentContainerPosition.x;
        objLeft = obj.get('left');
        return this.rmLeftOffsetCalc(objLeft, containerOffsetX, containerScale);
    };

    RsVirtualContainer.prototype.rmLeftOffsetCalc = function (objLeft, containerOffsetX, containerScale) {
        return (objLeft - containerOffsetX) / containerScale;
    };

    RsVirtualContainer.prototype.rmTopOffset = function (obj) {
        var containerOffsetY, containerScale, objTop;
        containerScale = this.currentContainerScale;
        containerOffsetY = this.currentContainerPosition.y;
        objTop = obj.get('top');
        return this.rmTopOffsetCalc(objTop, containerOffsetY, containerScale);
    };

    RsVirtualContainer.prototype.rmTopOffsetCalc = function (objTop, containerOffsetY, containerScale) {
        return (objTop - containerOffsetY) / containerScale;
    };

    return RsVirtualContainer;

})();

export default RsVirtualContainerExport;

