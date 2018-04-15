/*
  Gnome Shell Extension Reloader

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
  along with this extension. If not, see
  < https://www.gnu.org/licenses/old-licenses/gpl-2.0.html >.

  This extension is a derived work of the Gnome Shell.

  This extension is intended for use by Gnome Shell Extension writers.
  It is common practice to restart the Shell during extension testing
  to reload the extension to test changes made to the extension's code.
  Wayland does not allow restart of the Shell. To reload an extension
  under Wayland a logout and a login is required. The extension reloads
  only the selected extension with two mouse clicks saving time for the
  extension writer.

*/


const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const ExtensionSystem = imports.ui.extensionSystem;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;
const Me = ExtensionUtils.getCurrentExtension();
const Notify = Me.imports.notify;
const DOMAIN = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(DOMAIN);
const _ = Gettext.gettext;
const ENABLED = 1;
const ICON = [ 'dialog-information-symbolic',
               'dialog-warning-symbolic',
               'dialog-error-symbolic'
             ];
const MAX_HEIGHT = parseInt(global.screen_height * 0.5).toString();
const ROLE = 'extension-reloader-indicator';
const STATE = [_("Unknown"),
               _("Enabled"),
               _("Disabled"),
               _("Error"),
               _("Out of Date"),
               _("Downloading"),
               _("Initialized")
              ];
const STYLE1 = 'width: 120px;';
const STYLE2 = 'font-weight: bold;';
const TYPE = { info: 0,
               warning: 1,
               error: 2
             };

const SubMenuItem = new Lang.Class({
    Name: 'ReloadExtension.SubMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(extension, name, menu, subMenu) {
	this.parent();
        this._extension = extension;
        this._state = extension.state;
        this._uuid = extension.uuid;
        this._name = name;
        if (this._state > 6)
            this._state = 0;
        let box = new St.BoxLayout();
        let label1 = new St.Label({ text: _(STATE[this._state]) });
        label1.set_style(STYLE1);
        box.add_actor(label1);
        let label2 = new St.Label({ text: name });
        if (this._state == ENABLED)
            label2.set_style(STYLE2);
        box.add_actor(label2);
        this.actor.add_child(box);
        this._subMenu = subMenu;
        this._menu = menu;
        this._keyInId = 0;
    },

    destroy: function() {
        this.actor.disconnect(this._keyInId);
        this.parent();
    },

    activate: function() {
        let enabledExtensions = global.settings.get_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY);
        if (enabledExtensions.indexOf(this._uuid) == -1) {
            enabledExtensions.push(this._uuid);
            global.settings.set_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY, enabledExtensions);
        }
        try {
            ExtensionSystem.reloadExtension(this._extension);
            Notify.notify(_("Reloading completed"), this._name, TYPE.info);
            log("Reloading completed" + ' : ' + this._name + ' : ' + this._uuid);
        } catch(e) {
            Notify.notify(_("Error reloading") + ' : ' + this._name, e.message + ' : ' + this._uuid, TYPE.error);
        }
        this._subMenu.close();
        this._menu.close();
    }
});

const ReloadExtensionMenu = new Lang.Class({
    Name: 'ReloadExtension.ReloadExtensionMenu',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.5, 'Reload Extension Menu');
        let hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        let iconBin = new St.Bin();
        iconBin.child = new St.Icon({
            icon_name: 'emblem-synchronizing-symbolic',
            style_class: 'system-status-icon'
        });
        hbox.add_child(iconBin);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_actor(hbox);
        let title = _("Gnome Shell Extension Reloader");
        this._subMenuMenuItem = new PopupMenu.PopupSubMenuMenuItem(title, false);
        this.menu.addMenuItem(this._subMenuMenuItem);
        this._scrollView = this._subMenuMenuItem.menu.actor;
        this._vBar = this._subMenuMenuItem.menu.actor.get_vscroll_bar();
        this._vBar.vscrollbar_policy = true;
        this._populateSubMenu(this._subMenuMenuItem.menu);
        this._openToggledId = this.menu.connect('open-state-changed', Lang.bind(this, this._openToggled));
    },

    _openToggled: function(menu, open) {
        if (open) {
            this._subMenuMenuItem.menu.removeAll();
            this._populateSubMenu(this._subMenuMenuItem.menu);
            this._subMenuMenuItem.menu.open();
        }
    },

    _scrollMenuBox: function(actor) {
        let box = actor.get_allocation_box();
        let currentValue = this._vBar.get_adjustment().get_value();
        let newValue = currentValue;
        let delta = Math.ceil((box.y2 - box.y1) * .25);
        if (currentValue > (box.y1 - delta))
            newValue = box.y1 - delta;
        if ((this._scrollView.height + currentValue) < (box.y2 + delta))
            newValue = box.y2 - this._scrollView.height + delta;
        if (newValue != currentValue)
            this._vBar.get_adjustment().set_value(newValue);
    },

    _compare: function(a, b) {
        let aKey = a.state.toString() + a.metadata.name.toUpperCase();
        let bKey = b.state.toString() + b.metadata.name.toUpperCase();
        return (aKey > bKey) ? 0 : -1;
    },

    _populateSubMenu: function(subMenu) {
        let sortedArray = [];
        for (let i in ExtensionUtils.extensions) {
            let entry = ExtensionUtils.extensions[i];
            Util.insertSorted(sortedArray, entry, Lang.bind(this, function(a, b) {
                return this._compare(a, b);
            }));
        }
        for (let i in sortedArray) {
            let uuid = sortedArray[i].uuid;
            let name = sortedArray[i].metadata.name;
            let state = sortedArray[i].state;
            let ext = sortedArray[i];
            let item = new SubMenuItem(ext, name, this.menu, subMenu);
            item._keyInId = item.actor.connect('key-focus-in', Lang.bind(this, this._scrollMenuBox));
            subMenu.addMenuItem(item);
        }
        this.menu.actor.style = ('max-height:' + MAX_HEIGHT + 'px');
    },

    destroy: function() {
        this.menu.disconnect(this._openToggledId);
        this._subMenuMenuItem.menu.removeAll();
        this.menu.removeAll();
        this.parent();
    }
});

const ExtensionReloaderExtension = new Lang.Class({
    Name: 'ReloadExtension.ExtensionReloaderExtension',

    _init: function() {
        this._btn = null;
        this._timeoutId = 0;
        let GioSSS = Gio.SettingsSchemaSource;
        let schema = Me.metadata['settings-schema'];
        let schemaDir = Me.dir.get_child('schemas').get_path();
        let schemaSrc = GioSSS.new_from_directory(schemaDir, GioSSS.get_default(), false);
        let schemaObj = schemaSrc.lookup(schema, true);
        this._settings = new Gio.Settings({ settings_schema: schemaObj });
        this._leftChangedSig = 0;
        this._centerChangedSig = 0;
    },

    _positionChange: function() {
        this.disable();
        this._delayedEnable();
    },

    _getPosition: function() {
        let center = this._settings.get_boolean('panel-icon-center');
        let left = this._settings.get_boolean('panel-icon-left');
        let position;
        if (center) {
            if (left)
                position = [0, 'center'];
            else
                position = [-1, 'center'];
        } else {
            if (left)
                position = [-1, 'left'];
            else
                position = [0, 'right'];
        }
        return position;
    },

    _delayedEnable: function() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        this._btn = new ReloadExtensionMenu();
        let position = this._getPosition();
        Main.panel.addToStatusArea(ROLE, this._btn, position[0], position[1]);
        this._leftChangedSig = this._settings.connect('changed::panel-icon-left', Lang.bind(this, this._positionChange));
        this._centerChangedSig = this._settings.connect('changed::panel-icon-center', Lang.bind(this, this._positionChange));
    },

    destroy: function() {
        if (this._btn != null) {
            this._btn.destroy();
            this._btn = null;
        }
    },

    enable: function() {
        if (Main.sessionMode.currentMode == 'ubuntu' ||  Main.sessionMode.currentMode == 'user' || Main.sessionMode.currentMode == 'classic') {
            this._timeoutId = Mainloop.timeout_add(3000, Lang.bind(this, this._delayedEnable));
        }
    },

    disable: function() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        if (this._btn != null) {
            this._btn.destroy();
            this._btn = null;
        }
        if (this._leftChangedSig > 0) {
            this._settings.disconnect(this._leftChangedSig);
            this._leftChangedSig = 0;
        }
        if (this._centerChangedSig > 0) {
            this._settings.disconnect(this._centerChangedSig);
            this._centerChangedSig = 0;
        }
    }
});

function init(metadata) {
    imports.gettext.bindtextdomain(DOMAIN, Me.path + "/locale");
    return new ExtensionReloaderExtension();
}
