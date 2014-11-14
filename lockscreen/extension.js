
// Name: Lock Screen
// Version: 0.1
// License: GPL v3
// Author: Donald Pakkies

// Description: Gnome Lock Screen for LightDM Greeter

// Modified at the request of Donald Pakkies to include
// code to implement an acceleration key. 2014-11-14

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Util = imports.misc.util;

const Me = imports.misc.extensionUtils.getCurrentExtension();

let settings;
let button;
let buttonSignal;

function _activatelockscreen() {
    Util.spawn(['/usr/bin/dm-tool', 'lock']);
}

function init() {

    let GioSSS = Gio.SettingsSchemaSource;
    let schema = Me.metadata['settings-schema'];
    let schemaDir = Me.dir.get_path();
    let schemaSource = GioSSS.new_from_directory(schemaDir, 
                                         GioSSS.get_default(), false);
    let schemaObj = schemaSource.lookup(schema, false);
    settings = new Gio.Settings( { settings_schema: schemaObj } );

    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
    let icon = new St.Icon ({ icon_name: 'changes-prevent-symbolic',
			      style_class: 'system-status-icon'});

    button.set_child(icon);
}

function enable() {
         
    Main.wm.addKeybinding('acceleration-key', settings,
                                  Meta.KeyBindingFlags.NONE,
                                  Shell.KeyBindingMode.NORMAL |
                                  Shell.KeyBindingMode.OVERVIEW,
                                  _activatelockscreen);
    buttonSignal = button.connect('button-press-event', _activatelockscreen);
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    button.disconnect(buttonSignal);
    Main.wm.removeKeybinding('acceleration-key');
    Main.panel._rightBox.remove_child(button);
}
