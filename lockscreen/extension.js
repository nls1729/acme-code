
// Copyright 2014 Donald Pakkies
// Name: Lock Screen
// Version: 0.1
// License: GPL v3
// Author: Donald Pakkies

// Description: Gnome Lock Screen for LightDM Greeter

// 2014-11-14 Modified at the request of Donald Pakkies
// to include code to implement an acceleration key. 
// Ctrl+Alt+L executes dm-tool to lock screen.

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;
const Util = imports.misc.util;

const Me = imports.misc.extensionUtils.getCurrentExtension();

let settings;
let lockScreenPanelButton;

const LockScreenPanelButton = new Lang.Class({
    Name: 'LockScreenPanelButton',
    Extends: PanelMenu.Button,

    _init: function(settings) {
        this.parent(0.0, null, true);
        this.actor.name = 'lockScreenPanelButton';
        this._buttonBin = new St.Bin();
        this._icon = new St.Icon({icon_name: 'changes-prevent-symbolic',
			        style_class: 'system-status-icon'});
        this._buttonBin.set_child(this._icon);
        this.actor.add_actor(this._buttonBin);
    },

    _activateLockScreen : function() {
        Util.spawn(['/usr/bin/dm-tool', 'lock']);
    },

    _onButtonPress: function(actor, event) {
        this._activateLockScreen();
    },

    destroy: function() {
        this._icon.destroy();
        this._buttonBin.destroy();
        this.parent();
    }
});

function init() {
    let GioSSS = Gio.SettingsSchemaSource;
    let schema = Me.metadata['settings-schema'];
    let schemaDir = Me.dir.get_path();
    let schemaSource = GioSSS.new_from_directory(schemaDir,
                                         GioSSS.get_default(), false);
    let schemaObj = schemaSource.lookup(schema, false);
    settings = new Gio.Settings({settings_schema: schemaObj});
}

function enable() {
    lockScreenPanelButton = new LockScreenPanelButton();
    Main.wm.addKeybinding('lockscreen-acceleration-key', settings,
                           Meta.KeyBindingFlags.NONE,
                           Shell.KeyBindingMode.NORMAL |
                           Shell.KeyBindingMode.OVERVIEW,
                           lockScreenPanelButton._activateLockScreen);
    Main.panel.addToStatusArea('lock-screen-panel-button',
                                   lockScreenPanelButton, 0, 'right');
}

function disable() {
    Main.wm.removeKeybinding('lockscreen-acceleration-key');
    lockScreenPanelButton.destroy();
}
