/* global logger, fabric, $ */

var RsTextToPathExport,
__bind = function (fn, me) {
    return function () {
        return fn.apply(me, arguments);
    };
},
__indexOf = [].indexOf || function (item) {
    for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item) {
            return i;
        }
    }

    return -1;
};

RsTextToPathExport = (function () {
    function RsTextToPath(a, b, canvas, properties) {
        this.$ = $;
        //fabric = window.fabric;
        this.canvas = canvas;
        if (properties == null) {
            properties = "";
        }
        this._setText = __bind(this._setText, this);
        this._findKern = __bind(this._findKern, this);
        this._findGlyph = __bind(this._findGlyph, this);
        this.glyphCache = {};
        this.textObj = {};
        this._mergeProperties(properties);
        this._setText();
    }

    RsTextToPath.prototype.defaultProperties = {
        fontSize: 50,
        letterSpacing: 0,
        fill: "#000000",
        strokeStyle: "none",
        strokeWidth: 0,
        strokeStyle1: "none",
        strokeWidth1: 0,
        strokeStyle2: "none",
        strokeWidth2: 0,
        strokeStyle3: "none",
        strokeWidth3: 0,
        strokeStyle4: "none",
        strokeWidth4: 0,
        text: void 0,
        fontFamily: void 0,
        angle: 0,
        opacity: 1,
        top: 0,
        left: 0,
        lineHeight: 1,
        textAlignment: "left"
    };

    RsTextToPath.prototype._findGlyph = function (char) {
        var glyphEquiv, jQ;
        jQ = $;
        if (char === "\'") {
            glyphEquiv = this.$(this.customProperties.fontFamily).find('glyph').filter(function () {
                var glyph;
                glyph = jQ(this).attr('unicode');
                if (glyph === "\'") {
                    return glyph;
                }
            });
        } else if (char === '\"') {
            glyphEquiv = this.$(this.customProperties.fontFamily).find('glyph').filter(function () {
                var glyph;
                glyph = jQ(this).attr('unicode');
                if (glyph === '\"') {
                    return glyph;
                }
            });
        } else if (char === "\n" || char === "\\") {
            glyphEquiv = "";
        } else {
            glyphEquiv = this.$(this.customProperties.fontFamily).find("[unicode='" + char + "']");
        }
        if (glyphEquiv.length === 0) {
            glyphEquiv = this.$(this.customProperties.fontFamily).find("missing-glyph");
        }
        return {
            name: glyphEquiv.attr("glyph-name"),
            unicode: glyphEquiv.attr("unicode"),
            path: glyphEquiv.attr("d"),
            width: this._findCharWidth(glyphEquiv)
        };
    };

    RsTextToPath.prototype._findKern = function (char1, char2) {
        var dontKern, fieldName, kernEle;
        dontKern = ['\n', "\'", '\"', '\\'];
        if (!(__indexOf.call(dontKern, char1) >= 0 || __indexOf.call(dontKern, char2) >= 0)) {
            kernEle = this.glyphCache.meta.fontFamily.find("hkern[u1='" + char1 + "']").filter("[u2='" + char2 + "']");
            if (kernEle.length > 0) {
                fieldName = "" + char1 + char2;
                return this.glyphCache.kerning["" + fieldName] = parseInt(kernEle.attr('k'), 10);
            }
        }
    };

    RsTextToPath.prototype._getGlyph = function (char1) {
        return this.glyphCache[char1];
    };

    RsTextToPath.prototype._getKern = function (char1, char2) {
        var kerningPair;
        kerningPair = "" + char1 + char2;
        return this.glyphCache.kerning[kerningPair];
    };

    RsTextToPath.prototype._buildCache = function (/*chars*/) {
        var char, fieldName, fieldValue, idx, textArr, uniqueChars, _i, _j, _len, _len1, _results;
        if (!this.customProperties.text) {
            //logger.warn('TextToPathWarning', 'Unexpected: customProperties.text property is empty');
            return;
        }
        textArr = this._splitIntoArray(this.customProperties.text);
        uniqueChars = this._getUniqueChars(textArr);
        if (this.glyphCache.meta == null) {
            this._buildMeta();
        }
        if (this.glyphCache.kerning == null) {
            this.glyphCache.kerning = [];
        }
        for (idx = _i = 0, _len = textArr.length; _i < _len; idx = ++_i) {
            char = textArr[idx];
            if (idx !== textArr.length - 1) {
                this._findKern(char, textArr[idx + 1]);
            }
        }
        _results = [];
        for (idx = _j = 0, _len1 = uniqueChars.length; _j < _len1; idx = ++_j) {
            char = uniqueChars[idx];
            fieldName = char;
            if (!((this.glyphCache[fieldName] != null) || char === "\n")) {
                fieldValue = this._findGlyph(char);
                _results.push(this.glyphCache[fieldName] = fieldValue);
            } else {
                _results.push(void 0);
            }
        }
        return _results;
    };

    RsTextToPath.prototype._getUniqueChars = function (textArr) {
        var jQ, uniqueChars;
        jQ = this.$;
        return uniqueChars = this.$.grep(textArr, (function (_this) {
            return function (v, k) {
                return _this.$.inArray(v, textArr) === k;
            };
        })(this));
    };

    RsTextToPath.prototype._splitIntoArray = function (str) {
        return str.split('');
    };

    RsTextToPath.prototype._setText = function () {
        if (this.textBounds) {
            this.canvas.remove(this.textBounds);
        }
        this._buildCache();
        this._splitString();
        this._constructText();
        this._buildFabricEles();
        return this._offsetGlyphs();
    };

    RsTextToPath.prototype._splitString = function () {
        var index, line, lineChars, lines, _i, _j, _len, _len1, _ref;
        this.splitText = [];
        if (this.customProperties.text) {
            lines = [];
            _ref = this.customProperties.text.split('\n');
            for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                line = _ref[index];
                lines.push(line);
            }
            for (index = _j = 0, _len1 = lines.length; _j < _len1; index = ++_j) {
                line = lines[index];
                lineChars = line.split('');
                this.splitText.push(lineChars);
            }
            //} else {
            //logger.warn('TextToPathWarning', 'Unexpected: customProperties.text property is empty');
        }

        return this.splitText;
    };

    RsTextToPath.prototype._buildMeta = function () {
        return this.glyphCache.meta = {
            fontFamily: this.$(this.customProperties.fontFamily),
            unitsPerEm: parseInt(this.$(this.customProperties.fontFamily).find("font-face").attr("units-per-em"), 10),
            defaultCharWidth: parseInt(this.$(this.customProperties.fontFamily).find("font").attr("horiz-adv-x"), 10),
            ascent: parseInt(this.$(this.customProperties.fontFamily).find("font-face").attr("ascent"), 10),
            descent: parseInt(this.$(this.customProperties.fontFamily).find("font-face").attr("descent"), 10)
        };
    };

    RsTextToPath.prototype._trimSpaceFromEnd = function (line) {
        if (line[line.length - 1] === " ") {
            return line.pop();
        }
    };

    RsTextToPath.prototype._constructText = function () {
        this.textObj.glyphs = [];
        return this.splitText.forEach((function (_this) {
            return function (line) {
                var lineArr;
                _this._trimSpaceFromEnd(line);
                lineArr = [];
                line.forEach(function (char, idx) {
                    var glyph, glyphCopy, kerningPair;
                    glyph = _this._getGlyph(char);
                    kerningPair = _this._getKern(char, line[idx + 1]);
                    glyphCopy = _this.$.extend({}, glyph);
                    if (kerningPair !== void 0) {
                        glyphCopy.width = glyphCopy.width - kerningPair;
                    }
                    if (_this.customProperties.letterSpacing !== 0) {
                        glyphCopy.width = glyphCopy.width + (_this.customProperties.letterSpacing * 10);
                    }
                    return lineArr.push(glyphCopy);
                });
                return _this.textObj.glyphs.push(lineArr);
            };
        })(this));
    };

    RsTextToPath.prototype._findCharWidth = function (glyphEquiv) {
        if (glyphEquiv.attr("horiz-adv-x") === void 0 || glyphEquiv.attr("horiz-adv-x") === '' || glyphEquiv.attr("horiz-adv-x") === null) {
            return this.glyphCache.meta.defaultCharWidth;
        } else {
            return parseInt(glyphEquiv.attr("horiz-adv-x"), 10);
        }
    };

    RsTextToPath.prototype._detectNewline = function (obj) {
        if (obj.unicode === '/n') {
            return true;
        }
    };

    RsTextToPath.prototype._buildFabTextBounds = function () {
        return this.textBounds = new fabric.Group().set('top', this.customProperties.top).set('left', this.customProperties.left).scale(this._calcScaleFromFont());
    };

    RsTextToPath.prototype._buildFabLine = function (yPosition) {
        var lineGroup;
        return lineGroup = new fabric.Group().set('height', (this.glyphCache.meta.ascent + Math.abs(this.glyphCache.meta.descent)) * this.customProperties.lineHeight).set('top', yPosition);
    };

    RsTextToPath.prototype._buildFabChar = function (charData, xPosition) {
        var baseCharacter, borderProperties, borders, character, characterGroup, left, n, startValue, strokeWidth;
        left = xPosition + (charData.width / 2);
        baseCharacter = new fabric.Path(charData.path).set('fill', this.customProperties.fill).set('top', 0).set('left', left).set('width', charData.width).set('height', this.glyphCache.meta.ascent + Math.abs(this.glyphCache.meta.descent)).set('scaleY', -1).set('pathOffset', {
            x: charData.width / 2,
            y: (this.glyphCache.meta.ascent + Math.abs(this.glyphCache.meta.descent)) / 2
        });
        baseCharacter.set('left', 0);
        characterGroup = new fabric.Group().set('width', charData.width).set('left', left);
        borderProperties = this._getBorders();
        borders = [];
        n = 0;
        startValue = 0;
        while (n < borderProperties.length) {
            if (borderProperties[n].strokeWidth !== 0) {
                strokeWidth = borderProperties[n].strokeWidth + startValue;
                startValue = strokeWidth;
                character = fabric.util.object.clone(baseCharacter).set('strokeWidth', strokeWidth).set('stroke', borderProperties[n].strokeStyle).set('fill', '');
                borders.push(character);
            }
            n += 1;
        }
        borders.reverse();
        $(borders).each(function (index, border) {
            return characterGroup.add(border);
        });
        characterGroup.add(baseCharacter);
        return characterGroup;
    };

    RsTextToPath.prototype._getBorders = function () {
        return [
            {
                strokeStyle: this.customProperties.strokeStyle1,
                strokeWidth: this.customProperties.strokeWidth1 * 10
            }, {
                strokeStyle: this.customProperties.strokeStyle2,
                strokeWidth: this.customProperties.strokeWidth2 * 10
            }, {
                strokeStyle: this.customProperties.strokeStyle3,
                strokeWidth: this.customProperties.strokeWidth3 * 10
            }, {
                strokeStyle: this.customProperties.strokeStyle4,
                strokeWidth: this.customProperties.strokeWidth4 * 10
            }
        ];
    };

    RsTextToPath.prototype._buildFabricEles = function () {
        var fabChar, largestLineWidth, line, lineGroup, lineHeight, lineWidth, lineYPosition, numLines, obj, textBoundsHeight, xAdvance, yAdvance, _i, _j, _len, _len1, _ref;
        if (!this.glyphCache || !this.glyphCache.meta) {
            logger.warn('TextToPathWarning', 'Unexpected: @glyphCache.meta is undefined (2)');
            return 0;
        }
        this._buildFabTextBounds();
        numLines = this.textObj.glyphs.length;
        if (numLines <= 1) {
            this.customProperties.lineHeight = 1;
        }
        lineHeight = (this.glyphCache.meta.ascent + Math.abs(this.glyphCache.meta.descent)) * this.customProperties.lineHeight;
        textBoundsHeight = numLines * lineHeight;
        this.textBounds.set('height', textBoundsHeight);
        yAdvance = lineHeight;
        largestLineWidth = 0;
        _ref = this.textObj.glyphs;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            line = _ref[_i];
            lineYPosition = yAdvance - (textBoundsHeight / 2 + lineHeight / 2);
            xAdvance = 0;
            lineGroup = this._buildFabLine(lineYPosition);
            for (_j = 0, _len1 = line.length; _j < _len1; _j++) {
                obj = line[_j];
                if (!(obj.path === void 0 || obj.path === '')) {
                    fabChar = this._buildFabChar(obj, xAdvance);
                    lineWidth = xAdvance + obj.width;
                    lineGroup.add(fabChar);
                }
                xAdvance = xAdvance + obj.width;
                lineGroup.set('width', xAdvance);
            }
            yAdvance += (this.glyphCache.meta.ascent + Math.abs(this.glyphCache.meta.descent)) * this.customProperties.lineHeight;
            this.textBounds.add(lineGroup);
            if (xAdvance > largestLineWidth) {
                largestLineWidth = xAdvance;
                this.textBounds.set('width', largestLineWidth);
            }
        }
        this.textBounds.setAngle(this.customProperties.angle);
        this.textBounds.setOpacity(this.customProperties.opacity);
        this.textBounds.fontSize = this.customProperties.fontSize;
        this.textBounds.unitsPerEm = this.glyphCache.meta.unitsPerEm;
        return this.textBounds;
    };

    RsTextToPath.prototype._offsetGlyphs = function () {
        var currentPos, glyph, line, lineWidth, textBoundsWidth, _i, _len, _ref, _results;
        textBoundsWidth = this.textBounds.get('width');
        _ref = this.textBounds._objects;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            line = _ref[_i];
            lineWidth = line.get('width');
            if (this.customProperties.textAlignment === 'right') {
                line.set('left', (textBoundsWidth / 2) - (lineWidth / 2));
            } else if (this.customProperties.textAlignment === 'left') {
                line.set('left', (lineWidth / 2) - (textBoundsWidth / 2));
            }
            //line;
            /* jshint loopfunc:true */
            _results.push((function () {
                var _j, _len1, _ref1, _results1;
                _ref1 = line._objects;
                _results1 = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    glyph = _ref1[_j];
                    currentPos = glyph.get('left');
                    glyph.set('left', currentPos - (lineWidth / 2));
                    _results1.push(glyph);
                }
                return _results1;
            })());
            /* jshint loopfunc:false */
        }
        return _results;
    };

    RsTextToPath.prototype._calcScaleFromFont = function () {
        if (!this.glyphCache.meta) {
            logger.warn('TextToPathWarning', 'Unexpected: @glyphCache.meta is undefined (1)');
            return 0;
        }
        return this.customProperties.fontSize / this.glyphCache.meta.unitsPerEm;
    };

    RsTextToPath.prototype._calcFontSize = function (scale) {
        return scale * this.glyphCache.meta.unitsPerEm;
    };

    RsTextToPath.prototype._ascenderToEmSquarePercent = function () {
        return (this.glyphCache.meta.ascent / this.glyphCache.meta.unitsPerEm) * 100;
    };

    RsTextToPath.prototype._calcScale = function (sizeInPixels) {
        return sizeInPixels * this.glyphCache.meta.unitsPerEm / this.customProperties.fontSize;
    };

    RsTextToPath.prototype._mergeProperties = function (properties) {
        return this.customProperties = this.$.extend({}, this.defaultProperties, properties);
    };

    RsTextToPath.prototype.render = function () {
        this.removeInstance();
        return this.canvas.add(this.textBounds);
    };

    RsTextToPath.prototype.fill = function (fillColour) {
        this.customProperties.fill = fillColour;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeStyle = function (newStroke) {
        this.customProperties.strokeStyle = newStroke;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeStyle1 = function (newStroke) {
        this.customProperties.strokeStyle1 = newStroke;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeStyle2 = function (newStroke) {
        this.customProperties.strokeStyle2 = newStroke;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeStyle3 = function (newStroke) {
        this.customProperties.strokeStyle3 = newStroke;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeStyle4 = function (newStroke) {
        this.customProperties.strokeStyle4 = newStroke;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeWidth = function (newStrokeWidth) {
        this.customProperties.strokeWidth = parseFloat(newStrokeWidth);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeWidth1 = function (newStrokeWidth) {
        this.customProperties.strokeWidth1 = parseFloat(newStrokeWidth);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeWidth2 = function (newStrokeWidth) {
        this.customProperties.strokeWidth2 = parseFloat(newStrokeWidth);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeWidth3 = function (newStrokeWidth) {
        this.customProperties.strokeWidth3 = parseFloat(newStrokeWidth);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.strokeWidth4 = function (newStrokeWidth) {
        this.customProperties.strokeWidth4 = parseFloat(newStrokeWidth);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.letterSpacing = function (newLetterSpacing) {
        this.customProperties.letterSpacing = parseFloat(newLetterSpacing);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.fontSize = function (newFontSize) {
        this.customProperties.fontSize = parseFloat(newFontSize);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.scale = function (newScaleSize) {
        this.customProperties.fontSize = this._calcFontSize(newScaleSize);
        this.textBounds.scale(newScaleSize);
        return this.textBounds.fontSize = this.customProperties.fontSize;
    };

    RsTextToPath.prototype.lineHeight = function (newLineHeight) {
        this.customProperties.lineHeight = parseFloat(newLineHeight);
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.textAlignment = function (alignment) {
        this.customProperties.textAlignment = alignment;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.text = function (newText) {
        this.customProperties.text = newText;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.fontFamily = function (newFont) {
        this.emptyCache();
        this.customProperties.fontFamily = newFont;
        this.removeInstance();
        return this._setText();
    };

    RsTextToPath.prototype.top = function (newTop) {
        this.customProperties.top = parseFloat(newTop);
        return this.textBounds.set('top', newTop);
    };

    RsTextToPath.prototype.left = function (newLeft) {
        this.customProperties.left = parseFloat(newLeft);
        return this.textBounds.set('left', newLeft);
    };

    RsTextToPath.prototype.angle = function (newAngle) {
        this.customProperties.angle = parseFloat(newAngle);
        return this.textBounds.setAngle(newAngle);
    };

    RsTextToPath.prototype.opacity = function (newOpacity) {
        this.customProperties.opacity = parseFloat(newOpacity);
        return this.textBounds.setOpacity(newOpacity);
    };

    RsTextToPath.prototype.removeInstance = function () {
        return this.canvas.remove(this.textBounds);
    };

    RsTextToPath.prototype.getFabObj = function () {
        return this.textBounds;
    };

    RsTextToPath.prototype.getWidth = function () {
        return this.textBounds.get('width');
    };

    RsTextToPath.prototype.getHeight = function () {
        return this.textBounds.get('height');
    };

    RsTextToPath.prototype.getCache = function () {
        return this.glyphCache;
    };

    RsTextToPath.prototype.emptyCache = function () {
        this.glyphCache = null;
        return this.glyphCache = {};
    };

    RsTextToPath.prototype.updateFontSize = function () {
        var scale;
        scale = this.textBounds.get('scaleX');
        this.customProperties.fontSize = this._calcFontSize(scale);
        return this.textBounds.fontSize = this.customProperties.fontSize;
    };

    return RsTextToPath;

})();

export default RsTextToPathExport;
