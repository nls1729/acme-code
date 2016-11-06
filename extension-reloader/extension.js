
/* This extension is a derived work of the Gnome Shell.
*
* Copyright (c) 2012-2016 Norman L. Smith
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
const ICON_PATH = Me.path + '/view-refresh-symbolic.svg';
const ICON_STYLE = 'icon-size: 1.25em; padding-left: 2; padding-right: 2';
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
    },

    destroy: function() {
        this.parent();
    },

    activate: function(event) {
        log('Reloading : ' + this._uuid);
	Util.trySpawn([TOOL, '-r', this._uuid]);
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
            gicon: Gio.icon_new_for_string(ICON_PATH)
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

function enable() {
    _indicator = new ReloadExtensionMenu;
    if (!GLib.file_test(TOOL, GLib.FileTest.IS_EXECUTABLE))
        Util.trySpawn(['/usr/bin/chmod', '0700', TOOL]);
    Main.panel.addToStatusArea(INDICATOR_TAG, _indicator, 0, 'right');
    let mode = Main.sessionMode.currentMode;
    if (mode == 'classic' || mode == 'user')
        _timer = Mainloop.timeout_add(5000, delayedPopulateMenu);
}

function delayedPopulateMenu() {

    // Must delay until all other extensions have been loaded.
    // When gnome-shell-extension-tool with reload option is
    // released the included tool and chmod logic will not be
    // required and will be removed.

    _indicator.populateMenu();
    _timer = 0;
}

function disable() {
    if (_timer != 0) {
        Mainloop.source_remove(_timer);    
    }
    _indicator.destroy();
}
