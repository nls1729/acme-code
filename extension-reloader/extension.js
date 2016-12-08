
/*
  Gnome Shell Extension Reloader Gnome Shell Extension

  Copyright (c) 2016 Norman L. Smith

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
const ENABLED = 1;
const ICON_PATH = Me.path + '/view-refresh-symbolic.svg';
const ICON_STYLE = 'icon-size: 1.1em; padding-left: 2; padding-right: 2';
const INDICATOR_TAG = 'extension-reloader-indicator';
const STATE = ['Unknown',
               'Enabled',
               'Disabled',
               'Error',
               'Out of Date',
               'Downloading',
               'Initialized'
              ];
const STYLE2 = 'font-weight: bold;';
const STYLE1 = 'width: 120px;';
const TOOL = Me.path + '/gnome-shell-extension-tool';


const ExtensionMenuItem = new Lang.Class({
    Name: 'ExtensionMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(uuid, name, state) {
	this.parent();
        if (state > 6)
            state = 0;
        let box = new St.BoxLayout();
        let label1 = new St.Label({ text: STATE[state] });
        label1.set_style(STYLE1);
        box.add_actor(label1);
        let label2 = new St.Label({ text: name });
        if (state == ENABLED)
            label2.set_style(STYLE2);
        box.add_actor(label2);
        this.actor.add_child(box);
        this._uuid = uuid;
        this._name = name;
        this._state = state;
        this._delayTimer = 0;
    },

    destroy: function() {
        if (this._delayTimer > 0)
            Mainloop.source_remove(this._delayTimer);
        this.parent();
    },

    activate: function() {
        if (this._delayTimer > 0)
            Mainloop.source_remove(this._delayTimer);
        if (this._state == ENABLED) {
	    Util.trySpawn([TOOL, '-r', this._uuid]);
            log('Reloading : ' + this._uuid);
            Notify.notify('Reloading : ',this._name);
        } else {
            Notify.notifyError('Reload not allowed. Not Enabled.',this._name);
        }
    }
});

const ReloadExtensionMenu = new Lang.Class({
    Name: 'ReloadExtensionMenu.ReloadExtensionMenu',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, 'Reload Extension Menu');
        this._sortedArray = [];
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
        this._openToggled(this.menu, false);
        this._openToggledId = this.menu.connect('open-state-changed',
            Lang.bind(this, this._openToggled));
    },

    _openToggled: function(menu, open) {
        if (open) {
            this._populateMenu();
        } else {
            this.menu.removeAll();
            let section = new PopupMenu.PopupMenuSection();
            let textBin = new St.Bin();
            textBin.child = new St.Label({
                text: ' Gnome Shell Extension Reloader ',
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER
            });
            textBin.child.set_style('font-size: 1.25em');
            section.actor.add_actor(textBin);
            this.menu.addMenuItem(section);
        }
    },

    _compare: function(a, b) {
        let aStateName = a.state.toString() + a.metadata.name.toUpperCase();
        let bStateName = b.state.toString() + b.metadata.name.toUpperCase();
        return (aStateName > bStateName) ? 0 : -1;
    },

    _populateMenu: function() {
        while (this._sortedArray.length > 0)
            this._sortedArray.pop();
        for (let i in ExtensionUtils.extensions) {
            let entry = ExtensionUtils.extensions[i];
            Util.insertSorted(this._sortedArray, entry, Lang.bind(this, function(a, b) {
                return this._compare(a, b);
            }));
        }
        for (let i in this._sortedArray) {
            let uuid = this._sortedArray[i].uuid;
            let name = this._sortedArray[i].metadata.name;
            let state = this._sortedArray[i].state;
            let item = new ExtensionMenuItem(uuid, name, state);
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
    // TOOL is not executable when installed.
    // This can be removed when TOOL is released with reload
    // option.  It is now in the GS 3.23 development stage.
    // It will be removed after GS 3.24 is in common use.
    if (!GLib.file_test(TOOL, GLib.FileTest.IS_EXECUTABLE)) {
        Util.trySpawn(['/usr/bin/chmod', '0700', TOOL]);
    }
}

function enable() {
    let mode = Main.sessionMode.currentMode;
    if (mode == 'classic' || mode == 'user')
        _timer = Mainloop.timeout_add(3000, delayedPopulateMenu);
}

function delayedPopulateMenu() {

    // Must delay until all other extensions have been loaded.
    // When gnome-shell-extension-tool with reload option is
    // released the included tool and chmod logic will not be
    // required and will be removed.
    _indicator = new ReloadExtensionMenu;
    Main.panel.addToStatusArea(INDICATOR_TAG, _indicator, 0, 'right');
    _timer = 0;
}

function disable() {
    if (_timer != 0) {
        Mainloop.source_remove(_timer);    
    }
    _indicator.destroy();
}
