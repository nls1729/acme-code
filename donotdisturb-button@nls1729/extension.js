
/*
  Do Not Disturb Button Gnome Shell Extension

  Copyright (c) 2015-2016 Norman L. Smith

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

const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const GnomeSession = imports.misc.gnomeSession;
const Mainloop = imports.mainloop;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const BUSY = Me.path + '/available-no.png'
const AVAILABLE = Me.path + '/available-yes.png'
const SHORTCUT = 'shortcut';

const DoNotDisturbButton = new Lang.Class({
    Name: 'DoNotDisturbButton',
    Extends: PanelMenu.Button,

    _init: function(settings, overrideAllowed) {
        this.parent(0.5, null, true);
        this._settings = settings;
        this._iconBusy = new St.Icon({ gicon: Gio.icon_new_for_string(BUSY) });
        this._iconAvailable = new St.Icon({ gicon: Gio.icon_new_for_string(AVAILABLE) });
        let iconStyle = 'icon-size: 1.2em; padding-left: 2px; padding-right: 2px';
        this._iconBusy.set_style(iconStyle);
        this._iconAvailable.set_style(iconStyle);
        this._notEmptyCount = new St.Label({ text: '', y_align: Clutter.ActorAlign.CENTER });
        this._layoutBox = new St.BoxLayout();
        this._layoutBox.add_actor(this._iconAvailable);
        this._layoutBox.add_actor(this._iconBusy);
        this._layoutBox.add_actor(this._notEmptyCount);
        this.actor.add_actor(this._layoutBox);
        this._btnReleaseSig = this.actor.connect_after('button-release-event', Lang.bind(this, this._onButtonRelease));
        this._keyReleaseSig = this.actor.connect_after('key-release-event', Lang.bind(this, this._onKeyRelease));
        this._presence = new GnomeSession.Presence(Lang.bind(this, function(proxy, error) {
            this._onStatusChanged(proxy.status);
        }));
        this._statusChangedSig = this._presence.connectSignal('StatusChanged', Lang.bind(this, function(proxy, senderName, [status]) {
            this._onStatusChanged(status);
        }));
        this._changedSettingsSig = this._settings.connect("changed::shortcut", Lang.bind(this, function() {
            this._removeKeybinding();
            this._addKeybinding();
        }));
        this._showCountChangedSig = this._settings.connect('changed::panel-count-show', Lang.bind(this, function() {
            this._showCount = this._settings.get_boolean('panel-count-show');
            this._setNotEmptyCount();
        }));
        this._list = Main.panel.statusArea.dateMenu._messageList._notificationSection._list;
        this._listActorAddedSig = this._list.connect('actor-added', Lang.bind(this, this._setNotEmptyCount));
        this._listActorRemovedSig = this._list.connect('actor-removed', Lang.bind(this, this._setNotEmptyCount));
        this._addKeybinding();
        this._showCount = this._settings.get_boolean('panel-count-show');
        this._indicatorActor = Main.panel.statusArea['dateMenu']._indicator.actor;
        this._indicatorSources = Main.panel.statusArea['dateMenu']._indicator._sources;
        this._timeoutId = Mainloop.timeout_add(30000, Lang.bind(this, this._findUnseenNotifications));

        //Set user preferred BUSY state at login
        let override = this._settings.get_boolean('override');
        if (override && overrideAllowed) {
            // Do not use last set persistent busy state instead use user preference for override
            let overrideBusyState = this._settings.get_boolean('overrride-busy-state');
            this._toggle = overrideBusyState;
        } else {
            // Use last set persistent busy state
            this._toggle = this._settings.get_boolean('busy-state'); // Set user preferred BUSY state at login.
        }
        this._togglePresence();
        this._toggle = this._settings.get_boolean('busy-state'); // Set user preferred BUSY state at login.
    },

    _findUnseenNotifications: function() {
        if (!this._indicatorActor.visible) {
            let count = 0;
            this._indicatorSources.forEach(Lang.bind(this, function(source) {
                count += source.unseenCount;
            }));
            if (count > 0)
                this._indicatorActor.visible = true;
            }
        return true;
    },

    _setNotEmptyCount: function() {
        let count = this._list.get_n_children();
        // hide count if no notifications are available or the user doesn't want to see it
        if (count < 1 || !this._showCount)
            this._notEmptyCount.set_text('');
        else
            this._notEmptyCount.set_text(count.toString());
    },

    _onStatusChanged: function(status) {
        this._iconAvailable.hide();
        this._iconBusy.hide();
        this._status = status;
        if (status == GnomeSession.PresenceStatus.BUSY) {
            this._toggle = false;
            this._iconBusy.show();
            this._settings.set_boolean('busy-state', true);
        } else {
            this._toggle = true;
            this._iconAvailable.show();
            this._settings.set_boolean('busy-state', false)
        }
    },

    _onButtonRelease: function(actor, event) {
        this._togglePresence();
        return Clutter.EVENT_STOP;
    },

    _onKeyRelease: function(actor, event) {
        let symbol = event.get_key_symbol();
        if (symbol == Clutter.KEY_Return || symbol == Clutter.KEY_space) {
            this._togglePresence();
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    },

    _togglePresence: function() {
        if (this._toggle) {
            this._updatePresense(false);
        } else {
            this._updatePresense(true);
        }
        this._toggle = !this._toggle;
    },

    _updatePresense: function(state) {
        let status = state ? GnomeSession.PresenceStatus.AVAILABLE : GnomeSession.PresenceStatus.BUSY;
        this._presence.SetStatusRemote(status);
    },

    _removeKeybinding: function() {
        Main.wm.removeKeybinding(SHORTCUT);
    },

    _addKeybinding: function() {
        Main.wm.addKeybinding(SHORTCUT, this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, Lang.bind(this, this._togglePresence));
    },

    destroy: function() {
        Mainloop.source_remove(this._timeoutId);
        this._settings.disconnect(this._showCountChangedSig);
        this._removeKeybinding();
        this.actor.disconnect(this._btnReleaseSig);
        this.actor.disconnect(this._keyReleaseSig);
        this._settings.disconnect(this._changedSettingsSig);
        this._list.disconnect(this._listActorAddedSig);
        this._list.disconnect(this._listActorRemovedSig);
        this.actor.get_children().forEach(function(c) { c.destroy(); });
        this.parent();
    }

});

const DoNotDisturbExtension = new Lang.Class({
    Name: 'DoNotDisturbExtension',

    _init: function() {
        this._btn = null;
        this._timeoutId = 0;
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
        this._leftChangedSig = 0;
        this._centerChangedSig = 0;
        this._overrideAllowed = true;
    },

    _positionChange: function() {
        this.disable();
        this.enable();
    },

    destroy: function() {
        if (this._btn != null) {
            this._btn.destroy();
            this._btn = null;
        }
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
        this._btn = new DoNotDisturbButton(this._settings, this._overrideAllowed);
        this._overrideAllowed = false;
        let position = this._getPosition();
        Main.panel.addToStatusArea('DoNotDistrub', this._btn, position[0], position[1]);
        this._btn._setNotEmptyCount();
        this._leftChangedSig = this._settings.connect('changed::panel-icon-left', Lang.bind(this, this._positionChange));
        this._centerChangedSig = this._settings.connect('changed::panel-icon-center', Lang.bind(this, this._positionChange));
    },

    enable: function() {
        this._timeoutId = Mainloop.timeout_add(1000, Lang.bind(this, this._delayedEnable));
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
    return new DoNotDisturbExtension();
}
