const Clutter = imports.gi.Clutter;
const Gdk = imports.gi.Gdk;

/*

Hex Color String RGB is "#rrbbgg" in settings to match color chooser
ColorRGB is {'red': N, 'green': N, 'blue': N} in extension.js is common format
ColorCSS is returned as a RGB string "N,N,N" from ColorRGB
ClutterColor is returned as {'red': N, 'green': N, 'blue': N, 'alpha': N} from ColorRGB and opacity
Where N is 0 - 255
Where opacity is 0.0 - 1.0

*/

function  getColorRGB(hexString) {
    let rr = parseInt(hexString.slice(1,3), 16);
    let gg = parseInt(hexString.slice(3,5), 16);
    let bb = parseInt(hexString.slice(5,7), 16);
    return {'red': rr, 'green': gg, 'blue': bb};
}

function getColorStringCSS(color) {
    return color['red'].toString() + ',' + color['green'].toString() + ',' + color['blue'].toString();
}

function getClutterColor(color, opacity) {
    let alphaValue = 0;
    if(opacity > 0) {
        let rawAlpha = 255 * opacity;
        alphaValue = parseInt(rawAlpha);
    }
    return new Clutter.Color({red: color['red'], green: color['green'], blue: color['blue'], alpha: alphaValue});
}
