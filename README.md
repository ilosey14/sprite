# Sprite

[documentation]: https://ilosey14.github.io/docs/js/sprite
[example]: ./example.html
[wiki]: https://en.wikipedia.org/wiki/Texture_atlas

*Sprite sheet interface for static graphics and animations on the web.*

This library generates on-the-fly sprite sheet styling and provides dynamic control over animations and transistions.

## What are Sprite Sheets?

It is often more efficient to store a group of graphics as one image file, known as a sprite sheet.
By reducing the overhead of context switching and memory allocation<sup>[[1]][wiki]</sup>,
sprites - or components of a larger graphic - can be interchanged within the same resource context
and referenced across multiple visual elements.

---

## Examples

### Simple Animation

A `Sprite` object can be created to initialize and interact with a sprite icon.

```javascript
var sprite = new Sprite(
    document.getElementById('my-sprite'),
    {
        delay: 100, // ms
        height: 32, // px
        width: 32,  // px
        url: '/img/sprite-sheet.png'
    });

sprite.animate();
```

By default, both the `canLoop` and `canReset` options are set to `false`,
meaning the animation will play once and stop on the last frame.

### Looping

Setting the `canLoop` option to `true` allows the animation to play continuously.

Add the `startFrame` and/or `endFrame` options to animate a specific section of a sprite sheet.

```javascript
var sprite = new Sprite(
    document.getElementById('my-sprite'),
    {
        canLoop: true,
        startFrame: 4,
        endFrame: 7,
        delay: 100,
        height: 32,
        width: 32,
        url: '/img/sprite-sheet.png'
    });
```

For any sprite instance, the height and width of all sprite frames is assumed to be constant.
For varying sprite sizes and offsets, create static sprites with the `Sprite.createStatic` method.

### Setting Defaults

It is not necessary to specify the same set of options across multiple `Sprite` instances.
The default options can be set as follows.

```javascript
Sprite.setOptions({
    delay: 100,
    height: 32,
    width: 32,
    url: '/img/sprite-sheet.png'
});

var sprite1 = new Sprite(container);
...
```

Note: This does not affect the default values for static sprites.

### Static Sprites

Icons are commonly set from a sprite sheet with no desire to handle the elements further.
Easily implement all static sprites across a page with the following example.

```javascript
var icons = document.getElementsByClassName('static-icon'),
    url = '/img/sprite-sheet.png';

for (var icon of icons) {
    Sprite.createStatic(icon, {
        height: icon.dataset.size,
        width: icon.dataset.size,
        x: icon.dataset.x,
        y: icon.dataset.y,
        url: url
    });
}
```

### Changing Frames

Explicitly change between any frames on a sheet.

Use the `direction` option to specify the flow direction of the indexed frames.

```javascript
var sprite = new Sprite(
    document.getElementById('my-sprite'),
    {
        ...,
        direction: Sprite.Direction.topToBottom,
        startFrame: 1
    });

sprite.icon.onclick = function () {
    sprite.setFrame(3);

    window.setTimeout(() => sprite.reset(), 1000);
};
```

### Live Demo

See the [example.html][example] for a live demo.

---

## TODO

### Generating Backend Resources

It is often useful to generate a style sheet for a given set of sprite sheets.

The goal is to incorporate style sheet generation as a build command.
Implementation may be similar to the following.

`tasks.json`
```bash
npx sprite ${workspaceFolder}/styles/sprite-config.json
```

`${workspaceFolder}/styles/sprite-config.json`
```json
{
    "sheets": [
        {
            "url": "../public/img/sprite-sheet-1.png",
            "size": 32,
            "prefix": ".icon-",
            "sprites": ["home", "back", "forward", ...]
        },
        {
            "url": "../public/img/sprite-sheet-2.png",
            "sprites": {
                ".class-name-1": {
                    "x": 0,
                    "y": 0,
                    "width": 32,
                    "height": 32
                },
                "#my-element": {
                    "size": 64
                }
            }
        }
    ]
}
```

---

## Documentation and More

There's more you can do than what's shown above.
Check the [docs][documentation] for everything about the library.

Clone the repo

```bash
git clone https://github.com/ilosey14/sprite.git
```
