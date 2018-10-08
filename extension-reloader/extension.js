/*
  Gnome Shell Extension Reloader

  Copyright (c) 2016-2018 Norman L. Smith

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
  The extension to be reloaded must be in the error state to reload.
  It is common practice to restart the Shell during extension testing
  to reload the extension to test changes made to the extension's code.
  Wayland does not allow restart of the Shell. To reload an extension
  not in the error state under Wayland a logout and a login is required.

*/


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
const ENABLED_EXTENSIONS_KEY = 'enabled-extensions';
const MAX_HEIGHT = parseInt(global.screen_height * 0.5).toString();
const ROLE = 'extension-reloader-indicator';
const STATE = ["Unknown",
               "Enabled",
               "Disabled",
               "Error",
               "Out of Date",
               "Downloading",
               "Initialized"
              ];
const STYLE1 = 'width: 120px;';
const STYLE2 = 'font-weight: bold;';
const TYPE = { info: 0,
               warning: 1,
               error: 2
             };


class SubMenuItem extends PopupMenu.PopupBaseMenuItem {
        
    constructor(extension, name, menu, subMenu) {
        super();
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
    }

    destroy() {
        this.actor.disconnect(this._keyInId);
        super.destroy();
    }

    activate() {
        this._menu.close();
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
    }
};


class ReloadExtensionMenu extends PanelMenu.Button {

    constructor() {
        super(0.5, 'Reload Extension Menu');
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
        this._openToggledId = this.menu.connect('open-state-changed', this._openToggled.bind(this));
    }

    _openToggled(menu, open) {
        if (open) {
            this._subMenuMenuItem.menu.removeAll();
            this._populateSubMenu(this._subMenuMenuItem.menu);
            this._subMenuMenuItem.menu.open();
        }
    }

    _scrollMenuBox(actor) {
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
    }

    _compare(a, b) {
        let aKey = a.state.toString() + a.metadata.name.toUpperCase();
        let bKey = b.state.toString() + b.metadata.name.toUpperCase();
        return (aKey > bKey) ? 0 : -1;
    }

    _populateSubMenu(subMenu) {
        let sortedArray = [];
        for (let i in ExtensionUtils.extensions) {
            let entry = ExtensionUtils.extensions[i];
            Util.insertSorted(sortedArray, entry, (a, b) => {
                return this._compare(a, b);
            });
        }
        for (let i in sortedArray) {
            let uuid = sortedArray[i].uuid;
            let name = sortedArray[i].metadata.name;
            let state = sortedArray[i].state;
            let ext = sortedArray[i];
            let item = new SubMenuItem(ext, name, this.menu, subMenu);
            item._keyInId = item.actor.connect('key-focus-in', this._scrollMenuBox.bind(this));
            subMenu.addMenuItem(item);
        }
        this.menu.actor.style = ('max-height:' + MAX_HEIGHT + 'px');
    }

    destroy() {
        this.menu.disconnect(this._openToggledId);
        this._subMenuMenuItem.menu.removeAll();
        this.menu.removeAll();
        super.destroy();
    }
};


class ExtensionReloaderExtension {

    constructor() {
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
    }

    _positionChange() {
        this.disable();
        this._delayedEnable();
    }

    _getPosition() {
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
    }

    _delayedEnable() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        this._btn = new ReloadExtensionMenu();
        let position = this._getPosition();
        Main.panel.addToStatusArea(ROLE, this._btn, position[0], position[1]);
        this._leftChangedSig = this._settings.connect('changed::panel-icon-left', this._positionChange.bind(this));
        this._centerChangedSig = this._settings.connect('changed::panel-icon-center', this._positionChange.bind(this));
    }

    destroy() {
        if (this._btn != null) {
            this._btn.destroy();
            this._btn = null;
        }
    }

    enable() {
        if (Main.sessionMode.currentMode == 'ubuntu' ||  Main.sessionMode.currentMode == 'user' || Main.sessionMode.currentMode == 'classic') {
            this._timeoutId = Mainloop.timeout_add(3000, this._delayedEnable.bind(this));
        }
    }

    disable() {
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
};

function init(metadata) {
    imports.gettext.bindtextdomain(DOMAIN, Me.path + "/locale");
    return new ExtensionReloaderExtension();
}
