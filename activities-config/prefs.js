const GdkPixbuf = imports.gi.GdkPixbuf;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Lang = imports.lang;
const Gettext = imports.gettext.domain('nls1729-extensions');
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Keys = Me.imports.keys;
const Readme = Me.imports.readme;
const Colors = Me.imports.colors;
const _N = function(x) { return x; }

const TXT_INSTS = _N("New Text");
const HPAD_TEXT = _N("Text Padding");
const HIDE_TEXT = _N("Hide Text");
const ICO_INSTS = _N("Select Icon");
const HPAD_ICON = _N("Icon Padding");
const HIDE_ICON = _N("Hide Icon");
const SETS_HOTC = _N("Hot Corner Threshold");
const NADA_HOTC = _N("Disable Hot Corner");
const RMV_ACTIV = _N("Remove Activities Button");
const TRANS_PAN = _N("Panel Transparency");
const RST_INSTS = _N("Extension Defaults");
const RME_INSTS = _N("Extension Description");
const APPLY  = _N("APPLY");
const SELECT = _N("SELECT");
const RESET  = _N("RESET");
const README = _N("README");
const TITLE = _N("Choose Icon");
const CFLTS_DET = _N("Enable Conflict Detection");
const ACTIVITIES = _N("Activities");
const DEFAULT_ICO = Me.path + Keys.ICON_FILE;
const PAN_COLOR = _N("Set Panel Background");
const HIDE_PRCS = _N("Hide Panel Rounded Corners");
const WIN_MAXED = _N("Window Maximized Effect");


function init() {
    Convenience.initTranslations();
}

function ActivitiesConfiguratorSettingsWidget() {
    this._init();
}

ActivitiesConfiguratorSettingsWidget.prototype = {

    _init: function() {
        let version = '[v' + Me.metadata.version.toString() + ']';
        this._grid = new Gtk.Grid();
        this._grid.margin = this._grid.row_spacing = this._grid.column_spacing = 10;
	this._settings = Convenience.getSettings();
        this._settings.set_string(Keys.ORI_TXT, _(ACTIVITIES));
        this._grid.attach(new Gtk.Label({ label: _(TXT_INSTS), wrap: true, xalign: 0.0 }), 0,  0, 1, 1);
        this._grid.attach(new Gtk.Label({ label: _(HPAD_TEXT), wrap: true, xalign: 0.0 }), 0,  2, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(HIDE_TEXT), wrap: true, xalign: 0.0 }), 0,  4, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(ICO_INSTS), wrap: true, xalign: 0.0 }), 0,  6, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(HPAD_ICON), wrap: true, xalign: 0.0 }), 0,  8, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(HIDE_ICON), wrap: true, xalign: 0.0 }), 0, 10, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(SETS_HOTC), wrap: true, xalign: 0.0 }), 0, 12, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(NADA_HOTC), wrap: true, xalign: 0.0 }), 0, 14, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(RMV_ACTIV), wrap: true, xalign: 0.0 }), 0, 16, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(PAN_COLOR), wrap: true, xalign: 0.0 }), 0, 17, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(HIDE_PRCS), wrap: true, xalign: 0.0 }), 0, 18, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(TRANS_PAN), wrap: true, xalign: 0.0 }), 0, 19, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(WIN_MAXED), wrap: true, xalign: 0.0 }), 0, 20, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(CFLTS_DET), wrap: true, xalign: 0.0 }), 0, 22, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(RST_INSTS), wrap: true, xalign: 0.0 }), 0, 24, 3, 1);
        this._grid.attach(new Gtk.Label({ label: _(RME_INSTS), wrap: true, xalign: 0.0 }), 0, 26, 3, 1);
        this._grid.attach(new Gtk.Label({ label: version,      wrap: true, xalign: 0.0 }), 0, 28, 1, 1);
        let applyBtn = new Gtk.Button({ label: _(APPLY) });
        this._grid.attach(applyBtn, 7, 0, 1, 1);
        this._entry = new Gtk.Entry({ hexpand: true });
        this._grid.attach(this._entry, 1, 0, 6, 1);
        applyBtn.connect('clicked', Lang.bind(this, this._setActivitiesText));
        this._hpadText = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 24, 1);
        this._hpadText.set_value(this._settings.get_int(Keys.PAD_TXT));
        this._hpadText.connect('value-changed', Lang.bind(this, this._onTextPaddingChanged));
        this._grid.attach(this._hpadText, 3, 2, 4, 1);
        this._noText = new Gtk.Switch({active: this._settings.get_boolean(Keys.NO_TEXT)});
        this._grid.attach(this._noText, 7, 4, 1, 1);
        this._noText.connect('notify::active', Lang.bind(this, this._setNoText));
        this._iconImage = new Gtk.Image();
        this._iconPath = this._settings.get_string(Keys.NEW_ICO) || DEFAULT_ICO;
        this._loadIcon(this._iconPath);
        this._grid.attach(this._iconImage, 6, 6, 1, 1);
        let iconBtn = new Gtk.Button({ label: _(SELECT) });
        this._grid.attach(iconBtn, 7, 6, 1, 1);
        iconBtn.connect('clicked', Lang.bind(this, this._setActivitiesIcon));
        this._hpadIcon = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 24, 1);
        this._hpadIcon.set_value(this._settings.get_int(Keys.PAD_ICO));
        this._hpadIcon.connect('value-changed', Lang.bind(this, this._onIconPaddingChanged));
        this._grid.attach(this._hpadIcon, 3, 8, 4, 1);
        this._noIcon = new Gtk.Switch({active: this._settings.get_boolean(Keys.NO_ICON)});
        this._grid.attach(this._noIcon, 7, 10, 1, 1);
        this._noIcon.connect('notify::active', Lang.bind(this, this._setNoIcon));
        if(!this._settings.get_boolean(Keys.BARRIERS)) {
            this._hotCornerDelay = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 750, 25);
            this._hotCornerDelayDefault = 250;
            this._hotKey = Keys.HOTC_TO;
        } else {
            this._hotCornerDelay = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 250, 25);
            this._hotCornerDelayDefault = 100;
            this._hotKey = Keys.HOTC_PT;
        }
        this._hotCornerDelay.set_value(this._settings.get_int(this._hotKey));
        this._hotCornerDelay.connect('value-changed', Lang.bind(this, this._onHotCornerDelayChanged));
        this._grid.attach(this._hotCornerDelay, 3, 12, 4, 1);
        this._noHotCorner = new Gtk.Switch({active: this._settings.get_boolean(Keys.NO_HOTC)});
        this._grid.attach(this._noHotCorner, 7, 14, 1, 1);
        this._noHotCorner.connect('notify::active', Lang.bind(this, this._setNoHotCorner));
        this._noActivities = new Gtk.Switch({active: this._settings.get_boolean(Keys.REMOVED)});
        this._grid.attach(this._noActivities, 7, 16, 1, 1);
        this._noActivities.connect('notify::active', Lang.bind(this, this._setNoActivities));
        this._panelColor = new Gtk.ColorButton();
        this._setPanelColor();
        this._panelColor.set_use_alpha(false);
        this._panelColor.connect('notify::color', Lang.bind(this, this._onPanelColorChanged));
        this._grid.attach(this._panelColor, 7, 17, 1, 1);
        this._hideCorners = new Gtk.Switch({active: this._settings.get_boolean(Keys.HIDE_RC)});
        this._grid.attach(this._hideCorners, 7, 18, 1, 1);
        this._hideCorners.connect('notify::active', Lang.bind(this, this._setHideCorners));
        this._panelTransparency = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 100, 1);
        this._panelTransparency.set_value(this._settings.get_int(Keys.TRS_PAN));
        this._panelTransparency.connect('value-changed', Lang.bind(this, this._onPanelTransparencyChanged));
        this._grid.attach(this._panelTransparency, 3, 19, 4, 1);
        this._rbNone = new Gtk.RadioButton({label:_("Panel - No Effect")});
        this._rbOpaque = new Gtk.RadioButton({group:this._rbNone, label:_("Opaque Background Color")});
        this._rbBlack = new Gtk.RadioButton({group:this._rbNone, label:_("Black Opaque Background")});
        let rbGroup = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:2, margin_top:2, margin_bottom:2, margin_right:2});
        rbGroup.add(this._rbNone);
        rbGroup.add(this._rbOpaque);
        rbGroup.add(this._rbBlack);
        this._grid.attach(rbGroup, 4, 20, 3, 1);
        let rb = this._settings.get_int(Keys.MAX_WIN_EFFECT);
        if (rb == 0)
            this._rbNone.clicked();
        else if (rb == 1)
            this._rbOpaque.clicked();
        else
            this._rbBlack.clicked();
        this._rbNone.connect('toggled', Lang.bind(this, function(rb) {
            if(rb.get_active)
                this._settings.set_int(Keys.MAX_WIN_EFFECT, 0);
        }));
        this._rbOpaque.connect('toggled', Lang.bind(this, function(rb) {
            if(rb.get_active)
                this._settings.set_int(Keys.MAX_WIN_EFFECT, 1);
        }));
        this._rbBlack.connect('toggled', Lang.bind(this, function(rb) {
            if(rb.get_active)
                this._settings.set_int(Keys.MAX_WIN_EFFECT, 2);
        }));
        this._conflictDetection = new Gtk.Switch({active: this._settings.get_boolean(Keys.CON_DET)});
        this._grid.attach(this._conflictDetection, 7, 22, 1, 1);
        this._conflictDetection.connect('notify::active', Lang.bind(this, this._setConflictDetection));
        let defaultsBtn = new Gtk.Button({ label: _(RESET) } );
        this._grid.attach(defaultsBtn, 7, 24, 1, 1);
        defaultsBtn.connect('clicked', Lang.bind(this, this._resetSettings));
        let readmeBtn = new Gtk.Button({ label: _(README) } )
        this._grid.attach(readmeBtn, 7, 26, 1, 1);
        readmeBtn.connect('clicked', function() { Readme.displayWindow('readme')});
        if(this._settings.get_boolean(Keys.FIRST_ENABLE)) {
            this._settings.set_boolean(Keys.FIRST_ENABLE, false);
            this._resetSettings();
        }
    },

    _setBlackOnWindowMax: function(object) {
        this._settings.set_boolean(Keys.BLK_PANEL, object.active);
    },

    _setPanelColor: function() {
        let rgba = new Gdk.RGBA();
        let hexString = this._settings.get_string(Keys.COLOURS);
        rgba.parse(hexString);
        this._panelColor.set_rgba(rgba);
    },

    _cssHexString: function(css) {
        let rrggbb = '#';
        let start;
        for(let loop = 0; loop < 3; loop++) {
            let end = 0;
            let xx = '';
            for(let loop = 0; loop < 2; loop++) {
                while(true) {
                    let x = css.slice(end, end + 1);
                    if(x == '(' || x == ',' || x == ')')
                        break;
                    end = end + 1;
                }
                if(loop == 0) {
                    end = end + 1;
                    start = end;
                }
            }
            xx = parseInt(css.slice(start, end)).toString(16);
            if(xx.length == 1)
                xx = '0' + xx;
            rrggbb = rrggbb + xx;
            css = css.slice(end);
        }
        return rrggbb;
    },

    _onPanelColorChanged: function(object) {
        let rgba = this._panelColor.get_rgba();
        let css = rgba.to_string();
        let hexString = this._cssHexString(css);
        this._settings.set_string(Keys.COLOURS, hexString);
        this._panelTransparency.set_value(0);
    },

    _setConflictDetection: function(object) {
        this._settings.set_boolean(Keys.CON_DET, object.active);
    },

    _setActivitiesText: function() {
        let text = this._entry.get_text();
        if(text != '') {
            this._settings.set_string(Keys.NEW_TXT, text);
            this._entry.set_text('');
        }
    },

    _onTextPaddingChanged : function() {
        this._settings.set_int(Keys.PAD_TXT, this._hpadText.get_value());
    },

    _onIconPaddingChanged : function() {
        this._settings.set_int(Keys.PAD_ICO, this._hpadIcon.get_value());
    },

    _onHotCornerDelayChanged : function() {
        this._settings.set_int(this._hotKey, this._hotCornerDelay.get_value());
    },

    _setNoText: function(object) {
        this._settings.set_boolean(Keys.NO_TEXT, object.active);
    },

    _setActivitiesIcon: function() {
        let dialog = new Gtk.FileChooserDialog({ title: _(TITLE), action: Gtk.FileChooserAction.OPEN });
        dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        dialog.add_button(Gtk.STOCK_OPEN, Gtk.ResponseType.ACCEPT);
        dialog.set_filename(this._iconPath);
        let filter = new Gtk.FileFilter();
        filter.set_name(_("Images"));
        filter.add_pattern("*.png");
        filter.add_pattern("*.jpg");
        filter.add_pattern("*.gif");
        filter.add_pattern("*.svg");
        filter.add_pattern("*.ico");
        dialog.add_filter(filter);
        let preview = new Gtk.Image({ file:this._iconPath });
        dialog.set_preview_widget(preview);
        dialog.connect('update-preview', Lang.bind(this, function() {;
            preview.hide();
            preview.file = dialog.get_filename();
            preview.show();
        }));
        let response = dialog.run();
        if(response == -3) {
            let filename = dialog.get_filename()
            if(filename != this._iconPath) {
                this._iconPath = filename;
                this._loadIcon(filename);
                this._settings.set_string(Keys.NEW_ICO, filename);
            }
        }
        dialog.destroy();
    },

    _setNoIcon: function(object) {
        this._settings.set_boolean(Keys.NO_ICON, object.active);
    },

    _setNoHotCorner: function(object) {
        this._settings.set_boolean(Keys.NO_HOTC, object.active);
    },

    _setNoActivities: function(object) {
        this._settings.set_boolean(Keys.REMOVED, object.active);
    },

    _onPanelTransparencyChanged: function() {
        this._settings.set_int(Keys.TRS_PAN, this._panelTransparency.get_value());
    },

    _setHideCorners: function(object) {
        this._settings.set_boolean(Keys.HIDE_RC, object.active);
    },

    _resetSettings: function() {
        this._hpadText.set_value(8);
        this._hpadIcon.set_value(8);
        this._noActivities.set_active(false);
        let default_txt = this._settings.get_string(Keys.ORI_TXT);
        this._settings.set_string(Keys.NEW_TXT, default_txt);
        this._noText.set_active(false);
        this._settings.set_string(Keys.NEW_ICO, DEFAULT_ICO);
        this._iconPath = DEFAULT_ICO;
        this._loadIcon(this._iconPath);
        this._noIcon.set_active(false);
        this._hotCornerDelay.set_value(this._hotCornerDelayDefault);
        this._noHotCorner.set_active(false);
	this._settings.set_string(Keys.COLOURS,'#000000');
        this._setPanelColor();
        this._panelTransparency.set_value(0);
        this._hideCorners.set_active(false);
        this._conflictDetection.set_active(false);
        this._rbNone.clicked();
    },

    _loadIcon: function(path) {
        // Fix for when an icon goes missing in action reported by user.
        let pixbuf;
        try {
            pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(path, 32, 32, null);
        } catch (e) {
            pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(DEFAULT_ICO, 32, 32, null);
            this._settings.set_string(Keys.NEW_ICO, DEFAULT_ICO);
            this._iconPath = DEFAULT_ICO;
            Readme.displayWindow('error');
        }
        this._iconImage.set_from_pixbuf(pixbuf);
    },

    _completePrefsWidget: function() {
        let scollingWindow = new Gtk.ScrolledWindow({
                                 'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'hexpand': true, 'vexpand': true});
        scollingWindow.add_with_viewport(this._grid);
        scollingWindow.width_request = 700;
        scollingWindow.show_all();
        return scollingWindow;
    }
};

function buildPrefsWidget() {
    let widget = new ActivitiesConfiguratorSettingsWidget();
    return widget._completePrefsWidget();
}
