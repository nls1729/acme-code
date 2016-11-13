
/* This extension is a derived work of the Gnome Shell.
*
* Copyright (c) 2016 Norman L. Smith
*
* This extension is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* This extension is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this extension; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
*/

/*
    This extension is intended for use by Gnome Shell Extension writers.
    It is common practice to restart the Shell during testing an extension
    to reload the extension to test changes made to the extension's code.
    Wayland does not allow restart of the Shell.  To reload an extension
    under Wayland a logout and a login is required.  This extension reloads
    only the selected extension with two mouse clicks saving time for the
    extension writer.
*/

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const Me = ExtensionUtils.getCurrentExtension();
const Notify = Me.imports.notify;
const ICON_PATH = Me.path + '/view-refresh-symbolic.svg';
const ICON_STYLE = 'icon-size: 1.2em; padding-left: 2; padding-right: 2';
const INDICATOR_TAG = 'extension-reloader-indicator';
const TOOL = Me.path + '/gnome-shell-extension-tool';


const ExtensionMenuItem = new Lang.Class({
    Name: 'ExtensionMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(uuid, name) {
	this.parent();
        this._label = new St.Label({ text: name });
        this.actor.add_child(this._label);
        this._uuid = uuid;
        this._name = name;
        this._delayTimer = 0;
    },

    destroy: function() {
        if (this._delayTimer > 0)
            Mainloop.source_remove(this._delayTimer);
        this.parent();
    },

    _activate: function() {
        if (this._delayTimer > 0)
            Mainloop.source_remove(this._delayTimer);
	Util.trySpawn([TOOL, '-r', this._uuid]);
        log('Reloading : ' + this._uuid);
        Notify.notify('Reloading : ',this._name);
    },

    activate: function(event) {
        // When the TOOL is first installed it is not executable.
        if (!GLib.file_test(TOOL, GLib.FileTest.IS_EXECUTABLE)) {
            Util.trySpawn(['/usr/bin/chmod', '0700', TOOL]);
            this._delayTimer = Mainloop.timeout_add(2000, Lang.bind(this, this._activate));
        } else {
            this._activate();
        }
	this.parent(event);
    },
});

const ReloadExtensionMenu = new Lang.Class({
    Name: 'ReloadExtensionMenu.ReloadExtensionMenu',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, 'Reload Extension Menu');

        let hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        let iconBin = new St.Bin();
        iconBin.child = new St.Icon({
            icon_name: 'emblem-synchronizing-symbolic'
        });
        iconBin.child.set_style(ICON_STYLE);
        hbox.add_child(iconBin);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_actor(hbox);
        let section = new PopupMenu.PopupMenuSection();
        let textBin = new St.Bin();
        textBin.child = new St.Label({
            text: '< Gnome Shell Extension Reloader >',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        textBin.child.set_style('font-size: 1.5em');
        section.actor.add_actor(textBin);
        this.menu.addMenuItem(section);
    },

    populateMenu: function() {
        for (let i in ExtensionUtils.extensions) {
            let uuid = ExtensionUtils.extensions[i].uuid;
            let name = ExtensionUtils.extensions[i].metadata.name;
            let item = new ExtensionMenuItem(uuid, name);
            this.menu.addMenuItem(item);
        }
    },

    destroy: function() {
        this.parent();
    },
});


let _indicator;
let _timer = 0;

function init() {
}

function enable() {
    let mode = Main.sessionMode.currentMode;
    if (mode == 'classic' || mode == 'user')
        _timer = Mainloop.timeout_add(5000, delayedPopulateMenu);
}

function delayedPopulateMenu() {

    // Must delay until all other extensions have been loaded.
    // When gnome-shell-extension-tool with reload option is
    // released the included tool and chmod logic will not be
    // required and will be removed.
    _indicator = new ReloadExtensionMenu;
    _indicator.populateMenu();
    Main.panel.addToStatusArea(INDICATOR_TAG, _indicator, 0, 'right');
    _timer = 0;
}

function disable() {
    if (_timer != 0) {
        Mainloop.source_remove(_timer);    
    }
    _indicator.destroy();
}
