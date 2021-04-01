# PixelCanvas Minimap
PixelCanvas Minimap is a Tampermonkey script which allows users to easily draw using a template on PixelCanvas.io

***
## Installing
1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. Click [here](https://raw.githubusercontent.com/kekw-420/TestRepo420/decentralized/minimap.user.js) and press the "Install" button.
3. Refresh the PixelCanvas.io page.
***
## Usage overview
1. Create or get a template image from another person. The code for using your templates usually looks like this: `{"filename":"uk7uvv.png","height":360,"width":360,"x":3059,"y":-15374}`
2. Open the config menu (tip: you can make the text area bigger by dragging the bottom right corner) and paste your template on a new line **before** the final `]`
3. Add a comma to the entry before it

Your config file should look like this:

```json
[
{"filename":"1st_template.png","height":256,"width":202,"x":-594,"y":16854},
{"filename":"2nd_template.png","height":935,"width":278,"x":70834,"y":-63950},
{"filename":"3rd_template.png","height":360,"width":360,"x":0,"y":0}
]
```

Make sure that only the entries **BEFORE** your last one have a comma, or else everything will crash and burn.

![It'sAsEasyAs](https://user-images.githubusercontent.com/81622808/113070572-dfbdad00-9190-11eb-9bfd-1184c8eec62d.png)

***
##  Creating your own template
# YOU CAN TEST THE BETA MINIMAP ENTRY GENERATOR [HERE](https://kekw-420.github.io/)
1. Upload your image to [Catbox](https://catbox.moe/)
2. Create your template entry following this pattern: 

`{"filename":"FILE_NAME_ON_CATBOX.png","height":HEIGHT OF IMAGE,"width":WIDTH OF IMAGE,"x":X COORDINATE,"y":Y COORDINATE}`

Note: Height/Width are REVERSED - so they are not in the order you'd normally expect them - width then height.

***TODO: A generator would be very nice***
