const Gtk = imports.gi.Gtk;
const Gettext = imports.gettext.domain('nls1729-extensions');
const _ = Gettext.gettext;


let README = [ "The Activities Text can be changed by entering New Text and then pressing the APPLY button.", "  ",
"The text spacing on the panel is adjustable with the Text Padding scale.", "  ",
"The text can be removed from the panel with the Hide Text switch.", "\n\n",
"The Activities Icon is selectable with the SELECT Icon button.", "  ",
"The icon spacing on the panel is adjustable with the Icon Padding scale.", "  ",
"The icon can be removed from the panel with the Hide Icon switch.", "\n\n",
"Text and icon padding is left and right horizontal padding in pixels.", "\n\n",
"The sensitivity of the hot corner is adjustable with the Hot Corner Threshold scale.", "  ",
"The hot corner Overview switching is disabled with the Disable Hot Corner switch.",  "\n\n",
"If the hot corner is disabled the Overview can be toggled with the left super key.", "\n\n",
"The Activities Button can be removed with the Remove Activities Button switch.", "\n\n",
"The workspace background may appear more aesthetically pleasing without the black panel background.", "  ",
"The color and transparency of the panel background is adjustable with Set Panel Background Button and Panel Transparency scale (0-100%).", "  ",
"The default is 0, no transparency or opaque and 100 is completely transparent.", "  ",
"This feature requires a workspace background of colors which contrast with icons and text displayed in the panel.", "\n\n",
"Extension settings are reset to their default values with the Extension Defaults RESET button.", "\n\n",
"The Extension Description README button displays this readme.", "\n\n",
"Conflicts with other enabled extensions can be detected with the Enable Conflict Detection switch.", "  ",
"This extension prefers the left-most corner of the panel.",  "  ",
"Another extension which inserts itself in the left-most corner of the panel is considered in conflict with this preference.", "  ",
"This extension attempts to avoid conflicts by delaying its activation at shell startup time.", "  ",
"The delay appears to resolve most conflicts allowing the extensions to function normally.", "  ",
"Extensions which duplicate the functions of this extension may affect or be affected when both are enabled.", "  ",
"Try different settings for the conflicting extensions in order to avoid conflicts.", "  ",
"Conflict Detection is disabled by default.  Enable only if you experience problems.", "  ",
"When Conflict Detection is enabled, detected conflicts are usually automatically resolved.",   "  ",
"If a conflict is detected this extension will re-establish its prefered position in the panel.", "  ",
"If another extension continues to create a conflict this extension will disable itself to avoid a race condition and notify the user.", "  ",
"The user can disable Conflict Detection if it is acceptable to have this extension not in its preferred position.", "  ",
"The conflict can be resolved by disabling the conflicting extension or this extension and restarting the session.", "\n\n",
"Clicking the Activities Icon or Text with the right mouse button executes GNOME Shell Extension Preferences.", "\n\n"];

let CONFLICTS = ["A conflict between an enabled extension and the Activities Configurator Extension exists.", "  ",
"Please resolve the conflict by disabling the offending extension or disable the Activities Configurator and restart your session.", "  ",
"See the README of the Activities Configurator for additional information.", "\n"];

let ICON_MIA = ["The Activities Icon was not found.", "  ",
"The missing icon has been removed, renamed or possible filesystem corruption has damaged the icon.", "  ",
"The default icon has automatically been selected to allow proper operation of the extension.", "  ",
"You should determine and correct the problem, then re-select an icon.",  "\n"];

let SHOWING = {
    'readme' : false,
    'error'  : false
}

let TEXTS = {
    'readme' : README,
    'error'  : ICON_MIA
}

let TITLES = {
    'readme' : 'Activities Configurator - README',
    'error'  : 'Activities Configurator - MISSING ICON'
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

