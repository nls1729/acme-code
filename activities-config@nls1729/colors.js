
/*
  Activities Configurator Gnome Shell Extension

  Copyright (c) 2012-2020 Norman L. Smith

  This extension is free software; you can redistribute it and/or
  modify it under the terms of the GNU General Public License
  as published by the Free Software Foundation; either version 2
  of the License, or (at your option) any later version.

  This extension is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see
  < https://www.gnu.org/licenses/old-licenses/gpl-2.0.html >.

  This extension is a derived work of the Gnome Shell.
*/

const Clutter = imports.gi.Clutter;
const Gdk = imports.gi.Gdk;

/*

Hex Color String RGB is "#rrggbb" in settings to match color chooser
ColorRGB is {'red': N, 'green': N, 'blue': N} in extension.js is common format
ColorStringCSS is returned as a RGB string "N,N,N" from ColorRGB
ColorRGBandTransparency returns rgb as string "N,N,N" and transparency as string "T" from #rrggbbaa
ClutterColor is returned as {'red': N, 'green': N, 'blue': N, 'alpha': N} from ColorRGB and opacity
Where N is 0 - 255
Where opacity is 0.0 - 1.0
Where T is transparency 0-100

*/

function  getColorRGB(hexString) {
    let rr = parseInt(hexString.slice(1,3), 16);
    let gg = parseInt(hexString.slice(3,5), 16);
    let bb = parseInt(hexString.slice(5,7), 16);
    return {'red': rr, 'green': gg, 'blue': bb};
}

function getColorRGBandTransparency(color) {
    let alpha = 255 - parseInt(color.slice(7), 16);
    let transparency = 0;
    if (alpha == 255) {
        transparency = 100;
    } else {
        transparency = parseInt((alpha / 255) * 100);
    }
    let rgb = getColorStringCSS(getColorRGB(color.slice(0,7)));
    return({ rgb: rgb, transparency: transparency});
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
