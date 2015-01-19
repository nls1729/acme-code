
/*
  Copyright (C) 2015 Norman L. Smith

  This file is part of the Start Here Extension SHE@nls1729.

  The extension is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public Licenseas published by the Free
  Software Foundation; either version 2 of the License, or (at your option)
  any later version.  The extension is distributed in the hope it will be
  useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
  Public License for more details.  You should have received a copy of the
  GNU General Public License along with the extension.

  If not, see <http://www.gnu.org/licenses/>.

  This extension is a derived work of the Gnome Shell.
*/

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const APPLY_SETTINGS = 'apply-settings'
const DEFAULT_ICON = Me.path + '/imsges/start-here-symbolic.svg';
const DOMAIN = Me.metadata['gettext-domain'];
const _ = imports.gettext.domain(DOMAIN).gettext;
const EXTENSIONS = GLib.get_user_data_dir() + '/gnome-shell/extensions/';
const MIME = ['image/png', 'image/jpeg', 'image/gif'];
const PATTERN = ['*.ico', '*.png', '*.jpg', '*.gif', '*.tif"', '*.xpm', '*svg', '*icns'];
const PUBLIC_KEY = Me.path + '/etc/verify.gpg';
const README_URL = 'file://' + Me.path + '/etc/README.html';
const UI_FILE_PATH = Me.path + '/etc/prefs.ui';
const PANEL_ICON_PATH = 0;
const PANEL_ICON_LEFT = 1;
const PANEL_ICON_CENTER = 2;
const MENU_BACKGROUND_RGBA = 3;
const DESCRIPTION_TEXT_SIZE = 4;
const TOP_ROW_ICONS_SIZE = 5;
const MENU_ICONS_SIZE = 6;
const MENU_TEXT_SIZE = 7;
const MENU_BUTTON_TEXT_WHITE = 8;
const VERIFY_WITH_USER_KEYRING = 9;
const SHOW_HELP_MESSAGES = 10;

let SettingsStore = [
    { Key: 'panel-icon-path', Type: 'string', Default: DEFAULT_ICON, Value: DEFAULT_ICON, Update: false},
    { Key: 'panel-icon-left', Type: 'boolean', Default: true, Value: true, Update: false},
    { Key: 'panel-icon-center', Type: 'boolean', Default: true, Value: true, Update: false},
    { Key: 'menu-background-rgba', Type: 'string', Default: 'rgba(46,52,54,0.75)', Value: 'rgba(46,52,54,0.75)', Update: false},
    { Key: 'description-text-size', Type: 'string', Default: 'font-size:0.8em', Value: 'font-size:0.8em', Update: false},
    { Key: 'top-row-icons-size', Type: 'string', Default: 'icon-size:1.0em', Value: 'icon-size:1.0em', Update: false},
    { Key: 'menu-icons-size', Type: 'string', Default: 'icon-size:2.4em', Value: 'icon-size:2.4em', Update: false},
    { Key: 'menu-text-size', Type: 'string', Default: 'font-size:0.8em', Value: 'font-size:0.8em', Update: false},
    { Key: 'menu-button-text-white', Type: 'boolean', Default: false, Value: false, Update: false},
    { Key: 'verify-with-user-keyring', Type: 'boolean', Default: false, Value: false, Update: false},
    { Key: 'show-help-messages', Type: 'boolean', Default: true, Value: true, Update: false}
];/*
  Copyright (C) 2015 Norman L. Smith

  This file is part of the Start Here SHE@nls1729.

  The extension is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public Licenseas published by the Free
  Software Foundation; either version 2 of the License, or (at your option)
  any later version.  The extension is distributed in the hope it will be
  useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
  Public License for more details.  You should have received a copy of the
  GNU General Public License along with the extension.

  If not, see <http://www.gnu.org/licenses/>.

  This extension is a derived work of the Gnome Shell.
*/

function init() {
    imports.gettext.bindtextdomain(DOMAIN, Me.path + "/locale");
}

const PrefsWidget = new GObject.Class({
    Name:'StartHere.Prefs.Widget',
    GTypeName:'StartHerePrefsWidget',
    Extends:Gtk.Box,

    _init: function(params) {
	this.parent(params);
        this._builder = new Gtk.Builder();
        if (this._builder.add_from_file(UI_FILE_PATH) == 0) {
            let msg = 'Failed loading ui file';
            throw new Error(msg);
        }
        let box = this._builder.get_object('box');
        this.pack_start(box, expand = true, fill = true, padding = 20);
        this._bar = this._builder.get_object('bar');
        this._mid = this._context_id = this._bar.get_context_id('messages');
        this._bar.push(this._context_id, _("Waiting for response"));
        this._settings = this._getSettings();
        this._setUserInterfaceValues();
        this._connectUserInterfaceSignals();
        //Readme
        let readmeLinkbutton = this._builder.get_object('readmeLinkbutton');
        readmeLinkbutton.set_label(_("README"));
        readmeLinkbutton.set_uri(README_URL);
        // Verify
        let verifyBtn = this._builder.get_object('verifyBtn');
        verifyBtn.connect('clicked', Lang.bind(this, function(b, e) {
            let msg;
            if (this._verifyExtension())
                msg = _("Extension verification OK.");
            else
                msg = _("Extension verification FAILED.");
            this._notify(msg, false);
        }));
        //Defaults
        let defaultsBtn = this._builder.get_object('defaultsBtn');
        defaultsBtn.connect('clicked', Lang.bind(this, function(b) {
            this._applyRequired = false;
            for (let i in SettingsStore) {
                if (SettingsStore[i].Value != SettingsStore[i].Default) {
                    SettingsStore[i].Value = SettingsStore[i].Default;
                    SettingsStore[i].Update = true;
                    this._applyRequired = true;
                }
            }
            if (this._applyRequired) {
                this._notify(_("Defaults settings chosen.  Apply to effect changes."), true);
            } else {
                this._notify(_("Defaults settings chosen.  No settings were changed."), false);
            }

        }));
        //Apply
        this._applyBtn = this._builder.get_object('applyBtn');
        this._applyBtn.connect('clicked', Lang.bind(this, function(b) {
            this._notify(_("Settings updated"), false);
            for (let i in SettingsStore) {
                if (SettingsStore[i].Update == true) {
                    this._setSetting(i);
                    SettingsStore[i].Update = false;
                }
            }
            let setting = this._settings.get_boolean('apply-settings');
            this._settings.set_boolean('apply-settings', !setting);
            if (this._applyRequired === true) {
                this._setUserInterfaceValues();
                this._applyRequired = false;
                this._notify(_("Defaults settings applied."), false);
            }
        }));
    },

    _setUserInterfaceValues: function() {
        // Select Panel Icon
        let iconBtn = this._builder.get_object('iconBtn');
        this._getSetting(PANEL_ICON_PATH);
        if (SettingsStore[PANEL_ICON_PATH].Value == 'default')
            SettingsStore[PANEL_ICON_PATH].Value = DEFAULT_ICON;
        this._loadIcon(iconBtn, SettingsStore[PANEL_ICON_PATH].Value);
        // Panel Icon Position
        let rbRight = this._builder.get_object('rbRight');
        let rbLeft = this._builder.get_object('rbLeft');
        rbRight.set_active(!SettingsStore[PANEL_ICON_LEFT].Value);
        rbLeft.set_active(SettingsStore[PANEL_ICON_LEFT].Value);
        let cbCenter = this._builder.get_object('cbCenter');
        this._getSetting(PANEL_ICON_CENTER);
        cbCenter.set_active(SettingsStore[PANEL_ICON_CENTER].Value);
        // Background Color and Transparency
        this._getSetting(MENU_BACKGROUND_RGBA);
        let i = SettingsStore[MENU_BACKGROUND_RGBA].Value.lastIndexOf(',');
        let value = SettingsStore[MENU_BACKGROUND_RGBA].Value;
        value = SettingsStore[MENU_BACKGROUND_RGBA].Value.substr(0,i);
        value = value.replace('rgba','rgb') + ')';
        let rgba = new Gdk.RGBA();
        rgba.parse(value);
        let transparency = 100 - (100 * (parseFloat(SettingsStore[MENU_BACKGROUND_RGBA].Value.substr(++i))));
        let menuColor = this._builder.get_object('menuColor');
        menuColor.set_rgba(rgba);
        let transparencyScale = this._builder.get_object('transparencyScale');
        transparencyScale.set_value(transparency);
        // Scale Text and Icons
        let descriptionTextScale = this._builder.get_object('descriptionTextScale');
        this._getSetting(DESCRIPTION_TEXT_SIZE);
        descriptionTextScale.set_value(parseFloat(SettingsStore[DESCRIPTION_TEXT_SIZE].Value.split(':')[1]));
        let topRowIconsScale = this._builder.get_object('topRowIconsScale');
        this._getSetting(TOP_ROW_ICONS_SIZE);
        topRowIconsScale.set_value(parseFloat(SettingsStore[TOP_ROW_ICONS_SIZE].Value.split(':')[1]));
        let menuIconsScale = this._builder.get_object('menuIconsScale');
        this._getSetting(MENU_ICONS_SIZE);
        menuIconsScale.set_value(parseFloat(SettingsStore[MENU_ICONS_SIZE].Value.split(':')[1]));
        let menuTextScale = this._builder.get_object('menuTextScale');
        this._getSetting(MENU_TEXT_SIZE);
        menuTextScale.set_value(parseFloat(SettingsStore[MENU_TEXT_SIZE].Value.split(':')[1]));
        // Directory and Link Button Text
        let rbGreen = this._builder.get_object('rbGreen');
        let rbWhite = this._builder.get_object('rbWhite');
        this._getSetting(MENU_BUTTON_TEXT_WHITE);
        rbWhite.set_active(SettingsStore[MENU_BUTTON_TEXT_WHITE].Value);
        rbGreen.set_active(!SettingsStore[MENU_BUTTON_TEXT_WHITE].Value);
        // Verify with User's Keyring
        let cbUserKey = this._builder.get_object('cbUserKey');
        this._getSetting(VERIFY_WITH_USER_KEYRING);
        cbUserKey.set_active(SettingsStore[VERIFY_WITH_USER_KEYRING].Value);
        // Show Help Messages
        let cbHelp = this._builder.get_object('cbHelp');
        this._getSetting(SHOW_HELP_MESSAGES);
        cbHelp.set_active(SettingsStore[SHOW_HELP_MESSAGES].Value);
    },

    _connectUserInterfaceSignals: function() {
        // Select Panel Icon
        let iconBtn = this._builder.get_object('iconBtn');
        iconBtn.connect('clicked', Lang.bind(this, function(btn) {
            let fc = new Gtk.FileChooserDialog({ title: _("Choose an icon"), action: Gtk.FileChooserAction.OPEN });
            fc.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
            fc.add_button(Gtk.STOCK_OPEN, Gtk.ResponseType.ACCEPT);
            fc.set_filename(SettingsStore[PANEL_ICON_PATH].Value);
            let ff = new Gtk.FileFilter();
            fc.set_filter(ff);
            let i;
            for (i in MIME)
                ff.add_mime_type(MIME[i]);
            for (i in PATTERN)
                ff.add_pattern(PATTERN[i]);
            let preview = new Gtk.Image({ file: SettingsStore[PANEL_ICON_PATH].Value });
            fc.set_preview_widget(preview);
            fc.connect('update-preview', Lang.bind(this, function() {;
                preview.hide();
                preview.file = fc.get_filename();
                preview.show();
            }));
	    if (fc.run() == Gtk.ResponseType.ACCEPT) {
                this._notify(_("Icon change accepted"), true);
                SettingsStore[PANEL_ICON_PATH].Value = fc.get_filename();
                SettingsStore[PANEL_ICON_PATH].Update = true;
                this._loadIcon(btn, SettingsStore[PANEL_ICON_PATH].Value);
            }
            fc.destroy();
        }));
        // Panel Icon Position
        let rbLeft = this._builder.get_object('rbLeft');
        rbLeft.connect('toggled', Lang.bind(this, function(rb) {
            SettingsStore[PANEL_ICON_LEFT].Value = rb.get_active();
            SettingsStore[PANEL_ICON_LEFT].Update = true;
            if (SettingsStore[PANEL_ICON_LEFT].Value == true)
                this._notify(_("Panel button position changed to left."), true);
            else
                this._notify(_("Panel button position changed to right."), true);
        }));
        let cbCenter = this._builder.get_object('cbCenter');
        cbCenter.connect('toggled', Lang.bind(this, function(cb) {
            SettingsStore[PANEL_ICON_CENTER].Value = cb.get_active();
            SettingsStore[PANEL_ICON_CENTER].Update = true;
            if (SettingsStore[PANEL_ICON_CENTER].Value == true)
                this._notify(_("Panel button position changed to center."), true);
            else
                this._notify(_("Panel button position changed from center."), true);
        }));
        // Background Color and Transparency
        let menuColor = this._builder.get_object('menuColor');
        menuColor.connect('notify::color', Lang.bind(this, function(b) {
            let rgba = b.get_rgba().to_string();
            let rgb = rgba.substr(4, rgba.length - 5);
            this._notify(_("Menu background color changed."), true);
            this._setMenuBackgroundRGBA(rgb, null);
        }));
        let transparencyScale = this._builder.get_object('transparencyScale');
        transparencyScale.connect('value_changed', Lang.bind(this, function(s) {
            let alpha = "%1.2f".format((100 - s.get_value()) / 100);
            this._notify(_("Menu background transparency changed."), true);
            this._setMenuBackgroundRGBA(null, alpha);
        }));
        // Scale Text and Icons
        let descriptionTextScale = this._builder.get_object('descriptionTextScale');
        descriptionTextScale.connect('value-changed', Lang.bind(this, function(s) {
            SettingsStore[DESCRIPTION_TEXT_SIZE].Value = 'font-size:%2.1fem'.format(s.get_value());
            SettingsStore[DESCRIPTION_TEXT_SIZE].Update = true;
            this._notify(_("Description text scaling changed."), true);
        }));
        let topRowIconsScale = this._builder.get_object('topRowIconsScale');
        topRowIconsScale.connect('value-changed', Lang.bind(this, function(s) {
            SettingsStore[TOP_ROW_ICONS_SIZE].Value = 'icon-size:%2.1fem'.format(s.get_value());
            SettingsStore[TOP_ROW_ICONS_SIZE].Update = true;
            this._notify(_("Top row icon scaling changed."), true);
        }));
        let menuIconsScale = this._builder.get_object('menuIconsScale');
        menuIconsScale.connect('value-changed', Lang.bind(this, function(s) {
            SettingsStore[MENU_ICONS_SIZE].Value = 'icon-size:%2.1fem'.format(s.get_value());
            SettingsStore[MENU_ICONS_SIZE].Update = true;
            this._notify(_("Menu icon scaling changed."), true);
        }));
        let menuTextScale = this._builder.get_object('menuTextScale');
        menuTextScale.connect('value-changed', Lang.bind(this, function(s) {
            SettingsStore[MENU_TEXT_SIZE].Value = 'font-size:%2.1fem'.format(s.get_value());
            SettingsStore[MENU_TEXT_SIZE].Update = true;
            this._notify(_("Menu text scaling changed."), true);
        }));
        // Directory and Link Button Text
        let rbWhite = this._builder.get_object('rbWhite');
        rbWhite.connect('toggled', Lang.bind(this, function(rb) {
            SettingsStore[MENU_BUTTON_TEXT_WHITE].Value = rb.get_active();
            SettingsStore[MENU_BUTTON_TEXT_WHITE].Update = true;
            if (SettingsStore[MENU_BUTTON_TEXT_WHITE].Value)
                this._notify(_("Menu and Link button text color changed to white."), true);
            else
                this._notify(_("Menu and Link button text color changed to green."), true);
        }));
        // Verify with User's Keyring
        let cbUserKey = this._builder.get_object('cbUserKey');
        cbUserKey.connect('toggled', Lang.bind(this, function(cb) {
            SettingsStore[VERIFY_WITH_USER_KEYRING].Value = cb.get_active();
            SettingsStore[VERIFY_WITH_USER_KEYRING].Update = true;
            this._notify(_("Verification keyring changed."), true);
        }));
        // Show Help Messages
        let cbHelp = this._builder.get_object('cbHelp');
        cbHelp.connect('toggled', Lang.bind(this, function(cb) {
            SettingsStore[SHOW_HELP_MESSAGES].Value = cb.get_active();
            SettingsStore[SHOW_HELP_MESSAGES].Update = true;
            this._notify(_("Show help messages changed."), true);
        }));
    },

    _loadIcon: function(iconBtn, pathOrName) {
        let icon;
        try {
            if (pathOrName.indexOf('/') > -1 && pathOrName.indexOf('.') > 0)
                icon = Gio.icon_new_for_string(pathOrName);
            else
                icon = new Gio.ThemedIcon({name: pathOrName});
        } catch (e) {
            icon = new Gio.ThemedIcon({name: DEFAULT_ICON});
            this._bar.push(this._context_id, _("Icon is missing default installed."));
        }
        let image = iconBtn.get_image();
        image.set_from_gicon(icon, 5);
        iconBtn.set_image(image);
    },

    _setMenuBackgroundRGBA: function(rgb, alpha) {
        let i = SettingsStore[MENU_BACKGROUND_RGBA].Value.lastIndexOf(',');
        if (rgb !== null) {
            let a = SettingsStore[MENU_BACKGROUND_RGBA].Value.substr(i);
            SettingsStore[MENU_BACKGROUND_RGBA].Value = 'rgba(' + rgb + a;
            SettingsStore[MENU_BACKGROUND_RGBA].Update = true;
        }
        if (alpha !== null) {
            let a = '%1.2f'.format(alpha) + ')';
            SettingsStore[MENU_BACKGROUND_RGBA].Value = SettingsStore[MENU_BACKGROUND_RGBA].Value.substr(0, ++i) + a;
            SettingsStore[MENU_BACKGROUND_RGBA].Update = true;
        }
    },

    _notify: function(message, sensitive) {
        if (sensitive !== undefined)
            this._applyBtn.sensitive = sensitive;
        this._bar.remove(this._context_id, this._mid);
        this.mid = this._bar.push(this._context_id, message);
    },

    _getSettings: function() {
        const GioSSS = Gio.SettingsSchemaSource;
        let schema = Me.metadata['settings-schema'];
        let schemaDir = Me.dir.get_child('schemas');
        let schemaSource = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
        let schemaObj = schemaSource.lookup(schema, true);
        return new Gio.Settings({settings_schema:schemaObj});
    },

    _getSetting: function(settingIndex) {
        let setting = SettingsStore[settingIndex];
        switch (setting.Type) {
            case 'boolean':
                SettingsStore[settingIndex].Value = this._settings.get_boolean(setting.Key);
                break;
            case 'string':
                SettingsStore[settingIndex].Value = this._settings.get_string(setting.Key);
                break;
            default:
                throw new Error('Get setting failed.');
        }
    },

    _setSetting: function(settingIndex) {
        let setting = SettingsStore[settingIndex];
        switch (setting.Type) {
            case 'boolean':
                this._settings.set_boolean(setting.Key, setting.Value);
                break;
            case 'string':
                this._settings.set_string(setting.Key, setting.Value);
                break;
            default:
                throw new Error('Set setting failed.');
        }
    },

    _verifyExtension: function() {
        log(_("Verify Extension") + ' : ' + Me.uuid);
        this._extensionDir = EXTENSIONS + Me.uuid;
        this._resultsArray = [];
        this._ok = true;
        this._width = 840;
        this._height = 800;
        this._useUserKeyring = this._settings.get_boolean('verify-with-user-keyring');
        if (!this._checkDependencies('gpg')) {
             this._resultsArray.push(_("ERROR: gpg required") + '\n');
             this._ok = false;
        }
        if (!this._checkDependencies('sha256sum')) {
             this._resultsArray.push(_("ERROR: sha256sum required") + '\n');
             this._ok = false;
        }
        if (this._ok) {
            if (!this._verifySignature()) {
                this._ok = false;
                this._resultsArray.push('\n*** ' + _("Signature verification FAILED") + ' ***\n');
            } else {
                this._resultsArray.push('\n' + _("Signature verification OK") + '\n');
            }
            this._resultsArray.push('..................\n\n');
            if (!this._checkChecksum()) {
                this._ok = false;
                this._resultsArray.push('\n*** ' + _("Checksum verification FAILED") + ' ***\n');
            } else {
                this._resultsArray.push('\n' + _("Checksum verification OK") + '\n');
            }
            this._resultsArray.push('..................\n');
        }
        let textStr = '\n' + _("Extension Verification Results") + '  :  ' + Me.uuid + '\n\n';
        if (this._ok) {
            textStr = textStr + _("Extension verification OK.") + '\n';
            log('Verify OK : ' + Me.uuid);
        } else {
            textStr = textStr + '*** ' + _("Extension verification FAILED") + ' ***\n';
            log('Verify FAIL : ' + Me.uuid);
        }
        for (let i in this._resultsArray) {
            let text = this._resultsArray[i];
            print (text);
            textStr = textStr + text;
        }
        this._displayResults(textStr);
        return this._ok;
    },

    _displayResults: function(textStr) {
        let window = new Gtk.Window({'type': Gtk.WindowType.TOPLEVEL, 'title': _("Extension Verify")});
        let sw = new Gtk.ScrolledWindow({'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                         'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                         'hexpand': true, 'vexpand': true, 'margin': 20 });
        let tv = new Gtk.TextView({'wrap-mode': Gtk.WrapMode.WORD, 'editable' : false});
        window.set_size_request(this._width, this._height);
        sw.add(tv);
        window.add(sw);
        tv.get_buffer().set_text(textStr, -1);
        let parent = window.get_parent_window();
        window.set_transient_for(parent);
        window.set_modal(true);
        window.show_all();
    },

    _checkDependencies: function(command) {
        let flags = GLib.SpawnFlags.SEARCH_PATH;
        try {
            let [res, out] = GLib.spawn_sync(null, [command, '--version'], null, flags, null);
        } catch (e) {
            return false;
        }
        return true;
    },

    _verifySignature: function() {
        GLib.chdir(this._extensionDir);
        let flags = GLib.SpawnFlags.SEARCH_PATH;
        let signature = 'CHECKSUM.sig';
        let command = ['gpg', '--verify', signature];
        if (!this._useUserKeyring)
            command = ['gpg', '--verify', '--no-default-keyring', '--keyring', PUBLIC_KEY, signature];
        let commandLine = command.toString();
        commandLine = commandLine.replace(/,/g , " ");
        this._resultsArray.push('\n' + commandLine + '\n');
        try {
            let [res, out, err, status] = GLib.spawn_sync(null, command, null, flags, null);
            this._resultsArray.push(out);
            this._resultsArray.push('\n');
            this._resultsArray.push(err);

            if(!res || status != 0) {
                log('Failed signature verification.');
                return false;
            } else {
                return true;
            }
        } catch (e) {
            print(e.message);
            this._resultsArray.push(e.message);
            return false;
        }
    },

    _checkChecksum: function() {
        this._resultsArray.push(_("sha256sum --check --strict ") + 'CHECKSUM\n\n');
        GLib.chdir(this._extensionDir);
        let flags = GLib.SpawnFlags.SEARCH_PATH;
        let command = ['sha256sum', '--check', '--strict', 'CHECKSUM'];
        try {
            let [res, out, err, status] = GLib.spawn_sync(null, command, null, flags, null);
            if (out.toString().indexOf("FAIL") != -1) {
                this._resultsArray.push(out);
                this._resultsArray.push('\n');
            } else {
                this._resultsArray.push('All files in CHECKSUM check OK.\n');
            }
            this._resultsArray.push(err);
            if(!res || status != 0) {
                log('Failed checksum verification.');
                return false;
            } else {
                return true;
            }
        } catch (e) {
            this._resultsArray.push(e.message);
            return false;
        }
    }
});

function buildPrefsWidget() {
    let widget = new PrefsWidget();
    widget.show_all();
    return widget;
}
