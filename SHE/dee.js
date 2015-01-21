#!/usr/bin/env gjs-console

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

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const ByteArray = imports.byteArray;
const Gettext = imports.gettext;
const Lang = imports.lang;
const APPLICATION_IN_TERMINAL = [ false, true, false, false ];
const DEFAULT_ICON = 'system-run';
const DESKTOP_ENTRY_EDITOR = '    Desktop Entry Editor';
const DOMAIN = 'nls1729-extensions';
const _ = Gettext.domain(DOMAIN).gettext;
const EXTENDED_FORMAT_STR = 'X-NLS1729-SHE-Directory';
const LOCAL_APPS_PATH = GLib.get_user_data_dir() + '/applications';
const MIMES = ['image/png', 'image/jpeg', 'image/gif'];
const PATTERNS = ['*.ico', '*.png', '*.jpg', '*.gif', '*.tif"', '*.xpm', '*svg', '*icns'];
const SCHEMA_DIR = GLib.get_user_data_dir() + '/gnome-shell/extensions/SHE@nls1729/schemas';
const DIRECTORY_INDEX = GLib.get_user_data_dir() + '/start_here_launchers/Directory_Index_lldir';
const TYPES = ['Application', 'Application', 'Link', 'Directory'];

const DesktopEntryEditor = new Lang.Class ({
    Name:'DesktopEntryEditor',

    _init: function (appID) {
        GLib.set_prgname(DESKTOP_ENTRY_EDITOR);
        this._app = new Gtk.Application({
            application_id: appID,
            flags: Gio.ApplicationFlags.HANDLES_COMMAND_LINE
        });
        this._dirName = '';
        this._oneStartup = true;
        this._oneActivate = true;
        this._startupSigId = this._app.connect('startup', Lang.bind(this, this.startup));
        this._commandLineSigId = this._app.connect('command-line', Lang.bind(this, this.commandline));
        this._settings = this._getSettings('org.gnome.shell.extensions.SHE');
    },

    _getSettings: function(schema) {
        const GioSSS = Gio.SettingsSchemaSource;
        let schemaPath = SCHEMA_DIR;
        let schemaSource = GioSSS.new_from_directory(schemaPath, GioSSS.get_default(), false);
        let schemaObj = schemaSource.lookup(schema, true);
        if (!schemaObj)
            throw new Error('Schema ' + schema + ' could not be found.');
        return new Gio.Settings({ settings_schema: schemaObj });
    },

    startup: function() {
        if (this._oneStartup) {
            this._oneStartup = false;
            this._dbusActivateable = false;
        }
    },

    commandline: function(app, commandline) {
        let args = commandline.get_arguments();
        if (args.length >= 4) {
            if (args[0].indexOf('SHE@nls1729') == -1) {
                let msg = 'Could not find valid path : dee.js';
                this._showError(msg, null);
                throw new Error(msg);
            }
            this._iconFile = args[0] + '/etc/dee.png';
            this._uiFile = args[0] + '/etc/dee.ui';
            let locale_dir = args[0] + '/locale';
            Gettext.bindtextdomain(DOMAIN, locale_dir);
            Gettext.textdomain(DOMAIN);
            imports.searchPath.unshift(args[0]);
            this._postFixes =  new imports.langpostfixer.LangPostfixer()._langPostfixes;
            this._langPostFixed = null;
            this._addLang = false;
            for(let i in this._postFixes) {
                if (this._postFixes[i] != null) {
                    if (this._postFixes[i] != 'en_US') {
                        this._langPostFixed = '[' + this._postFixes[i] + ']';
                        this._addLang = true;
                    }
                    break;
                }
            }
            this._cmdLabel = [_("Command"), _("Command"), _("Location"), _("Directory")];
            this._createAction = [_("Create Launcher"), _("Create Launcher"), _("Create Link"), _("Create Directory")];
            this._editAction = [_("Launcher Properties"), _("Launcher Properties"), _("Link Properties"), _("Directory Properties")];
            let params = [args[1], args[2], args[3]];
            if (args.length == 5)
                params[3] = args[4];
            this.activate(params);
        } else {
            this._changeMode(args[0]);
            this._app.quit();
        }
    },

    activate: function(params) {
        if (this._oneActivate) {
            this._oneActivate = false;
            this._buildUI();
            this._activate(params);
        } else {
            this._dialogObj.present();
        }
    },

    _buildUI: function() {
	this._builder = new Gtk.Builder;
        this._builder.add_from_file(this._uiFile);
        this._dialogObj = this._builder.get_object('dialog');
        this._comboBoxObj = this._builder.get_object('comboBox');
        this._nameObj = this._builder.get_object('name');
        this._commandObj = this._builder.get_object('command');
        this._commentObj = this._builder.get_object('comment');
        this._iconObj = this._builder.get_object('icon');
        this._anyLinkRadioBtnObj = this._builder.get_object('anyLinkRadioBtn');
        this._folderLinkRadioBtnObj = this._builder.get_object('folderLinkRadioBtn');
        this._fileLinkRadioBtnObj = this._builder.get_object('fileLinkRadioBtn');
        this._browseObj = this._builder.get_object('browse');
        this._revertObj = this._builder.get_object('revert');
        this._applyObj = this._builder.get_object('apply');
        this._cancelObj = this._builder.get_object('cancel');
        this._okObj = this._builder.get_object('ok');
        this._commandLabelObj = this._builder.get_object('commandLabel');
        this._typeLabelObj = this._builder.get_object('typeLabel');
        this._actionLabelObj = this._builder.get_object('actionLabel');
        this._menuLabelObj = this._builder.get_object('menuLabel');
        this._appListStoreObj = this._builder.get_object('appListStore');
        this._iconImageObj = this._builder.get_object('iconImage');
        this._checkBtnObj = this._builder.get_object('checkbutton');
    },

    _activate: function(params) {
        if (this._loadDesktopFile(params) && this._completeUI() && this._setUserInterfaceContext()) {
            while(true) {
                let result = this._dialogObj.run();
                if (result == Gtk.ResponseType.OK ||
                  (result == Gtk.ResponseType.CLOSE && this._revertObj.sensitive)) {
                    if (this._errors())
                        continue;
                    let key = this._keys['Name'];
                    this._changesArray[key] = this._nameObj.text;
                    let keys = ['URL', EXTENDED_FORMAT_STR, 'Exec'];
                    if (this._isLink) {
                        this._changesArray[keys[0]] = this._commandObj.text;
                        keys[0] = null;
                    } else if (this._isDirectory) {
                        let path = this._nameObj.text;
                        if (this._createMode) {
                            path = path.replace(/\s+/,'_');
                            path = path + '_she_lldir';
                            this._changesArray[keys[1]] = path;
                        }
                        keys[1] = null;
                    } else {
                        this._changesArray[keys[2]] = this._commandObj.text;
                        keys[2] = null;
                    }
                    let i;
                    for(i in keys) {
                        if (keys[i] != null) {
                            if (this._changesArray[keys[i]] !== undefined)
                                delete this._changesArray[keys[i]];
                        }
                    }
                    key = this._keys['Comment'];
                    let comment = this._commentObj.text;
                    this._changesArray[key] = comment;
                    this._handleEditCompleted();
                }
                if (result < 0)
                    break;
            }
        }
    },

    _showError: function (message, parent) {
        this._messageDialog = new Gtk.MessageDialog ({
            transient_for: parent,
            modal: true,
            buttons: Gtk.ButtonsType.CLOSE,
            message_type: Gtk.MessageType.ERROR,
            title: "Error",
            text: message
        });
        this._messageDialog.run();
        this._messageDialog.destroy();
    },

    _errors: function() {
        if (this._nameObj.get_text().length == 0) {
            this._showError(_("The name of the launcher is not set"), this._dialogObj);
            return true;
        }
        if (!this._isDirectory && this._commandObj.text_length == 0) {
            this._showError(this._commandError, this._dialogObj);
            return true;
        }
        if (this._isDirectory && this._nameObj.get_text() == this._dirName) {
            this._showError(_("Name cannot be the same as current local launcher directory."), this._dialogObj);
            return true;
        }
        return false;
    },

    _loadDesktopFile: function(params) {
        if (params[3] == 'CREATE') {
            this._createMode = true;
            this._path = LOCAL_APPS_PATH;
        } else {
            this._createMode = false;
            this._path = params[3];
        }
        this._dirName = params[0];
        this._dirPath = params[1];
        this._seqNr = params[2];
        this._itemArray = {};
        try {
            if (!this._createMode) {
                this._desktopItemFile = Gio.File.new_for_path(this._path);
                let baseName = this._desktopItemFile.get_basename();
                let contents = this._desktopItemFile.load_contents(null);
                let dtlines = contents[1].toString();
                let lines = dtlines.split('\n');
                let key, value, line;
                let processItem = false;
                let i;
                for(i in lines) {
                    line = lines[i];
                    if (line == '')
                        continue;
                    if (!processItem) {
                        key = line;
                        value = '=';
                        this._itemArray[key] = value;
                        if (line.indexOf('[Desktop Entry]') == 0)
                            processItem = true;
                        continue;
                    }
                    if (line.indexOf('[') == 0) {
                            processItem = false;
                            key = line;
                            this._itemArray[key] = '=';
                            continue;
                    }
                    if (line.indexOf('DBusActivatable=true') == 0)
                        this._dbusActivateable = true;
                    let p = line.indexOf('=');
                    if (p > 0) {
                        key = line.substr(0, p);
                        value = line.substr(p + 1);
                    } else {
                        key = line;
                        value = '=';
                    }
                    this._itemArray[key] = value;
                }
            }
        } catch(e) {
            this._showError(e.message + ' :_loadDesktopFile', null);
            return false;
        }
        this._keys = { Name:'Name', Comment:'Comment', Icon:'Icon' };
        for(let key in this._keys) {
            for(let i in this._postFixes) {
                if (this._postFixes[i] == null)
                    continue;
                let langKey = key + '[' + this._postFixes[i] + ']';
                if (this._itemArray[langKey] !== undefined) {
                    this._keys[key] = langKey;
                    break;
                }
            }
        }
        return true;
    },

    _completeUI: function() {
        try {
            let buffer = this._nameObj.get_buffer();
            buffer.connect('inserted-text', Lang.bind(this, this._revertCheck));
            buffer.connect('deleted-text', Lang.bind(this, this._revertCheck));
            buffer = this._commandObj.get_buffer();
            buffer.connect('inserted-text', Lang.bind(this, this._revertCheck));
            buffer.connect('deleted-text', Lang.bind(this, this._revertCheck));
            buffer = this._commentObj.get_buffer();
            buffer.connect('inserted-text', Lang.bind(this, this._revertCheck));
            buffer.connect('deleted-text', Lang.bind(this, this._revertCheck));
            this._iconObj.connect('clicked', Lang.bind(this, this._iconClicked));
            this._comboBoxObj.connect('changed', Lang.bind(this, this._checkComboBoxState));
            this._anyLinkRadioBtnObj.connect('toggled', Lang.bind(this, this._radioBtnToggled));
            this._folderLinkRadioBtnObj.connect('toggled', Lang.bind(this, this._radioBtnToggled));
            this._fileLinkRadioBtnObj.connect('toggled', Lang.bind(this, this._radioBtnToggled));
            this._browseObj.connect('clicked', Lang.bind(this, this._browseClicked));
            this._revertObj.connect('clicked', Lang.bind(this, this._setUserInterfaceContext));
            this._checkBtnObj.connect('toggled',Lang.bind(this, this._checkBtnToggled));
        } catch(e) {
            log(e.stack);
            this._showError(e.message + ' :_completeUI', null);
            return false;
        }
        return true;
    },

    _setUserInterfaceContext: function() {
        let key;
        this._userInterfaceReady = false;
        this._changesArray = {};
        let parent = new Gtk.Window();
        this._dialogObj.set_transient_for(parent);
        this._dialogObj.set_keep_above(true);
        this._dialogObj.set_icon_from_file(this._iconFile);
        try {
            if (!this._dialogObj.visible)
                this._dialogObj.show();
            if (!this._createMode) {
                this._revertObj.visible = true;
                this._applyObj.visible = true;
                this._okObj.hide();
                key = this._keys['Name'];
                this._nameObj.set_text(this._itemArray[key]);
                key = this._keys['Icon'];
                this._loadIcon(this._itemArray[key]);
                if (this._itemArray['Type'] == 'Link') {
                    this._comboBoxObj.set_active(2);
                    this._commandObj.set_text(this._itemArray['URL']);
                    this._comboBoxObj.hide();
                    this._typeLabelObj.hide();
                    this._radioBtnToggled();
                } else if (this._itemArray['Type'] == 'Directory') {
                    this._comboBoxObj.set_active(3);
                    this._commandLabelObj.hide();
                    this._commandObj.hide();
                    this._comboBoxObj.hide();
                    this._typeLabelObj.hide();
                    this._browseObj.hide();
                    this._checkBtnObj.hide();
                } else {
                    this._comboBoxObj.model = this._appListStoreObj;
                    if (this._itemArray['Terminal'] == 'false')
                        this._comboBoxObj.set_active(0);
                    else
                        this._comboBoxObj.set_active(1);
                    this._commandObj.set_text(this._itemArray['Exec']);
                    if (this._dbusActivateable) {
                        this._comboBoxObj.sensitive = false;
                        this._commandObj.sensitive = false;
                        this._browseObj.hide();
                    }
                    if (this._itemArray['NoDisplay'] == 'true')
                        this._checkBtnObj.active = true;
                    else
                        this._checkBtnObj.active = false;
                }
                this._revertObj.sensitive = false;
                key = this._keys['Comment']
                if (this._itemArray[key] !== undefined)
                    this._commentObj.set_text(this._itemArray[key]);
                else
                    this._commentObj.set_text('');
            } else {
                this._revertObj.sensitive = true;
                this._revertObj.hide();
                this._applyObj.hide();
                this._cancelObj.visible = true;
                this._okObj.visible = true;
                this._actionLabelObj.label = _("Create Launcher");
                this._comboBoxObj.set_active(0);
                this._loadIcon(DEFAULT_ICON);
                this._changesArray['NoDisplay'] = 'true';
            }
            this._checkComboBoxState();
            this._radioBtnToggled();
            this._userInterfaceReady = true;
        } catch(e) {
            log(e.stack);
            this._showError(e.message + ' :_setUserInterfaceContext', null);
            return false;
        }
        return true;
    },

    _loadIcon: function(pathOrName) {
        if (pathOrName === undefined)
            pathOrName = DEFAULT_ICON;
        if (pathOrName.indexOf('.') > 0) {
            this._loadIconPath = pathOrName;
        } else {
            let icon = Gtk.IconTheme.get_default().lookup_icon(pathOrName, 48, 0);
            if (icon != null) {
                this._loadIconPath = icon.get_filename();
            } else {
                this._loadIconPath = DEFAULT_ICON;
                this._changesArray['Icon'] = DEFAULT_ICON;
                this._revertObj.sensitive = true;
            }
        }
        this._iconImageObj.name = null;
        this._iconImageObj.gicon = null;
        this._iconImageObj.file = this._loadIconPath;
    },

    _handleEditCompleted: function () {
        this._checkComboBoxState();
        if (!this._createMode) {
            for(let key in this._changesArray) {
                if (this._changesArray[key] != this._itemArray[key]) {
                    this._itemArray[key] = this._changesArray[key];
                }
            }
        } else {
            this._itemArray = {};
            let value = '=';
            this._itemArray['[Desktop Entry]'] = value;
            this._itemArray['Version=1.0'] = value;
            if (this._changesArray['Icon'] === undefined)
                this._changesArray['Icon'] = DEFAULT_ICON;
            if (this._addLang) {
                this._itemArray['Name' + this._langPostFixed] = this._changesArray['Name'];
                if (this._changesArray['Comment'] !== undefined)
                    this._itemArray['Comment' + this._langPostFixed] = this._changesArray['Comment'];
                if (this._changesArray['Icon'] !== undefined)
                    this._itemArray['Icon' + this._langPostFixed] = this._changesArray['Icon'];
            }
            for(let key in this._changesArray) {
                this._itemArray[key] = this._changesArray[key];
            }
        }
        this._cleanArray();
        this._writeDesktopFile(this._itemArray);
    },

    _cleanArray: function () {
        this._suffix = '.desktop';
        this._isApp = false;
        if (this._isLink) {
            if (this._itemArray['Exec'] !== undefined)
                delete this._itemArray['Exec'];
            if (this._itemArray[EXTENDED_FORMAT_STR] != undefined)
                delete this._itemArray[EXTENDED_FORMAT_STR];
        } else if (this._isDirectory) {
            if (this._itemArray['Exec'] !== undefined)
                delete this._itemArray['Exec'];
            if (this._itemArray['URL'] !== undefined)
                delete this._itemArray['URL'];
            this._suffix = '.directory';
        } else {
            if (this._itemArray['URL'] !== undefined)
                delete this._itemArray['URL'];
            if (this._itemArray[EXTENDED_FORMAT_STR] !== undefined)
                delete this._itemArray[EXTENDED_FORMAT_STR];
            this._isApp = true;
        }
        if (this._itemArray['Comment'] === '')
            delete this._itemArray['Comment'];
    },

    _writeDesktopFile: function(array) {
        try {
            if (!this._createMode && this._isApp) {
                this._desktopItemFileOld = this._desktopItemFile;
                let baseName = this._desktopItemFile.get_basename();
                let link = GLib.build_filenamev([this._dirPath, baseName]);
                this._linkFileOld = Gio.File.new_for_path(link);
                this._createMode = true;
            }

            if (this._createMode) {
                let dir = Gio.File.new_for_path(this._dirPath);
                if (!dir.query_exists(null))
                    dir.make_directory_with_parents(null);
                let index = Gio.File.new_for_path(DIRECTORY_INDEX);
                if (!index.query_exists(null))
                    index.make_directory_with_parents(null);
                let baseName = array['Name'].replace(/\s/g,'_') + '-' + this._seqNr + this._suffix;
                if (this._isApp) {
                    this._path = GLib.build_filenamev([LOCAL_APPS_PATH, baseName]);
                    this._link = GLib.build_filenamev([this._dirPath, baseName]);
                } else if (this._isDirectory) {
                    this._hardLink = GLib.build_filenamev([DIRECTORY_INDEX, baseName]);
                    this._path = GLib.build_filenamev([this._dirPath, baseName]);
                } else {
                    this._path = GLib.build_filenamev([this._dirPath, baseName]);
                }
                this._desktopItemFile = Gio.File.new_for_path(this._path);
            }

            let contents = '';
            for(let key in array) {
                let value = array[key];
                if (value == '=')
                    value = key;
                else
                    value = key + '=' + value;
                contents = contents + value + '\n';
            }
            let byteArray = ByteArray.fromString(contents);
            if (!this._desktopItemFile.replace_contents(byteArray, null, false, 0, null))
                throw new Error(_("Write failed"));
            if (this._createMode && this._isApp) {
                let linkFile = Gio.File.new_for_path(this._link);
                if(!linkFile.make_symbolic_link(this._path, null))
                    throw new Error(_("Failed to create symbolic link ") + this._path);
            }
            if (this._desktopItemFileOld !== undefined) {
                this._linkFileOld.delete(null);
                this._desktopItemFileOld.delete(null);
            }
            let cmdline = '/usr/bin/chmod 0700 ' + this._path;
            let [results, output] = GLib.spawn_command_line_sync(cmdline);
            if (!results == true)
                throw new Error(_("Failed to set execute permissions:") + this._path);
            if (this._createMode && this._hardLink !== undefined) {
                cmdline = '/usr/bin/ln ' + this._path + ' ' + this._hardLink;
                let [results, output] = GLib.spawn_command_line_sync(cmdline);
                if (!results == true)
                    throw new Error(_("Failed to create hard link:") + this._path);
            }
        } catch (e) {
            this._showError(e.message, null);
        }
        this._toggleReloadRequired();
    },

    _changeMode: function(path) {
        try {
            let cmdline = '/usr/bin/chmod 0700 ' + path;
            let [results, output] = GLib.spawn_command_line_sync(cmdline);
            if (!results == true)
                throw new Error(_("Failed to set execute permissions:" + path));
        } catch (e) {
            this._showError(e.message, null);
        }
        this._toggleReloadRequired();
    },

    _toggleReloadRequired: function() {
        let setting = this._settings.get_boolean('reload-required');
        this._settings.set_boolean('reload-required', !setting);
    },

    _revertCheck: function() {
        if (!this._revertObj.sensitive && !this._createMode && this._userInterfaceReady)
            this._revertObj.sensitive = true;
    },

    _checkComboBoxState: function() {
        this._isLink = false;
        this._isDirectory = false;
        let active = this._comboBoxObj.active;
        this._changesArray['Type'] = TYPES[active];
        this._changesArray['Terminal'] = APPLICATION_IN_TERMINAL[active];
        this._commandLabelObj.label = this._cmdLabel[active];
        if (this._createMode) {
            this._actionLabelObj.label = this._createAction[active];
            this._menuLabelObj.label = this._dirName;
        } else {
            this._actionLabelObj.label = this._editAction[active];
            this._menuLabelObj.label = this._dirName;
        }
        if (active < 2) {
            this._commandError = _("The command is not set");
        } else if (active == 2) {
            this._isLink = true;
            this._comboBoxObj.hide();
            this._typeLabelObj.hide();
            this._checkBtnObj.hide();
            this._commandError = _("The location is not set");
        } else if (active == 3) {
            if (!this._createMode)
                this._nameObj.sensitive = false;
            this._isDirectory = true;
            this._commandLabelObj.hide();
            this._commandObj.hide();
            this._comboBoxObj.hide();
            this._typeLabelObj.hide();
            this._browseObj.hide();
            this._checkBtnObj.hide();
        }
        let cmd = this._commandObj.get_text();
        if (this._isLink) {
            if (cmd != '')
                this._anyLinkRadioBtnObj.active = true;
            this._radioBtnToggled();
            this._anyLinkRadioBtnObj.show();
            this._fileLinkRadioBtnObj.show();
            this._folderLinkRadioBtnObj.show();
            if (cmd.length > 0) {
                let uri = cmd;
                if (uri.indexOf('file://') != 0) {
                    if (uri.indexOf('://') == -1)
                        uri = 'file://' + uri;
                }
                if (uri.indexOf('file://') == 0) {
                    let file = Gio.File.new_for_uri(uri);
                    if (file.query_file_type(0, null) == Gio.FileType.DIRECTORY)
                        this._folderLinkRadioBtnObj.active = true;
                    else if (file.query_file_type(0, null) == Gio.FileType.REGULAR)
                        this._fileLinkRadioBtnObj.active = true;
                }
                this._commandObj.set_text(uri);
            }
        }
        if (!this._createMode)
            this._revertCheck();
    },

    _iconClicked: function(button) {
        this._dialogObj.set_keep_above(false);
        let fc = new Gtk.FileChooserDialog({title: _("Choose an icon"),
            action: Gtk.FileChooserAction.OPEN});
        fc.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        fc.add_button(Gtk.STOCK_OPEN, Gtk.ResponseType.ACCEPT);
        fc.set_filename(this._loadIconPath);
        let ff = new Gtk.FileFilter();
        fc.set_filter(ff);
        for (let i in MIMES)
            ff.add_mime_type(MIMES[i]);
        for (let i in PATTERNS)
            ff.add_pattern(PATTERNS[i]);
        let preview = new Gtk.Image({ file:this._loadIconPath });
        fc.set_preview_widget(preview);
        fc.connect('update-preview', Lang.bind(this, function() {
            preview.hide();
            preview.file = fc.get_filename();
            preview.show();
        }));
	if (fc.run() == Gtk.ResponseType.ACCEPT) {
            this._loadIconPath = fc.get_filename();
            this._loadIcon(this._loadIconPath);
            let key = this._keys['Icon'];
            this._changesArray[key] = this._loadIconPath;
            this._revertCheck();
        }
        fc.destroy();
        this._dialogObj.set_keep_above(true);
    },

    _browseClicked: function() {
        this._dialogObj.set_keep_above(false);
        let fcAction, fcTitle, prefix;
        this._checkComboBoxState();
        if (this._isLink) {
            if (this._fileLinkRadioBtnObj.active) {
                fcAction = Gtk.FileChooserAction.OPEN;
                fcTitle = _("Choose file");
            } else {
                fcAction = Gtk.FileChooserAction.SELECT_FOLDER;
                fcTitle = _("Choose folder");
            }
        } else {
            fcAction = Gtk.FileChooserAction.OPEN;
            fcTitle = _("Choose file");
        }
        let fc = new Gtk.FileChooserDialog({ title:fcTitle, action:fcAction, show_hidden:true });
        fc.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        fc.add_button(Gtk.STOCK_OPEN, Gtk.ResponseType.ACCEPT);
        fc.set_filename(this._commandObj.text);
	if (fc.run() == Gtk.ResponseType.ACCEPT) {
            if (this._isLink) {
                prefix = 'file://';
            } else {
                this._fileLinkRadioBtnObj.active = true;
                prefix = '';
            }
            this._commandObj.set_text(prefix + fc.get_filename());
            this._revertCheck();
        }
        fc.destroy();
        this._dialogObj.set_keep_above(true);
    },

    _radioBtnToggled: function() {
        this._browseObj.sensitive = true;
        if (this._isLink) {
            if (this._anyLinkRadioBtnObj.active) {
                this._browseObj.sensitive = false;
            }
        }
    },

    _checkBtnToggled: function() {
        this._revertObj.sensitive = true;
        if (this._checkBtnObj.active)
            this._changesArray['NoDisplay'] = 'true';
        else
            this._changesArray['NoDisplay'] = 'false';
    }

});

let dee = new DesktopEntryEditor('nls1729.dee');
dee._app.run(ARGV);

