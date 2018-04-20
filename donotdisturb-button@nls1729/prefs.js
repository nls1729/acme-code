
const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Config = imports.misc.config;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const DOMAIN = Me.metadata['gettext-domain'];
const Gettext = imports.gettext;
const _ = Gettext.domain(DOMAIN).gettext;
const COMMIT = "Commit: 116f7d59e1a21c6fe5b7e178e9d49b232fa6b303";
const SHORTCUT = 'shortcut';
const LEFT = 'panel-icon-left';
const CENTER = 'panel-icon-center';
const SHOW_COUNT = 'panel-count-show';
const OVERRIDE = 'override';
const OVERRIDE_BUSY_STATE = 'overrride-busy-state';

function init() {
    let localeDir = Me.dir.get_child('locale');
    if (localeDir.query_exists(null))
        Gettext.bindtextdomain(DOMAIN, localeDir.get_path());
    else
        Gettext.bindtextdomain(DOMAIN, Config.LOCALEDIR);
}

const DoNotDisturbPrefsWidget = new GObject.Class({
    Name: 'DoNotDisturb.Prefs.Widget',
    GTypeName: 'DoNotDisturbPrefsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);
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
        this._grid = new Gtk.Grid();
        this._grid.margin = 5;
        this._grid.row_spacing = 10;
        this._grid.column_spacing = 1;
        this._grid.set_column_homogeneous(false);
        let help = _("To edit shortcut, click the row and hold down the new keys or press Backspace to clear.");
        let title = _("Edit");
        this._centerCb = new Gtk.CheckButton({label:_("Center")});
        this._showCountCb = new Gtk.CheckButton({label:_("Show Notification Count")});
        this._leftRb = new Gtk.RadioButton({label:_("Left")});
        this._rightRb = new Gtk.RadioButton({group:this._leftRb, label:_("Right")});
        let rbGroup = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:4, margin_top:2, margin_bottom:2, margin_right:4});
        this._btnPosition = new Gtk.Label({ label: _("Button Location") ,xalign: 0.0 });
        rbGroup.add(this._btnPosition);
        rbGroup.add(this._centerCb);
        rbGroup.add(this._leftRb);
        rbGroup.add(this._rightRb);
        let rbGroup2 = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:4, margin_top:2, margin_bottom:2, margin_right:4});
        this._overrideCb = new Gtk.CheckButton({label:_("Enable")});
        this._busyRb = new Gtk.RadioButton({label:_("Busy")});
        this._availableRb = new Gtk.RadioButton({group:this._busyRb, label:_("Available")});
        this._yesImage = new Gtk.Image({ file: Me.path + '/available-yes.png'});
        this._noImage = new Gtk.Image({ file: Me.path + '/available-no.png'});
        this._bootImage = new Gtk.Image({ file: Me.path + '/gnome-session-reboot.png'});
        this._defaultPersistenceImage = new Gtk.Image({ file: Me.path + '/default-persistence.png'});
        this._overrideState = new Gtk.Label({ label: _("Busy State Override At Session Start"), wrap: true, xalign: 0.0 });
        rbGroup2.add(this._overrideState);
        rbGroup2.add(this._overrideCb);
        rbGroup2.add(this._busyRb);
        rbGroup2.add(this._availableRb);
        let iconBox = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:4, margin_top:2, margin_bottom:2, margin_right:4});
        iconBox.add(this._yesImage);
        iconBox.add(this._noImage);
        let bootBox = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:4, margin_top:2, margin_bottom:2, margin_right:4});
        bootBox.add(this._bootImage);
        bootBox.add(this._defaultPersistenceImage);
        let helpLabel = new Gtk.Label({wrap: true, xalign: 0.5 })
        helpLabel.set_text(help);
        helpLabel.set_width_chars(64);
        let shell_version = Me.metadata['shell-version'].toString();
        let version = '[v' + Me.metadata.version.toString() + ' GS ' + shell_version + ']';
        this._linkBtn = new Gtk.LinkButton({uri: Me.metadata['url'], label: _("Website")});
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
        this._busyRb.connect('toggled', Lang.bind(this, function(b) {
            let state = b.get_active()
            this._settings.set_boolean(OVERRIDE_BUSY_STATE, state);
            this._setIcons(state);
        }));
        this._availableRb.connect('toggled', Lang.bind(this, function(b) {
            let state = b.get_active()
            this._settings.set_boolean(OVERRIDE_BUSY_STATE, !state);
            this._setIcons(!state);
        }));        
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
        this._showCountCb.connect('toggled', Lang.bind(this, function(b) {
            if(b.get_active()) {
                this._settings.set_boolean(SHOW_COUNT, true);
            } else {
                this._settings.set_boolean(SHOW_COUNT, false);
            }
        }));
        this._busyRb.set_active(!this._overrideBusyState);        
        this._overrideCb.connect('toggled', Lang.bind(this, this._setOverrideState));
        this._grid.attach(helpLabel,                                                      0,  0, 12, 1);
        this._grid.attach(this._treeView,                                                 5,  1,  4, 1);
        this._grid.attach(this._showCountCb,                                              5,  6, 12, 1);
        this._grid.attach(rbGroup,                                                        5, 10, 12, 1);
        this._grid.attach(rbGroup2,                                                       5, 15, 12, 1);
        this._grid.attach(iconBox,                                                        0, 18, 12, 1);
        this._grid.attach(bootBox,                                                        0, 20, 12, 1);
        this._grid.attach(new Gtk.Label({ label: version, wrap: true, xalign: 0.5 }),     0, 22, 12, 1);
        this._grid.attach(new Gtk.Label({ label: COMMIT, wrap: true, xalign: 0.5 }),      0, 24, 12, 1);
        this._grid.attach(this._linkBtn,                                                  0, 26, 12, 1);
        let filler = new Gtk.Label({ label: "  " });
        this._grid.attach(filler,                                                         0, 28, 10, 2);        
        this.add(this._grid);
        this._leftRb.set_active(left);
        this._rightRb.set_active(!left);
        this._centerCb.set_active(center);
        this._showCountCb.set_active(showCount);
        this._overrideCb.set_active(overrideState);
        this._busyRb.set_active(overrideBusyState);
        this._availableRb.set_active(!overrideBusyState);
    },

    _setIcons: function(busyState) {
        if (busyState) {
            this._yesImage.hide();
            this._noImage.show();
        } else {
            this._yesImage.show();
            this._noImage.hide();             
        }
    },

    _setOverrideState: function() {
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
    scollingWindow.set_size_request(740, 530);
    scollingWindow.show_all();
    widget._setIcons(widget._settings.get_boolean(OVERRIDE_BUSY_STATE));
    widget._setOverrideState();
    return scollingWindow;
}

