/*
  Copyright (c) 2015-2016 Norman L. Smith

  This file is part of the Do Not Disturb Extension donotdisturb-button@nls1729.

  The extension is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public Licenseas published by the Free
  Software Foundation; either version 2 of the License, or (at your option)
  any later version.  The extension is distributed in the hope it will be
  useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
  Public License for more details.  You should have received a copy of the
  GNU General Public License along with the extension.  If not, see
  <http://www.gnu.org/licenses/>.

  This extension is a derived work of the Gnome Shell.
*/

const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Config = imports.misc.config;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const DOMAIN = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(DOMAIN);
const _ = Gettext.gettext;
const COMMIT = "Commit: 0213998c3463ccf848c65df089978d85614cdb5e";
const SHORTCUT = 'shortcut';
const LEFT = 'panel-icon-left';
const CENTER = 'panel-icon-center';

const UI_FILE_PATH = Me.path + '/position.ui';

function init() {
    imports.gettext.bindtextdomain(DOMAIN, Me.path + "/locale");
}

const DoNotDisturbPrefsWidget = new GObject.Class({
    Name: 'DoNotDisturb.Prefs.Widget',
    GTypeName: 'DoNotDisturbPrefsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);
        this._builder = new Gtk.Builder();
        if (this._builder.add_from_file(UI_FILE_PATH) == 0) {
            let msg = 'Failed loading ui file';
            throw new Error(msg);
        }
        let buttonBox1 = this._builder.get_object('buttonBox1');
        let buttonBox2 = this._builder.get_object('buttonBox2');
        let buttonBox3 = this._builder.get_object('buttonBox3');
        this._leftRb = this._builder.get_object('leftRb');
        this._rightRb = this._builder.get_object('rightRb');
        this._centerCb = this._builder.get_object('centerCb');
        let GioSSS = Gio.SettingsSchemaSource;
        let schema = Me.metadata['settings-schema'];
        let schemaDir = Me.dir.get_child('schemas').get_path();
        let schemaSrc = GioSSS.new_from_directory(schemaDir, GioSSS.get_default(), false);
        let schemaObj = schemaSrc.lookup(schema, true);
        this._settings = new Gio.Settings({ settings_schema: schemaObj });
        this.set_orientation(Gtk.Orientation.VERTICAL);
        let yesImage = new Gtk.Image({ file: Me.path + '/available-yes.png'});
        let noImage = new Gtk.Image({ file: Me.path + '/available-no.png'});
        let help = _("To edit shortcut, click the row and hold down the new keys or press Backspace to clear.");
        let shell_version = Me.metadata['shell-version'].toString();
        let version = '[v' + Me.metadata.version.toString();
        version = version + ' GS ' + shell_version + ']';
        let btnPosition = _("Panel Button Position");
        this._linkBtn = new Gtk.LinkButton({uri: Me.metadata['url'], label: 'Website'});
        this._grid = new Gtk.Grid();
        this._grid.margin = 5;
        this._grid.row_spacing = 5;
        this._grid.column_spacing = 5;
        this._grid.set_column_homogeneous(true);
        this._grid.attach(new Gtk.Label({ label: help, wrap: true, xalign: 0.5 }), 0, 1, 7, 1);
        this._grid.attach(new Gtk.Label({ label: btnPosition, wrap: true, xalign: 0.5 }), 0, 4, 7, 1);
        this._grid.attach(new Gtk.Label({ label: version, wrap: true, xalign: 0.5 }), 0, 11, 7, 1);
        this._grid.attach(new Gtk.Label({ label: COMMIT, wrap: true, xalign: 0.5 }), 0, 12, 7, 1);
        this._grid.attach(buttonBox1, 3, 5, 1, 1);
        this._grid.attach(buttonBox2, 3, 6, 1, 1);
        this._grid.attach(buttonBox3, 3, 7, 1, 1);
        this._grid.attach(this._linkBtn, 3, 14, 1, 1);
        this._grid.attach(yesImage, 3, 3, 1, 1);
        this._grid.attach(noImage, 3, 8, 1, 1);
        this._columns = {Name: 0, Mods: 1, Key: 2};
        this._listStore = new Gtk.ListStore();
        this._listStore.set_column_types([GObject.TYPE_STRING, GObject.TYPE_INT, GObject.TYPE_INT]);
        this._treeView = new Gtk.TreeView({model: this._listStore, hexpand: true, vexpand: false});
        this._treeView.set_grid_lines(Gtk.TreeViewGridLines.VERTICAL);
        this._treeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);
        let keyBindingRenderer = new Gtk.CellRendererAccel({'editable': true,
                                                            'accel-mode': Gtk.CellRendererAccelMode.GTK});
        keyBindingRenderer.connect('accel-edited', Lang.bind(this, function(renderer, iter, key, mods) {
            let value = Gtk.accelerator_name(key, mods);
            let [success, iterator] = this._listStore.get_iter_from_string(iter);
            let name = this._listStore.get_value(iterator, 0);
            this._listStore.set(iterator, [this._columns.Mods, this._columns.Key], [mods, key]);
            this._settings.set_strv(name, [value]);
            return true;
        }));
        keyBindingRenderer.connect('accel-cleared', Lang.bind(this, function(renderer, iter, key, mods) {
            let [success, iterator] = this._listStore.get_iter_from_string(iter);
            this._listStore.set(iterator, [this._columns.Mods, this._columns.Key], [0, 0]);
            let name = this._listStore.get_value(iterator, 0);
            this._settings.set_strv(name, []);
        }));
        let title = _("Edit");
        let keyBindingColumn = new Gtk.TreeViewColumn({'title': title, 'expand': true, 'min-width': 20});
        keyBindingColumn.pack_start(keyBindingRenderer, false);
        keyBindingColumn.add_attribute(keyBindingRenderer, 'accel-mods', this._columns.Mods);
        keyBindingColumn.add_attribute(keyBindingRenderer, 'accel-key', this._columns.Key);
        this._treeView.append_column(keyBindingColumn);
        this._grid.attach(this._treeView, 2, 2, 3, 1);
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
        this._leftRb.connect('toggled', Lang.bind(this, function(b) {
            if(b.get_active())
                this._settings.set_boolean(LEFT, true);
            else
                this._settings.set_boolean(LEFT, false);
        }));
        this._rightRb.connect('toggled', Lang.bind(this, function(b) {
            if(b.get_active())
                this._settings.set_boolean(LEFT, false);
            else
                this._settings.set_boolean(LEFT, true);
        }));
        this._centerCb.connect('toggled', Lang.bind(this, function(b) {
            if(b.get_active()) {
                this._settings.set_boolean(CENTER, true);
            } else {
                this._settings.set_boolean(CENTER, false);
            }
        }));
        this._leftRb.set_active(left);
        this._rightRb.set_active(!left);
        this._centerCb.set_active(center);
        this.add(this._grid);
    }
});

function buildPrefsWidget() {

    let widget = new DoNotDisturbPrefsWidget();
    let scollingWindow = new Gtk.ScrolledWindow({
        'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
        'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
        'hexpand': true,
        'vexpand': true
    });
    scollingWindow.add_with_viewport(widget);
    scollingWindow.set_size_request(780, 410);
    scollingWindow.show_all();
    return scollingWindow;
}

