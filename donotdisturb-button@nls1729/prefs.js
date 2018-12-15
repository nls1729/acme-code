
/*
  Do Not Disturb Button Gnome Shell Extension

  Copyright (c) 2015-2018 Norman L. Smith

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

const GObject = imports.gi.GObject;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Config = imports.misc.config;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const DOMAIN = Me.metadata['gettext-domain'];
const Gettext = imports.gettext;
const _ = Gettext.domain(DOMAIN).gettext;
const COMMIT = "Commit: c0a710febf0c6219a4598b96973fe4b42f3cbe7d";
const SHORTCUT = 'shortcut';
const LEFT = 'panel-icon-left';
const CENTER = 'panel-icon-center';
const SHOW_COUNT = 'panel-count-show';
const OVERRIDE = 'override';
const OVERRIDE_BUSY_STATE = 'overrride-busy-state';
const AVAILABLE_ICON = 'available-icon';
const BUSY_ICON = 'busy-icon';
const SET_AVAL = true;
const SET_BUSY = false;

function init() {
    let localeDir = Me.dir.get_child('locale');
    if (localeDir.query_exists(null))
        Gettext.bindtextdomain(DOMAIN, localeDir.get_path());
    else
        Gettext.bindtextdomain(DOMAIN, Config.LOCALEDIR);
}

const DoNotDisturbPrefsWidget = new GObject.registerClass(
class DoNotDisturbPrefsWidget extends Gtk.Box {

    _init(params) {
        super._init(params);
        let GioSSS = Gio.SettingsSchemaSource;
        let schema = Me.metadata['settings-schema'];
        let schemaDir = Me.dir.get_child('schemas');
        let schemaSrc;
        if (schemaDir.query_exists(null))
            schemaSrc = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
        else
            schemaSrc = GioSSS.get_default();
        let schemaObj = schemaSrc.lookup(schema, true);
        if (!schemaObj)
            throw new Error('Schema ' + schema + ' not found.');
        this._settings = new Gio.Settings({ settings_schema: schemaObj });
        this._availableIconPath = this._settings.get_string(AVAILABLE_ICON);
        if (this._availableIconPath == 'default') {
            this._availableIconPath = Me.path + '/available-yes.png';
            this._settings.set_string(AVAILABLE_ICON, this._availableIconPath);
        }
        this._busyIconPath = this._settings.get_string(BUSY_ICON);
        if (this._busyIconPath == 'default') {
            this._busyIconPath = Me.path + '/available-no.png';
            this._settings.set_string(BUSY_ICON, this._busyIconPath);
        }
        this._grid = new Gtk.Grid();
        this._grid.margin = 4;
        this._grid.row_spacing = 4;
        this._grid.column_spacing = 1;
        this._grid.set_column_homogeneous(false);
        let help = _("To edit shortcut, click the row and hold down the new keys or press Backspace to clear.");
        let title = _("Edit");
        let helpLabel = new Gtk.Label({wrap: true, xalign: 0.5 })
        helpLabel.set_text(help);
        helpLabel.set_width_chars(64);
        let selectIcons = new Gtk.Box({orientation:Gtk.Orientation.HORIZONTAL, homogeneous:true,
            margin_left:2, margin_top:1, margin_bottom:1, margin_right:2});
        this._busyImage = this._loadIcon(this._busyIconPath);
        this._availableImage = this._loadIcon(this._availableIconPath);
        this._availableBtn = new Gtk.Button({ label: _("Available") });
        this._busyBtn = new Gtk.Button({ label: _("Busy") });
        this._availableBtn.set_always_show_image(true);
        this._availableBtn.set_image(this._availableImage);
        this._busyBtn.set_always_show_image(true);
        this._busyBtn.set_image(this._busyImage);
        selectIcons.add(this._availableBtn);
        selectIcons.add(this._busyBtn);
        this._availableBtn.connect('clicked', () => {
            this._setIcon(SET_AVAL, this._availableIconPath);
        });
        this._busyBtn.connect('clicked', () => {
            this._setIcon(SET_BUSY, this._busyIconPath);
        });
        this._centerCb = new Gtk.CheckButton({label:_("Center")});
        this._showCountCb = new Gtk.CheckButton({label:_("Show Notification Count")});
        this._leftRb = new Gtk.RadioButton({label:_("Left")});
        this._rightRb = new Gtk.RadioButton({group:this._leftRb, label:_("Right")});
        let rbGroup = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:2, margin_top:1, margin_bottom:1, margin_right:2});
        let rbGroupA = new Gtk.Box({orientation:Gtk.Orientation.HORIZONTAL, homogeneous:false,
            margin_left:2, margin_top:1, margin_bottom:1, margin_right:2});
        this._btnPosition = new Gtk.Label({ label: _("Button Location") ,xalign: 0.0 });
        rbGroup.add(this._btnPosition);
        rbGroupA.add(this._centerCb);
        rbGroupA.add(this._leftRb);
        rbGroupA.add(this._rightRb);
        rbGroup.add(rbGroupA);
        this._bootImage = new Gtk.Image({ file: Me.path + '/gnome-session-reboot.png'});
        this._defaultPersistenceImage = new Gtk.Image({ file: Me.path + '/default-persistence.png'});
        let bootBox = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:2, margin_top:1, margin_bottom:1, margin_right:2});
        bootBox.add(this._bootImage);
        bootBox.add(this._defaultPersistenceImage);
        let rbGroup2 = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:2, margin_top:1, margin_bottom:1, margin_right:2});
        let rbGroupB = new Gtk.Box({orientation:Gtk.Orientation.HORIZONTAL, homogeneous:false,
            margin_left:2, margin_top:1, margin_bottom:1, margin_right:2});
        this._overrideCb = new Gtk.CheckButton({label:_("Enable")});
        this._busyRb = new Gtk.RadioButton({label:_("Busy")});
        this._availableRb = new Gtk.RadioButton({group:this._busyRb, label:_("Available")});
        this._overrideState = new Gtk.Label({ label: _("Busy State Override At Session Start"), wrap: true, xalign: 0.0 });
        rbGroup2.add(this._overrideState);
        rbGroupB.add(this._overrideCb);
        rbGroupB.add(this._busyRb);
        rbGroupB.add(this._availableRb);
        rbGroupB.add(bootBox);
        rbGroup2.add(rbGroupB);
        let shell_version = Me.metadata['shell-version'].toString();
        let version = '[v' + Me.metadata.version.toString() + '  GS ' + shell_version + ']';
        this._linkBtn = new Gtk.LinkButton({uri: Me.metadata['url'], label: _("Website")});
        this._columns = {Name: 0, Mods: 1, Key: 2};
        this._listStore = new Gtk.ListStore();
        this._listStore.set_column_types([GObject.TYPE_STRING, GObject.TYPE_INT, GObject.TYPE_INT]);
        this._treeView = new Gtk.TreeView({model: this._listStore, hexpand: true, vexpand: false});
        this._treeView.set_grid_lines(Gtk.TreeViewGridLines.VERTICAL);
        this._treeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);
        let keyBindingRenderer = new Gtk.CellRendererAccel({'editable': true,
                                                            'accel-mode': Gtk.CellRendererAccelMode.GTK});
        keyBindingRenderer.connect('accel-edited', (renderer, iter, key, mods) => {
            let value = Gtk.accelerator_name(key, mods);
            let [success, iterator] = this._listStore.get_iter_from_string(iter);
            let name = this._listStore.get_value(iterator, 0);
            this._listStore.set(iterator, [this._columns.Mods, this._columns.Key], [mods, key]);
            this._settings.set_strv(name, [value]);
            return true;
        });
        keyBindingRenderer.connect('accel-cleared', (renderer, iter, key, mods) => {
            let [success, iterator] = this._listStore.get_iter_from_string(iter);
            this._listStore.set(iterator, [this._columns.Mods, this._columns.Key], [0, 0]);
            let name = this._listStore.get_value(iterator, 0);
            this._settings.set_strv(name, []);
        });
        let keyBindingColumn = new Gtk.TreeViewColumn({'title': title, 'expand': true, 'min-width': 20});
        keyBindingColumn.pack_start(keyBindingRenderer, false);
        keyBindingColumn.add_attribute(keyBindingRenderer, 'accel-mods', this._columns.Mods);
        keyBindingColumn.add_attribute(keyBindingRenderer, 'accel-key', this._columns.Key);
        this._treeView.append_column(keyBindingColumn);
        let [key, mods] = [0, 0];
        let setting = this._settings.get_strv(SHORTCUT)[0];
        if (setting !== undefined) {
            [key, mods] = Gtk.accelerator_parse(this._settings.get_strv(SHORTCUT)[0]);
        }
        let iter = this._listStore.append();
        let arg0 = [this._columns.Name, this._columns.Mods, this._columns.Key];
        let arg1 = [SHORTCUT, mods, key];
        this._listStore.set(iter, arg0, arg1);
        let left = this._settings.get_boolean(LEFT);
        let center = this._settings.get_boolean(CENTER);
        let showCount = this._settings.get_boolean(SHOW_COUNT);
        let overrideState = this._settings.get_boolean(OVERRIDE);
        let overrideBusyState = this._settings.get_boolean(OVERRIDE_BUSY_STATE);
        this._showCountCb.set_active(showCount);
        this._leftRb.set_active(left);
        this._rightRb.set_active(!left);
        this._centerCb.set_active(center);
        this._overrideCb.set_active(overrideState);
        this._busyRb.set_active(overrideBusyState);
        this._availableRb.set_active(!overrideBusyState);
        this._overrideCb.connect('toggled', this._setOverrideState.bind(this));
        this._busyRb.connect('toggled', (b) => {
            let state = b.get_active()
            this._settings.set_boolean(OVERRIDE_BUSY_STATE, state);
        });
        this._availableRb.connect('toggled', (b) => {
            let state = b.get_active()
            this._settings.set_boolean(OVERRIDE_BUSY_STATE, !state);
        });
        this._leftRb.connect('toggled', (b) => {
            if(b.get_active())
                this._settings.set_boolean(LEFT, true);
            else
                this._settings.set_boolean(LEFT, false);
        });
        this._rightRb.connect('toggled', (b) => {
            if(b.get_active())
                this._settings.set_boolean(LEFT, false);
            else
                this._settings.set_boolean(LEFT, true);
        });
        this._centerCb.connect('toggled', (b) => {
            if(b.get_active()) {
                this._settings.set_boolean(CENTER, true);
            } else {
                this._settings.set_boolean(CENTER, false);
            }
        });
        this._showCountCb.connect('toggled', (b) => {
            if(b.get_active()) {
                this._settings.set_boolean(SHOW_COUNT, true);
            } else {
                this._settings.set_boolean(SHOW_COUNT, false);
            }
        });
        let filler = new Gtk.Label({ label: "  " });
        this._grid.attach(helpLabel,                                                      0,  0, 12, 1);
        this._grid.attach(this._treeView,                                                 1,  1, 10, 1);
        this._grid.attach(selectIcons,                                                    1,  3, 10, 1);
        this._grid.attach(this._showCountCb,                                              1,  4, 10, 1);
        this._grid.attach(rbGroup,                                                        1, 10, 10, 1);
        this._grid.attach(rbGroup2,                                                       1, 15, 10, 1);
        this._grid.attach(filler,                                                         0, 20, 10, 4);
        this._grid.attach(new Gtk.Label({ label: version, wrap: true, xalign: 0.5 }),     0, 26, 12, 1);
        this._grid.attach(new Gtk.Label({ label: COMMIT, wrap: true, xalign: 0.5 }),      0, 28, 12, 1);
        this._grid.attach(this._linkBtn,                                                  0, 30, 12, 1);
        this.add(this._grid);
    }

    _setIcon(available, iconPath) {
        let dialog = new Gtk.FileChooserDialog({ title: _("Choose Icon"), action: Gtk.FileChooserAction.OPEN });
        dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        dialog.add_button(Gtk.STOCK_OPEN, Gtk.ResponseType.ACCEPT);
        dialog.set_filename(iconPath);
        let filter = new Gtk.FileFilter();
        filter.set_name(_("Images"));
        filter.add_pattern("*.png");
        filter.add_pattern("*.jpg");
        filter.add_pattern("*.xpm");
        filter.add_pattern("*.svg");
        dialog.set_filter(filter);
        let preview = new Gtk.Image({ file: iconPath });
        dialog.set_preview_widget(preview);
        dialog.connect('update-preview', () => {
            preview.hide();
            preview.file = dialog.get_filename();
            preview.show();
        });
        let response = dialog.run();
        if(response == Gtk.ResponseType.ACCEPT) {
            let filename = dialog.get_filename()
            if (available) {
                this._availableIconPath = filename;
                this._availableImage = this._loadIcon(filename);
                this._availableBtn.set_image(this._availableImage);
                this._settings.set_string(AVAILABLE_ICON, filename);
            } else {
                this._busyIconPath = filename;
                this._busyImage = this._loadIcon(filename);
                this._busyBtn.set_image(this._busyImage);
                this._settings.set_string(BUSY_ICON, filename);
            }
            let reset = this._settings.get_boolean('reset-icon');
            this._settings.set_boolean('reset-icon', !reset);
        }
        dialog.destroy();
    }

    _loadIcon(path) {
        let target = new Gtk.Image();
        let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(path, 24, 24, null);
        target.set_from_pixbuf(pixbuf);
        return target;
    }

    _setOverrideState() {
        let override = this._overrideCb.get_active();
        this._settings.set_boolean(OVERRIDE, override);
        if (override) {
            this._bootImage.show();
            this._defaultPersistenceImage.hide();
        } else {
            this._bootImage.hide();
            this._defaultPersistenceImage.show();
        }
    }
});

function buildPrefsWidget() {

    let widget = new DoNotDisturbPrefsWidget();
    let scollingWindow = new Gtk.ScrolledWindow({
        'hscrollbar-policy': Gtk.PolicyType.NEVER,
        'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
        'hexpand': false,
        'vexpand': true
    });
    scollingWindow.add_with_viewport(widget);
    scollingWindow.set_size_request(740, 420);
    scollingWindow.show_all();
    widget._setOverrideState();
    return scollingWindow;
}

