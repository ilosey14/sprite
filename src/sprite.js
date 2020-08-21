/**
 * Creates a sprite animation element.
 * @param {HTMLElement} container Container element for the sprite icon
 * @param {Sprite.Options} [options]
 */
function Sprite(container, options = {}) {
    if (!(container instanceof HTMLElement))
        throw '[new Sprite] `container` must be an `HTMLElement`.';

    // set optional properties or defaults
    Sprite.__filter(options, Object.keys(Sprite.options));
    Object.assign(this, Sprite.options, options);

    // set standard properties
    this.id = Sprite.getUrlId(this.url);
    this.icon = container;
    this.isStopRequested = false;
    this.isAnimated = false;

    /** @type Sprite.Frame[] */
    this.frames = [];
    this.frameIndex = 0;

    this.sheetHeight = 0;
    this.sheetWidth = 0;

    // get sprite sheet dimensions
    // and make frame list
    if (this.url) {
        Sprite.assignSpriteSheetAsync(this, sprite => {
            Sprite.makeFrameList(sprite);
            Sprite.appendStyle(sprite);

            sprite.setFrame(sprite.startFrame);
        });
    }
}

/** @typedef {number} Sprite.Behavior */

/**
 * Animation delay behavior enum.
 * @enum {Sprite.Behavior}
 */
Sprite.Behavior = {
    linear: 0,
    easeIn: 1,
    easeOut: 2
};

/** @typedef {number} Sprite.Direction */

/**
 * Animation frame indexed flow direction enum.
 * @enum {Sprite.Direction}
 */
Sprite.Direction = {
    leftToRight: 0,
    topToBottom: 1
};

/**
 * @typedef Sprite.Options
 * @property {Sprite.Behavior} behavior Animation delay behavior
 * @property {Sprite.Direction} direction Animation frame indexed flow direction
 * @property {number} delay Delay between animated frames [ms]
 * @property {boolean} canLoop Whether the sprite can loop when animated
 * @property {boolean} canReset Whether the sprite can reset to the starting frame after animating
 * @property {number} height Sprite height [px]
 * @property {number} width Sprite width [px]
 * @property {string} url Sprite sheet url
 * @property {number} startFrame Starting frame index
 * @property {number} endFrame Ending frame index
 */

/**
 * Sprite object constructor options.
 * @interface
 * @type Sprite.Options
 */
Sprite.options = {
    behavior: Sprite.Behavior.linear,
    direction: Sprite.Direction.leftToRight,
    delay: 0,
    canLoop: false,
    canReset: false,
    height: 0,
    width: 0,
    url: null,
    startFrame: 0,
    endFrame: null
};

/**
 * Sets the default options.
 * @param {Sprite.Options} options
 */
Sprite.setOptions = function (options) {
    Sprite.__filter(options, Object.keys(this.options));
    Object.assign(this.options, options);
};

/**
 * Resource cache.
 */
Sprite.Cache = function () {
    this.items = {};
    this.length = 0;
};

/**
 * Whether the resource has been cached.
 * @param {string} url
 */
Sprite.Cache.prototype.isSet = function (url) {
    return !!this.items[url];
};

/**
 * Appends a new sprite resource.
 * @param {string} url
 */
Sprite.Cache.prototype.append = function (url) {
    if (this.isSet(url)) return;

    return this.items[url] = new Sprite.CacheItem(this.length++);
};

/**
 * Gets the url id.
 * @param {string} url
 */
Sprite.Cache.prototype.getUrlId = function (url) {
    return this.isSet(url)
        ? this.items[url].id
        : this.append(url).id;
};

/**
 * Incremenets the next static id for a unique sprite sheet.
 * @param {string} url
 */
Sprite.Cache.prototype.getNextStaticId = function (url) {
    return this.isSet(url)
        ? this.items[url].static++
        : this.append(url).static++;
};

/**
 * Gets whether the url has been styled.
 * @param {string} url
 */
Sprite.Cache.prototype.getStyled = function (url) {
    return this.isSet(url)
        ? this.items[url].isStyled
        : false;
};

/**
 * Sets the url as styled.
 * @param {string} url
 */
Sprite.Cache.prototype.setStyled = function (url) {
    if (this.isSet(url))
        this.items[url].isStyled = true;
};

/**
 * Gets the number of styled frames for the url.
 * @param {string} url
 */
Sprite.Cache.prototype.getFrames = function (url) {
    return this.isSet(url)
        ? this.items[url].frames
        : 0;
};

/**
 * Sets the number of styled frames for the url.
 * @param {string} url
 * @param {number} frames
 */
Sprite.Cache.prototype.setFrames = function (url, frames) {
    if (this.isSet(url))
        this.items[url].frames = frames;
};

/**
 * Sets the size of the resource.
 * @param {string} url
 * @param {number} height
 * @param {number} width
 */
Sprite.Cache.prototype.setSize = function (url, height, width) {
    if (this.isSet(url)) {
        this.items[url].height = height;
        this.items[url].width = width;
        this.items[url].isSized = true;
    }
};

/**
 * Gets the size of the resource.
 * @param {string} url
 */
Sprite.Cache.prototype.getSize = function (url) {
    return (this.isSet(url) && this.items[url].isSized)
        ? {
            height: this.items[url].height,
            width: this.items[url].width
        }
        : null;
};

/**
 * Cache item.
 * @param {string|number} id
 */
Sprite.CacheItem = function (id) {
    this.id = id;
    this.static = 0;
    this.frames = 0;
    this.height = 0;
    this.width = 0;
    this.isStyled = false;
    this.isSized = false;
};

Sprite.cache = new Sprite.Cache();

Sprite.className = 'sprite';
Sprite.staticClassName = 'static';

/** @type HTMLStyleElement */
Sprite.styleElement = (function () {
    var head = document.getElementsByTagName('head')[0];

    return head
        ? head.appendChild(document.createElement('style'))
        : null;
})();

/**
 * Assigns a sprite sheet source to the sprite object.
 * @param {Sprite} sprite
 * @param {{(thisArg: Sprite) => void}} callback
 */
Sprite.assignSpriteSheetAsync = function (sprite, callback) {
    // check if size has been cached
    var size = this.cache.getSize(sprite.url);

    if (size) {
        sprite.sheetHeight = size.height;
        sprite.sheetWidth = size.width;

        if (typeof callback === 'function')
            callback(sprite);

        return;
    }

    // load resource to get height/width
    var sheet = new Image();

    sheet.onload = e => {
        sprite.sheetHeight = e.target.height;
        sprite.sheetWidth = e.target.width;

        // cache
        this.cache.setSize(sprite.url, sprite.sheetHeight, sprite.sheetWidth);

        if (typeof callback === 'function')
            callback(sprite);
    };
    sheet.src = sprite.url;
};

/**
 * Gets the url id.
 * @param {string} url
 */
Sprite.getUrlId = function (url) {
    return `${this.className}-${this.cache.getUrlId(url)}`;
};

/**
 * Increments the next static id for a unique sprite sheet.
 * @param {string} url
 */
Sprite.getNextStaticId = function (url) {
    return `${this.staticClassName}-${this.cache.getNextStaticId(url)}`;
};

/**
 * Makes the sprite frame list based on the sprite sheet dimensions
 * and specified flow direction.
 * @param {Sprite} sprite
 */
Sprite.makeFrameList = function (sprite) {
    sprite.frames = [];

    // calculate the number of rows and columns
    var rows = Math.round(sprite.sheetHeight / sprite.height),
        cols = Math.round(sprite.sheetWidth / sprite.width);

    // make frame list using flow direction
    var primaryDir   = [ rows, cols ][sprite.direction],
        secondaryDir = [ cols, rows ][sprite.direction];

    for (var i = 0; i < primaryDir; i++) {
        for (var j = 0; j < secondaryDir; j++) {
            var x = j * sprite.width,
                y = i * sprite.height;

            sprite.frames.push(
                new Sprite.Frame(x, y, sprite.delay));
        }
    }

    // calculate easing delays
    switch (sprite.behavior) {
        case this.Behavior.easeIn:
            for (var i = 1; i < sprite.frames.length; i++)
                sprite.frames[i].delay = sprite.frames[i - 1].delay / 2;
            break;

        case this.Behavior.easeOut:
            for (var i = sprite.frames.length - 2; i >= 0; i--)
                sprite.frames[i].delay = sprite.frames[i + 1].delay / 2;
            break;
    }

    // set end frame
    if (sprite.endFrame === null)
        sprite.endFrame = sprite.frames.length - 1;
    else if (sprite.endFrame < 0)
        sprite.endFrame = sprite.frames.length - 1 + sprite.endFrame;
};

/**
 * Creates a CSS class string.
 * @param {string} name Class name
 * @param {Sprite.Style} style
 */
Sprite.createClass = function (name, style) {
    var styles = [];

    for (var p in style) {
        if (typeof Sprite.style[p] !== 'function') continue;

        styles.push(Sprite.style[p](style[p]));
    }

    return `.${name}{${styles.join(';')}}`;
};

/**
 * @typedef Sprite.Style
 * @property {string} backgroundImage
 * @property {{x: number, y: number}} backgroundPosition
 * @property {number} height
 * @property {number} width
 */

Sprite.style = {};

Sprite.style.backgroundImage = url => `background-image:url(${url})`;
Sprite.style.backgroundPosition = points => `background-position:-${points.x || 0}px -${points.y || 0}px`;
Sprite.style.height = height => `height:${height}px`;
Sprite.style.width = width => `width:${width}px`;

/**
 * Appends a unique class for a sprite element.
 * @param {Sprite} sprite
 */
Sprite.appendStyle = function (sprite) {
    // cache style
    this.cache.append(sprite.url);

    var isStyled = this.cache.getStyled(sprite.url);

    // class style
    sprite.icon.classList.add(sprite.id);

    if (!isStyled) {
        this.styleElement.append(
            this.createClass(sprite.id, {
                height: sprite.height,
                width: sprite.width,
                backgroundImage: sprite.url
            }));

        this.cache.setStyled(sprite.url);
    }

    // frame positions
    if (sprite.frames) {
        var i = this.cache.getFrames(sprite.url);

        for (; i < sprite.frames.length; i++) {
            this.styleElement.append(
                this.createClass(`${sprite.id}[data-frame="${i}"]`, {
                    backgroundPosition: sprite.frames[i]
                }));
        }

        this.cache.setFrames(sprite.url, i);
    }
    // new static sprite
    else {
        var staticId = this.getNextStaticId(sprite.url);

        sprite.icon.classList.add(staticId);

        this.styleElement.append(
            this.createClass(`${sprite.id}.${staticId}`, {
                backgroundPosition: {
                    x: sprite.x,
                    y: sprite.y
                }
            }));
    }
};

/**
 * Creates a static sprite
 * @param {HTMLElement} container Container element for the sprite icon
 * @param {Sprite.StaticOptions} options
 */
Sprite.createStatic = function (container, options) {
    if (!(container instanceof HTMLElement))
        throw '[Sprite.createStatic] `container` must be an `HTMLElement`.';

    // set options
    this.__filter(options, Object.keys(this.staticOptions));
    options = Object.assign({}, this.staticOptions, options);

    // set class styles
    options.id = this.getUrlId(options.url);
    options.icon = container;

    this.appendStyle(options);
};

/**
 * @typedef Sprite.StaticOptions
 * @property {number} height Sprite height in px
 * @property {number} width Sprite width in px
 * @property {number} x X position on sprite sheet in px
 * @property {number} y Y position on sprite sheet in px
 * @property {string} url Sprite sheet url
 */

/**
 * Static sprite default options.
 * @interface
 * @type Sprite.StaticOptions
 */
Sprite.staticOptions = {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
    url: null
};

/**
 * A single frame of a `Sprite` object's sprite sheet.
 * @param {number} x X position on sprite sheet [px]
 * @param {number} y Y position on sprite sheet [px]
 * @param {number} delay Delay before showing the next frame [ms]
 */
Sprite.Frame = function (x, y, delay) {
    this.x = x;
    this.y = y;
    this.delay = delay;
};

/**
 * Filters an object by its keys.
 * @param {object} obj Object to filter
 * @param {string[]} keys Object keys to keep
 */
Sprite.__filter = function (obj, keys) {
    var objKeys = Object.keys(obj);

    for (var key of objKeys)
        if (keys.indexOf(key) < 0) delete obj[key];

    return obj;
};

/**
 * Animates the sprite element.
 */
Sprite.prototype.animate = function () {
    if (this.isStopRequested) {
        this.isStopRequested
            = this.isAnimated
            = false;
        return;
    }
    else if (!this.canLoop && (this.frameIndex + 1 >= this.frames.length)) {
        if (this.canReset) this.reset();
        this.isAnimated = false;
        return;
    }

    this.setFrame(this.frameIndex + 1);

    window.setTimeout(() => this.animate(), this.frames[this.frameIndex].delay);

    if (!this.isAnimated)
        this.isAnimated = true;
};

/**
 * Sets the current sprite sheet frame.
 * @param {number} index Changes the frame to the specified index
 */
Sprite.prototype.setFrame = function (index) {
    if (index === undefined || index === this.frameIndex)
        return;

    if (index > this.endFrame)
        index = index % (this.endFrame + 1);
    else if (index < this.startFrame)
        index = this.endFrame + (index % (this.endFrame + 1));

    window.requestAnimationFrame(() => {
        this.icon.dataset.frame
            = this.frameIndex
            = index;
    });
};

/**
 * Resets the sprite animation to the initial frame.
 */
Sprite.prototype.reset = function () {
    this.setFrame(this.startFrame);
};

/**
 * Stops the sprite animation.
 * @param {boolean} reset Whether to reset the sprite animation to the initial frame
 */
Sprite.prototype.stop = function (reset = false) {
    this.isStopRequested
        = this.isAnimated
        = true;
    if (reset) this.reset();
};