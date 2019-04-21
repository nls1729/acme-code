
/*
  Do Not Disturb Button Gnome Shell Extension

  Copyright (c) 2015-2019 Norman L. Smith

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

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const GnomeSession = imports.misc.gnomeSession;
const Mainloop = imports.mainloop;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Notify = Me.imports.notify;
const Util = imports.misc.util;
const DOMAIN = Me.metadata['gettext-domain'];
const _ = imports.gettext.domain(DOMAIN).gettext;
const BUSY_PATH = Me.path + '/busy-notifications-symbolic.svg'
const AVAILABLE_PATH = Me.path + '/available-notifications-symbolic.svg'
const SHORTCUT = 'shortcut';


class DoNotDisturbButton extends PanelMenu.Button {

    constructor(settings, overrideAllowed) {
        super(0.5, null, true);
        this._settings = settings;
        this._setIcons();
        let iconStyle = 'icon-size: 1.3em; padding-left: 2px; padding-right: 2px';
        this._iconBusy.set_style(iconStyle);
        this._iconAvailable.set_style(iconStyle);
        this._notEmptyCount = new St.Label({ text: '', y_align: Clutter.ActorAlign.CENTER });
        this._timeoutActiveIndicator = new St.Label({ text: '', y_align: Clutter.ActorAlign.CENTER });
        this._timeoutActive = false;
        this._layoutBox = new St.BoxLayout();
        this._layoutBox.add_actor(this._iconAvailable);
        this._layoutBox.add_actor(this._iconBusy);
        this._layoutBox.add_actor(this._timeoutActiveIndicator);
        this._layoutBox.add_actor(this._notEmptyCount);
        this.actor.add_actor(this._layoutBox);
        this._touchEventSig = this.actor.connect('touch-event', this._onButtonPress.bind(this));
        this._btnPressSig = this.actor.connect_after('button-press-event', this._onButtonPress.bind(this));
        this._keyPressSig = this.actor.connect_after('key-press-event', this._onKeyPress.bind(this));
        this._statusBusy = false;
        this._presence = new GnomeSession.Presence((proxy, error) => {
            this._onStatusChanged(proxy.status);
        });
        this._statusChangedSig = this._presence.connectSignal('StatusChanged', (proxy, senderName, [status]) => {
            this._onStatusChanged(status);
        });
        this._changedSettingsSig = this._settings.connect('changed::shortcut', () => {
            this._removeKeybinding();
            this._addKeybinding();
        });
        this._showCountChangedSig = this._settings.connect('changed::panel-count-show', () => {
            this._showCount = this._settings.get_boolean('panel-count-show');
            this._setNotEmptyCount();
        });
        this._timeoutProcessed = false;
        this._timeoutInterval = 0;
        this._timeoutAlways = false;
        this._timeoutEnabled = false;
        this._timeoutEnabledChanged();
        this._timeoutEnabledChangedSig = this._settings.connect('changed::time-out-enabled', this._timeoutEnabledChanged.bind(this));
        this._list = Main.panel.statusArea.dateMenu._messageList._notificationSection._list;
        this._listActorAddedSig = this._list.connect('actor-added', this._setNotEmptyCount.bind(this));
        this._listActorRemovedSig = this._list.connect('actor-removed', this._setNotEmptyCount.bind(this));
        this._addKeybinding();
        this._showCount = this._settings.get_boolean('panel-count-show');
        this._indicatorActor = Main.panel.statusArea['dateMenu']._indicator.actor;
        this._indicatorSources = Main.panel.statusArea['dateMenu']._indicator._sources;
        this._timeoutId = Mainloop.timeout_add(30000, this._findUnseenNotifications.bind(this));
        this._checkTimeoutId = Mainloop.timeout_add(15000, this._checkTimeout.bind(this));


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

    }

    _timeoutEnabledChanged() {
        this._timeoutAlways = this._settings.get_boolean('time-out-always');
        this._timeoutEnabled = this._settings.get_boolean('time-out-enabled');
        if (!this._timeoutActive && this._timeoutEnabled && this._statusBusy) {
            this._processTimeout(false);
        } else if (!this._timeoutEnabled && this._timeoutActive) {
            this._processTimeout(false);
        }
    }

    _setIcons() {
        let available = this._settings.get_string('available-icon');
        if (!GLib.file_test(available, GLib.FileTest.EXISTS))
           available  = 'default';
        if (available == 'default')
            available = AVAILABLE_PATH;
        this._iconAvailable = new St.Icon({ gicon: Gio.icon_new_for_string(available) });
        let busy = this._settings.get_string('busy-icon');
        if (!GLib.file_test(busy, GLib.FileTest.EXISTS))
            busy  = 'default';
        if (busy == 'default')
            busy = BUSY_PATH;
        this._iconBusy = new St.Icon({ gicon: Gio.icon_new_for_string(busy) });
    }

    _findUnseenNotifications() {
        if (!this._indicatorActor.visible) {
            let count = 0;
            this._indicatorSources.forEach((source) => {
                count += source.unseenCount;
            });
            if (count > 0)
                this._indicatorActor.visible = true;
        }
        return true;
    }

    _checkTimeout() {
        this._processTimeout(true);
        return true;
    }

    _processTimeout(timeout) {
        if (this._timeoutProcessed & !this._statusBusy) {
            this._timeoutProcessed = false;
            Notify.notify(_("Timeout Once"),_("Busy State Timeout expired. Timeout disabled."));
            this._settings.set_boolean('time-out-enabled', false);
            return;
        }
        if (timeout) {
            if (!this._statusBusy)
                return;
            if (!this._timeoutEnabled || this._timeoutProcessed)
                return;
            this._timeoutInterval--;
            if (this._timeoutInterval < 0) {
                if (!this._timeoutAlways)
                    this._timeoutProcessed = true;
                this._togglePresence();
                return;
            }
        } else { //handle status change
            this._timeoutInterval = this._settings.get_int('time-out-interval') * 4;
            if (this._timeoutEnabled && this._statusBusy) {
                this._timeoutActiveIndicator.set_text("\u23F3");
                this._timeoutActive = true;
            } else {
                this._timeoutActiveIndicator.set_text('');
                this._timeoutActive = false;
            }
        }
    }

    _setNotEmptyCount() {
        let count = this._list.get_n_children();
        // hide count if no notifications are available or the user doesn't want to see it
        if (count < 1 || !this._showCount)
            this._notEmptyCount.set_text('');
        else
            this._notEmptyCount.set_text(count.toString());
    }

    _onStatusChanged(status) {
        this._iconAvailable.hide();
        this._iconBusy.hide();
        if (status == GnomeSession.PresenceStatus.BUSY) {
            this._statusBusy = true;
            this._iconBusy.show();
        } else {
            this._statusBusy = false;
            this._iconAvailable.show();
        }
        this._toggle = !this._statusBusy;
        this._settings.set_boolean('busy-state', this._statusBusy);
        this._processTimeout(false);
    }

    _onButtonPress(actor, event) {
        let type = event.type();
        let pressed = type == Clutter.EventType.BUTTON_PRESS;
        if (!pressed && type == Clutter.EventType.TOUCH_BEGIN) {
            this._togglePresence();
            return Clutter.EVENT_STOP;
        }
        let button = pressed ? event.get_button() : -1;
        if (button == -1) {
            return Clutter.EVENT_PROPAGATE;
        }
        if (button == 1) {
            this._togglePresence();
        } else if (button == 3) {
            Util.spawn(["gnome-shell-extension-prefs", Me.uuid]);
        }
        return Clutter.EVENT_STOP;
    }

    _onKeyPress(actor, event) {
        let symbol = event.get_key_symbol();
        if (symbol == Clutter.KEY_Return || symbol == Clutter.KEY_space) {
            this._togglePresence();
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _togglePresence() {
        if (this._toggle) {
            this._updatePresense(false);
        } else {
            this._updatePresense(true);
        }
        this._toggle = !this._toggle;
    }

    _updatePresense(state) {
        this._status = state ? GnomeSession.PresenceStatus.AVAILABLE : GnomeSession.PresenceStatus.BUSY;
        this._presence.SetStatusRemote(this._status);
    }

    _removeKeybinding() {
        Main.wm.removeKeybinding(SHORTCUT);
    }

    _addKeybinding() {
        Main.wm.addKeybinding(SHORTCUT, this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, this._togglePresence.bind(this));
    }

    destroy() {
        Mainloop.source_remove(this._timeoutId);
        Mainloop.source_remove(this._checkTimeoutId);
        this._settings.disconnect(this._showCountChangedSig);
        this._removeKeybinding();
        this.actor.disconnect(this._touchEventSig);
        this.actor.disconnect(this._btnPressSig);
        this.actor.disconnect(this._keyPressSig);
        this._settings.disconnect(this._changedSettingsSig);
        this._settings.disconnect(this._timeoutEnabledChangedSig);
        this._list.disconnect(this._listActorAddedSig);
        this._list.disconnect(this._listActorRemovedSig);
        this.actor.get_children().forEach(function(c) { c.destroy(); });
        super.destroy();
    }
};


function newDoNotDisturbButton(settings, overrideAllowed) {
    return new DoNotDisturbButton(settings, overrideAllowed);
}

