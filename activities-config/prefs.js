const GdkPixbuf = imports.gi.GdkPixbuf;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;
const Convenience = Me.imports.convenience;
const Keys = Me.imports.keys;
const Readme = Me.imports.readme;
const Colors = Me.imports.colors;
const GioSSS = Gio.SettingsSchemaSource;
const THEME_SCHEMA = 'org.gnome.shell.extensions.user-theme';
const TXT_INSTS = _("New Text");
const HPAD_TEXT = _("Text Padding");
const HIDE_TEXT = _("Hide Text");
const ICO_INSTS = _("Select Icon");
const HPAD_ICON = _("Icon Padding");
const HIDE_ICON = _("Hide Icon");
const SETS_HOTC = _("Hot Corner Threshold");
const NADA_HOTC = _("Disable Hot Corner");
const RMV_ACTIV = _("Remove Activities Button");
const TRANS_PAN = _("Panel Transparency");
const RST_DFLTS = _("Extension Defaults");
const RME_INSTS = _("Extension Description");
const APPLY  = _("APPLY");
const SELECT = _("SELECT");
const RESET  = _("RESET");
const README = _("README");
const TITLE = _("Choose Icon");
const CFLTS_DET = _("Enable Conflict Detection");
const ACTIVITIES = _("Activities");
const DEFAULT_ICO = Me.path + Keys.ICON_FILE;
const PAN_COLOR = _("Set Panel Background");
const HIDE_PRCS = _("Hide Panel Rounded Corners");
const WIN_MAXED = _("Window Maximized Effect");
const HIDE_APPI = _("Hide Application Menu Button Icon");
const PAN_SHDOW = _("Panel Shadow Color");
const SHW_TRANS = _("Transparency");
const SHW_VERT  = _("Vertical Length");
const SHW_BLUR  = _("Blur Radius");
const SHW_SPRED = _("Spread Radius");
const OVERR_USR = _("Override Shell Theme");
const SHOW_OVER = _("Show Overview If No Applications Are Running");
const POSITION  = _("Move Activities to the Right");
const COMMIT = "Commit: fa3a78b5c47cbf615ce2346f6f061e3a28f4eaec";

function init() {
    Convenience.initTranslations();
}

function ActivitiesConfiguratorSettingsWidget() {
    this._init();
}

ActivitiesConfiguratorSettingsWidget.prototype = {

    _init: function() {
        let shell_version = Me.metadata["shell-version"].toString();
        let version = '[v' + Me.metadata.version.toString();
        version = version  + ' GS '  + shell_version + ']';
        this._grid = new Gtk.Grid();
        this._grid.margin = 5;
        this._grid.row_spacing = 5;
        this._grid.column_spacing = 5;
        this._grid.set_column_homogeneous(false);
	this._settings = Convenience.getSettings();
        this._settings.set_string(Keys.ORI_TXT, _(ACTIVITIES));
        this._grid.attach(new Gtk.Label({ label: _(ICO_INSTS), wrap: true, xalign: 0.0 }), 1,  0, 2, 1);
        this._grid.attach(new Gtk.Label({ label: _(HIDE_ICON), wrap: true, xalign: 0.0 }), 1,  1, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(HPAD_ICON), wrap: true, xalign: 0.0 }), 1,  2, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(TXT_INSTS), wrap: true, xalign: 0.0 }), 1,  3, 1, 1);
        this._grid.attach(new Gtk.Label({ label: _(HIDE_TEXT), wrap: true, xalign: 0.0 }), 1,  4, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(HPAD_TEXT), wrap: true, xalign: 0.0 }), 1,  5, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(RMV_ACTIV), wrap: true, xalign: 0.0 }), 1,  6, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(SETS_HOTC), wrap: true, xalign: 0.0 }), 1,  7, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(NADA_HOTC), wrap: true, xalign: 0.0 }), 1,  8, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(HIDE_PRCS), wrap: true, xalign: 0.0 }), 1,  9, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(HIDE_APPI), wrap: true, xalign: 0.0 }), 1, 10, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(SHOW_OVER), wrap: true, xalign: 0.0 }), 1, 14, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(PAN_COLOR), wrap: true, xalign: 0.0 }), 1, 18, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(TRANS_PAN), wrap: true, xalign: 0.0 }), 1, 20, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(PAN_SHDOW), wrap: true, xalign: 0.0 }), 1, 21, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(SHW_TRANS), wrap: true, xalign: 0.0 }), 1, 22, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(SHW_VERT) , wrap: true, xalign: 0.0 }), 1, 23, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(SHW_BLUR) , wrap: true, xalign: 0.0 }), 1, 24, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(SHW_SPRED), wrap: true, xalign: 0.0 }), 1, 25, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(WIN_MAXED), wrap: true, xalign: 0.0 }), 1, 26, 1, 1);
        this._grid.attach(new Gtk.Label({ label: _(POSITION),  wrap: true, xalign: 0.0 }), 1, 30, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(CFLTS_DET), wrap: true, xalign: 0.0 }), 1, 35, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(RST_DFLTS), wrap: true, xalign: 0.0 }), 1, 37, 5, 1);
        this._grid.attach(new Gtk.Label({ label: _(RME_INSTS), wrap: true, xalign: 0.0 }), 1, 39, 5, 1);
        this._grid.attach(new Gtk.Label({ label: version,      wrap: true, xalign: 1.0 }), 3,  0, 3, 1);
        this._grid.attach(new Gtk.Label({ label: COMMIT,       wrap: true, xalign: 0.5 }), 0, 44, 6, 1);


        // Icon
        this._iconImage = new Gtk.Image();
        this._iconPath = this._settings.get_string(Keys.NEW_ICO) || DEFAULT_ICO;
        this._loadIcon(this._iconPath);
        let iconBtn = new Gtk.Button({ label: _(SELECT) });
        this._noIcon = new Gtk.Switch({active: this._settings.get_boolean(Keys.NO_ICON)});
        let noIconBox = new Gtk.Box({sensitive: true});
        noIconBox.pack_start(this._noIcon, false, false, 0);
        this._hpadIcon = Gtk.SpinButton.new_with_range(0, 24, 1);
        this._hpadIcon.set_value(this._settings.get_int(Keys.PAD_ICO));
        iconBtn.connect('clicked', Lang.bind(this, this._setActivitiesIcon));
        this._noIcon.connect('notify::active', Lang.bind(this, this._setNoIcon));
        this._hpadIcon.connect('value-changed', Lang.bind(this, this._onIconPaddingChanged));
        this._grid.attach(this._iconImage,  2, 0, 1, 1);
        let iconBtnBox = new Gtk.Box({sensitive: true});
        iconBtnBox.pack_start(iconBtn, false, false, 0);
        this._grid.attach(iconBtnBox, 0, 0, 1, 1);
        this._grid.attach(noIconBox, 0,  1, 1, 1);
        this._grid.attach(this._hpadIcon, 0, 2, 1, 1);

        // Text
        let text = this._settings.get_string(Keys.NEW_TXT);
        this._entry = new Gtk.Entry({ hexpand: true });
        this._entry.set_text(text);
        let buffer = this._entry.get_buffer();
        buffer.connect('inserted-text', Lang.bind(this, this._setSetBtnSensitive));
        buffer.connect('deleted-text', Lang.bind(this, this._setSetBtnSensitive));
        this._applyBtn = new Gtk.Button({ label: _(APPLY) });
        this._applyBtn.set_sensitive(false);
        this._noText = new Gtk.Switch({active: this._settings.get_boolean(Keys.NO_TEXT)});
        this._hpadText = Gtk.SpinButton.new_with_range(0, 24, 1);
        this._hpadText.set_value(this._settings.get_int(Keys.PAD_TXT));
        this._applyBtn.connect('clicked', Lang.bind(this, this._setActivitiesText));
        this._noText.connect('notify::active', Lang.bind(this, this._setNoText));
        this._hpadText.connect('value-changed', Lang.bind(this, this._onTextPaddingChanged));
        this._grid.attach(this._entry, 2, 3, 3,1);
        let applyBtnBox = new Gtk.Box({sensitive: true});
        applyBtnBox.pack_start(this._applyBtn, false, false, 0);
        this._grid.attach(applyBtnBox, 0, 3, 1, 1);
        let noTextBox = new Gtk.Box;
        noTextBox.pack_start(this._noText, false, false, 0);
        this._grid.attach(noTextBox, 0, 4, 1, 1);
        this._grid.attach(this._hpadText, 0, 5, 1, 1);

        // Remove Activities Button
        this._noActivities = new Gtk.Switch({active: this._settings.get_boolean(Keys.REMOVED)});
        this._noActivities.connect('notify::active', Lang.bind(this, this._setNoActivities));
        let noActivitiesBox = new Gtk.Box;
        noActivitiesBox.pack_start(this._noActivities, false, false, 0);
        this._grid.attach(noActivitiesBox, 0, 6, 1, 1);

        // Hot Corner
        if(!this._settings.get_boolean(Keys.BARRIERS)) {
            this._hotCornerDelay = Gtk.SpinButton.new_with_range(0, 750, 25);
            this._hotCornerDelayDefault = 250;
            this._hotKey = Keys.HOTC_TO;
        } else {
            this._hotCornerDelay = Gtk.SpinButton.new_with_range(0, 250, 25);
            this._hotCornerDelayDefault = 100;
            this._hotKey = Keys.HOTC_PT;
        }
        this._hotCornerDelay.set_value(this._settings.get_int(this._hotKey));
        this._noHotCorner = new Gtk.Switch({active: this._settings.get_boolean(Keys.NO_HOTC)});
        this._hotCornerDelay.connect('value-changed', Lang.bind(this, this._onHotCornerDelayChanged));
        this._noHotCorner.connect('notify::active', Lang.bind(this, this._setNoHotCorner));
        this._grid.attach(this._hotCornerDelay, 0, 7, 1, 1);
        let noHotCornerBox = new Gtk.Box;
        noHotCornerBox.pack_start(this._noHotCorner, false, false, 0);        
        this._grid.attach(noHotCornerBox, 0, 8, 1, 1);

        // Panel Rounded Corners
        this._hideCorners = new Gtk.Switch({active: this._settings.get_boolean(Keys.HIDE_RC)});
        this._hideCorners.connect('notify::active', Lang.bind(this, this._setHideCorners));
        let hideCornersBox = new Gtk.Box;
        hideCornersBox.pack_start(this._hideCorners, false, false, 0);
        this._grid.attach(hideCornersBox, 0, 9, 1, 1);

        // Hide Application Menu Button Icon
        this._hideAppMenuButtonIcon = new Gtk.Switch({active: this._settings.get_boolean(Keys.HIDE_APPMBI)});
        this._hideAppMenuButtonIcon.connect('notify::active', Lang.bind(this, this._setHideAppMenuButtonIcon));
        let hideAppMenuButtonIconBox = new Gtk.Box;
        hideAppMenuButtonIconBox.pack_start(this._hideAppMenuButtonIcon, false, false, 0);
        this._grid.attach(hideAppMenuButtonIconBox, 0, 10, 1, 1);

        // Override User Theme Background Color and Transparency
        // This override is only effective for User Themes with CSS for Panel background-color.
        // This will not override Panel background-images.
        this._overrideUserOrClassicTheme = new Gtk.Switch({active: this._settings.get_boolean(Keys.OVERR_THEME)});
        this._overrideUserOrClassicTheme.connect('notify::active', Lang.bind(this, this._setOverrideUserOrClassicTheme));
        let overrideUserOrClassicTheme = new Gtk.Box;
        overrideUserOrClassicTheme.pack_start(this._overrideUserOrClassicTheme, false, false, 0);
        this._grid.attach(overrideUserOrClassicTheme, 0, 12, 1, 1);
        this._shellThemeName = new Gtk.Label();
        let instructions = new Gtk.Label({ label: _(OVERR_USR), wrap: true, xalign: 0.0 });
        let shellThemeNameBox = new Gtk.Box;
        shellThemeNameBox.pack_start(instructions, false, false, 0);
        shellThemeNameBox.pack_start(this._shellThemeName, false, false, 0);
        this._grid.attach(shellThemeNameBox, 1, 12, 6, 1);

        // Show Overview if no applications are running
        this._showOverview = new Gtk.Switch({active: this._settings.get_boolean(Keys.SHOW_OVERVIEW)});
        this._showOverview.connect('notify::active', Lang.bind(this, this._setShowOverview));
        let showOverviewBox = new Gtk.Box;
        showOverviewBox.pack_start(this._showOverview, false, false, 0);
        this._grid.attach(showOverviewBox, 0, 14, 1, 1);

        // Panel Background Color
        this._panelColor = new Gtk.ColorButton();
        this._setPanelColor();
        this._panelColor.set_use_alpha(false);
        this._panelColor.connect('notify::color', Lang.bind(this, this._onPanelColorChanged));
        let panelColorBox = new Gtk.Box({sensitive: true});
        panelColorBox.pack_start(this._panelColor, false, false, 20);
        this._grid.attach(panelColorBox, 0, 18, 1, 1);

        // Panel Transparency
        this._panelTransparency = Gtk.SpinButton.new_with_range(0, 100, 1);
        this._panelTransparency.set_value(this._settings.get_int(Keys.TRS_PAN));
        this._panelTransparency.connect('value-changed', Lang.bind(this, this._onPanelTransparencyChanged));
        this._grid.attach(this._panelTransparency, 0, 20, 1, 1);

        // Panel Shadow Color
        this._shadowColor = new Gtk.ColorButton();
        this._setShadowColor();
        this._shadowColor.set_use_alpha(false);
        this._shadowColor.connect('notify::color', Lang.bind(this, this._onPanelShadowColorChanged));
        let shadowColorBox = new Gtk.Box({sensitive: true});
        shadowColorBox.pack_start(this._shadowColor, false, false, 20);
        this._grid.attach(shadowColorBox, 0, 21, 1, 1);

        // Panel Shadow Transparency
        this._shadowTransparency = Gtk.SpinButton.new_with_range(0, 100, 1);
        this._shadowTransparency.set_value(this._settings.get_int(Keys.SHADOW_TRANS));
        this._shadowTransparency.connect('value-changed', Lang.bind(this, this._onShadowTransparencyChanged));
        this._grid.attach(this._shadowTransparency, 0, 22, 1, 1);

        // Panel Shadow Verical Length
        this._shadowLength = Gtk.SpinButton.new_with_range(0, 64, 1);
        this._shadowLength.set_value(this._settings.get_int(Keys.SHADOW_LEN));
        this._shadowLength.connect('value-changed', Lang.bind(this, this._onShadowLengthChanged));
        this._grid.attach(this._shadowLength, 0, 23, 1, 1);

        // Panel Shadow Blur
        this._shadowBlur = Gtk.SpinButton.new_with_range(0, 64, 1);
        this._shadowBlur.set_value(this._settings.get_int(Keys.SHADOW_BLUR));
        this._shadowBlur.connect('value-changed', Lang.bind(this, this._onShadowBlurChanged));
        this._grid.attach(this._shadowBlur, 0, 24, 1, 1);

        // Panel Shadow Spread
        this._shadowSpread = Gtk.SpinButton.new_with_range(0, 64, 1);
        this._shadowSpread.set_value(this._settings.get_int(Keys.SHADOW_SPRED));
        this._shadowSpread.connect('value-changed', Lang.bind(this, this._onShadowSpreadChanged));
        this._grid.attach(this._shadowSpread, 0, 25, 1, 1);

        // Window Maximized Effect
        this._rbNone = new Gtk.RadioButton({label:_("Panel - No Effect")});
        this._rbOpaque = new Gtk.RadioButton({group:this._rbNone, label:_("Opaque Background Color")});
        this._rbBlack = new Gtk.RadioButton({group:this._rbNone, label:_("Black Opaque Background")});
        let rbGroup = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:4, margin_top:2, margin_bottom:2, margin_right:4});
        rbGroup.add(this._rbNone);
        rbGroup.add(this._rbOpaque);
        rbGroup.add(this._rbBlack);
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
        this._grid.attach(rbGroup, 2, 26, 5, 1);

        // Conflict Detection
        this._conflictDetection = new Gtk.Switch({active: this._settings.get_boolean(Keys.CON_DET)});
        this._conflictDetection.connect('notify::active', Lang.bind(this, this._setConflictDetection));
        let conflictDetectionBox = new Gtk.Box;
        conflictDetectionBox.pack_start(this._conflictDetection, false, false, 0);
        this._grid.attach(conflictDetectionBox, 0, 35, 1, 1);

        // Position Right
        this._positionRight = new Gtk.Switch({active: this._settings.get_boolean(Keys.BTN_POSITION)});
        this._positionRight.connect('notify::active', Lang.bind(this, this._setPositionRight));
        let positionRightBox = new Gtk.Box;
        positionRightBox.pack_start(this._positionRight, false, false, 0);
        this._grid.attach(positionRightBox, 0, 30, 1, 1);

        // Reset
        let defaultsBtn = new Gtk.Button({ label: _(RESET) } );
        defaultsBtn.connect('clicked', Lang.bind(this, this._resetSettings));
        let defaultsBtnBox = new Gtk.Box;
        defaultsBtnBox.pack_start(defaultsBtn, false, false, 0);
        this._grid.attach(defaultsBtnBox, 0, 37, 1, 1);

        // Readme
        let readmeBtn = new Gtk.Button({ label: _(README) } );
        readmeBtn.connect('clicked', function() { Readme.displayWindow('readme')});
        let readmeBtnBox = new Gtk.Box;
        readmeBtnBox.pack_start(readmeBtn, false, false, 0);       
        this._grid.attach(readmeBtnBox, 0, 39, 1, 1);

        // Web Page
        let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(DEFAULT_ICO, 32, 32, null);
        let imagex = new Gtk.Image()
        imagex.set_from_pixbuf(pixbuf);
        let linkBtn = new Gtk.LinkButton({ uri: "https://nls1729.github.io/activities_config.html",
                                           label: _("Website"),
                                           image: imagex});
        this._grid.attach(linkBtn, 2, 41, 1, 3);

        // Set Defaults on First Enable
        if(this._settings.get_boolean(Keys.FIRST_ENABLE)) {
            this._settings.set_boolean(Keys.FIRST_ENABLE, false);
            this._resetSettings();
        }

        let schemaSource = GioSSS.get_default();
        let schemaObj = schemaSource.lookup(THEME_SCHEMA, true);
        if (schemaObj)
            this._themeSettings = new Gio.Settings({ settings_schema: schemaObj });
        this.savedThemeId = this._settings.get_string(Keys.SHELL_THEME_ID);
        this._setThemeName();
        this._settings.connect('changed::'+Keys.SHELL_THEME_ID, Lang.bind(this, this._setThemeName));
    },

    _setThemeName: function() {
        let themeName;
        if (this._themeSettings === undefined) {
            themeName = '';
        } else {
            themeName = this._themeSettings.get_string('name');
        }
        let themeId = this._settings.get_string(Keys.SHELL_THEME_ID);
        let mode = themeId.split('<|>')[1];
        let shellThemeName = ' ';

        if (mode == 'classic') {
             shellThemeName = ' Gnome Classic ';
        }
        if (themeName == '' && mode == 'user') {
            this._overrideUserOrClassicTheme.set_active(false);
            this._overrideUserOrClassicTheme.set_sensitive(false);
        } else if (themeName != '') {
            shellThemeName = shellThemeName +  ' [ ' + themeName + ' ] ';
        }
        if (this.savedThemeId == themeId) {
            if (shellThemeName != ' ') {
                this._overrideUserOrClassicTheme.set_sensitive(true);
            }
        } else {
            if (shellThemeName != ' ') {
                this._overrideUserOrClassicTheme.set_sensitive(true);
            } else {
                this._overrideUserOrClassicTheme.set_sensitive(false);
            }
            this._overrideUserOrClassicTheme.set_active(false);
            this.savedThemeId = themeId;
        }
        this._shellThemeName.set_text(shellThemeName);
    },

    _setSetBtnSensitive: function(object, value) {
        this._applyBtn.set_sensitive(true);
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

    _setShadowColor: function() {
        let rgba = new Gdk.RGBA();
        let hexString = this._settings.get_string(Keys.SHADOW_COLOR);
        rgba.parse(hexString);
        this._shadowColor.set_rgba(rgba);
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
    },

    _onPanelShadowColorChanged: function(object) {
        let rgba = this._shadowColor.get_rgba();
        let css = rgba.to_string();
        let hexString = this._cssHexString(css);
        this._settings.set_string(Keys.SHADOW_COLOR, hexString);
    },

    _setPositionRight: function(object) {
        this._settings.set_boolean(Keys.BTN_POSITION, object.active);
        if(object.active) {
            this._conflictDetection.set_active(false);
            this._conflictDetection.set_sensitive(false);
        } else {
            this._conflictDetection.set_sensitive(true);
        }
    },

    _setConflictDetection: function(object) {
        this._settings.set_boolean(Keys.CON_DET, object.active);
    },

    _setActivitiesText: function() {
        let text = this._entry.get_text();
        if(text != '') {
            this._settings.set_string(Keys.NEW_TXT, text);
            this._entry.set_text(text);
            this._applyBtn.set_sensitive(false);
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

    _onShadowTransparencyChanged: function() {
        this._settings.set_int(Keys.SHADOW_TRANS, this._shadowTransparency.get_value());
    },

    _onShadowLengthChanged: function() {
        this._settings.set_int(Keys.SHADOW_LEN, this._shadowLength.get_value());
    },

    _onShadowBlurChanged: function() {
        this._settings.set_int(Keys.SHADOW_BLUR, this._shadowBlur.get_value());
    },

    _onShadowSpreadChanged: function() {
        this._settings.set_int(Keys.SHADOW_SPRED, this._shadowSpread.get_value());
    },

    _setHideCorners: function(object) {
        this._settings.set_boolean(Keys.HIDE_RC, object.active);
    },

    _setHideAppMenuButtonIcon: function(object) {
        this._settings.set_boolean(Keys.HIDE_APPMBI, object.active);
    },

    _setOverrideUserOrClassicTheme: function(object) {
        this._settings.set_boolean(Keys.OVERR_THEME, object.active);
    },

    _setShowOverview: function(object) {
        this._settings.set_boolean(Keys.SHOW_OVERVIEW, object.active);
    },

    _resetSettings: function() {
        this._hpadText.set_value(8);
        this._hpadIcon.set_value(8);
        this._noActivities.set_active(false);
        let default_txt = this._settings.get_string(Keys.ORI_TXT);
        this._entry.set_text(default_txt);
        this._applyBtn.set_sensitive(false);
        this._settings.set_string(Keys.NEW_TXT, default_txt);
        this._noText.set_active(false);
        this._settings.set_string(Keys.NEW_ICO, DEFAULT_ICO);
        this._iconPath = DEFAULT_ICO;
        this._loadIcon(this._iconPath);
        this._noIcon.set_active(false);
        this._hotCornerDelay.set_value(this._hotCornerDelayDefault);
        this._noHotCorner.set_active(false);
        this._overrideUserOrClassicTheme.set_active(false);
        this._setThemeName();
        this._settings.set_string(Keys.COLOURS,'#000000');
        this._showOverview.set_active(false);
        this._setPanelColor();
        this._panelTransparency.set_value(0);
        this._settings.set_string(Keys.SHADOW_COLOR,'#000000');
        this._setShadowColor();
        this._shadowTransparency.set_value(0);
        this._shadowLength.set_value(0);
        this._shadowBlur.set_value(0);
        this._shadowSpread.set_value(0);
        this._hideCorners.set_active(false);
        this._conflictDetection.set_active(false);
        this._positionRight.set_active(false);
        this._rbNone.clicked();
        this._hideAppMenuButtonIcon.set_active(false);
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
        scollingWindow.width_request = 780;
        scollingWindow.height_request = 620;
        scollingWindow.show_all();
        return scollingWindow;
    }
};

function buildPrefsWidget() {
    let widget = new ActivitiesConfiguratorSettingsWidget();
    return widget._completePrefsWidget();
}
