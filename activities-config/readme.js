
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

const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

var DISABLED_HOT_CORNER = [
_("Do not disable enable-hot-corners setting."), "\r",
_("See < https://nls1729.github.io/activities_config.html >.")];

var TITLE = _("Activities Configurator Extension");

var NO_HOT_CORNERS_CHANGED = [
"\n",
_("The Activities Configurator requires the Activities Overview Hot Corner."), "\n",
_("The enable-hot-corners setting is provided in this linux distro."), "\n",
_("The enable-hot-corners setting was OFF causing the Hot Corner to be undefined."), "\n",
_("The extension has set the setting from OFF to ON creating the Hot Corner."), "\n",
_("The extension has set its preference Disable Hot Corner to ON disabling the Hot Corner."), "\n",
_("The Hot Corner function can be enabled by setting Disable Hot Corner to OFF."), "\n",
_("If the enable-hot-corners setting remains ON this message will not be displayed."), "\n",
_("See < https://nls1729.github.io/activities_config.html >."),"\n\n"];

var NO_HOT_CORNERS_UNHANDLED_KEY_FOUND = [
"\n",
_("The Activities Configurator requires the Activities Overview Hot Corner."), "\n",
_("The enable-hot-corners setting is provided in this linux distro."), "\n",
_("The extension has set the setting from OFF to ON to create the Hot Corner."), "\n",
_("The Hot Corner is undefined.  This is unexpected behavior."), "\n",
_("The Activities Configurator is not functional."), "\n",
_("An extension conflict or software error is the likely cause."), "\n",
_("See < https://nls1729.github.io/activities_config.html >."),"\n\n"];

var CLOSE = _("CLOSE");

var NO_HOT_CORNERS_CONFLICT = [
"\n",
_("The Activities Configurator requires the Activities Overview Hot Corner."), "\n",
_("The enable-hot-corners setting is not found in this linux distro."), "\n",
_("The Activities Configurator is not functional."), "\n",
_("Several other extensions are known to interact with the Hot Corner."), "\n",
_("A conflict with another extension is the likely cause."), "\n",
_("See < https://nls1729.github.io/activities_config.html >."),"\n\n"];

var README = [
_("The Activities Icon is selectable with the SELECT Icon button."), "  ",
_("The icon spacing on the panel is adjustable with the Icon Padding scale."), "  ",
_("The icon can be removed from the panel with the Hide Icon switch."), "\n\n",
_("The Activities Text can be changed by entering New Text and then pressing the APPLY button."), "  ",
_("The text spacing on the panel is adjustable with the Text Padding scale."), "  ",
_("The text can be removed from the panel with the Hide Text switch."), "\n\n",
_("Text and icon padding is left and right horizontal padding in pixels."), "\n\n",
_("The Activities Button can be removed with the Remove Activities Button switch."), "\n\n",
_("The sensitivity of the hot corner is adjustable with the Hot Corner Threshold scale."), "  ",
_("The hot corner Overview switching is disabled with the Disable Hot Corner switch."),  "\n\n",
_("If the hot corner is disabled the Overview can be toggled with the left super key."), "\n\n",
_("The workspace background may appear more aesthetically pleasing without the black panel background."), "  ",
_("The color and transparency of the panel background is adjustable with Set Panel Background Button and Panel Transparency scale (0-100%)."), "  ",
_("The default is 0, no transparency or opaque and 100 is completely transparent."), "  ",
_("This feature requires a workspace background of colors which contrast with icons and text displayed in the panel."), "\n\n",
_("Conflicts with other enabled extensions can be detected with the Enable Conflict Detection switch."), "  ",
_("This extension prefers the left-most corner of the panel."),  "  ",
_("Another extension which inserts itself in the left-most corner of the panel is considered in conflict with this preference."), "  ",
_("This extension attempts to avoid conflicts by delaying its activation at shell startup time."), "  ",
_("The delay appears to resolve most conflicts allowing the extensions to function normally."), "  ",
_("Extensions which duplicate the functions of this extension may affect or be affected when both are enabled."), "  ",
_("Try different settings for the conflicting extensions in order to avoid conflicts."), "  ",
_("Conflict Detection is disabled by default.  Enable only if you experience problems."), "  ",
_("When Conflict Detection is enabled, detected conflicts are usually automatically resolved."),   "  ",
_("If a conflict is detected this extension will re-establish its prefered position in the panel."), "  ",
_("If another extension continues to create a conflict this extension will disable itself to avoid a race condition and notify the user."), "  ",
_("The user can disable Conflict Detection if it is acceptable to have this extension not in its preferred position."), "  ",
_("The conflict can be resolved by disabling the conflicting extension or this extension and restarting the session."), "\n\n",
_("Extension settings are reset to their default values with the Extension Defaults RESET button."), "\n\n",
_("The Extension Description README button displays this readme."), "\n\n",
_("Clicking the Activities Icon or Text with the right mouse button executes GNOME Shell Extension Preferences."), "\n\n"];

var CONFLICTS = [_("A conflict between an enabled extension and the Activities Configurator Extension exists."), "  ",
_("Please resolve the conflict by disabling the offending extension or disable the Activities Configurator and restart your session."), "  ",
_("See the README of the Activities Configurator for additional information."), "\n"];

var ICON_MIA = [_("The Activities Icon was not found."), "  ",
_("The missing icon has been removed, renamed or possible filesystem corruption has damaged the icon."), "  ",
_("The default icon has automatically been selected to allow proper operation of the extension."), "  ",
_("You should determine and correct the problem, then re-select an icon."),  "\n"];

var README_TITLE = _("Activities Configurator - README");

var MIA_ICON_TITLE = _("Activities Configurator - MISSING ICON");

var SHOWING = {
    'readme' : false,
    'error'  : false
}

var TEXTS = {
    'readme' : README,
    'error'  : ICON_MIA
}

var TITLES = {
    'readme' : README_TITLE,
    'error'  : MIA_ICON_TITLE
}

function makeTextStr(strings) {
    let str = '';
    for(let i = 0; i < strings.length; i++) {
        str = str  + _(strings[i]);
    }
    return str;
}

function displayWindow(selector) {
    if(SHOWING[selector])
        return;
    SHOWING[selector] = true;
    let textStr = makeTextStr(TEXTS[selector]);
    let window = new Gtk.Window({'type': Gtk.WindowType.TOPLEVEL,
                                 'title': _(TITLES[selector])});
    let sw = new Gtk.ScrolledWindow({'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                     'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                     'hexpand': true,
                                     'vexpand': true});
    let tv = new Gtk.TextView({'wrap-mode': Gtk.WrapMode.WORD,
                               'editable': false});
    window.set_size_request(600, 400);
    let grid = new Gtk.Grid({'margin': 10, 'row_spacing': 10, 'column_spacing': 10});
    sw.add(tv);
    grid.attach(sw, 0,0,1,1);
    window.add(grid);
    window.connect('delete-event', function () {
        SHOWING[selector] = false;
        return false;});
    tv.get_buffer().set_text(textStr, -1);
    let parent = window.get_parent_window();
    window.set_transient_for(parent);
    window.set_modal(true);
    window.show_all();
}

