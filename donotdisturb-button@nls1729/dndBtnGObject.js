
/*
  Do Not Disturb Button Gnome Shell Extension

  Copyright (c) 2015-2020 Norman L. Smith

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
const GObject = imports.gi.GObject;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const GnomeSession = imports.misc.gnomeSession;
const Mainloop = imports.mainloop;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Util = imports.misc.util;
const DOMAIN = Me.metadata['gettext-domain'];
const _ = imports.gettext.domain(DOMAIN).gettext;
const BUSY_PATH = Me.path + '/busy-notifications-symbolic.svg'
const AVAILABLE_PATH = Me.path + '/available-notifications-symbolic.svg'
const SHORTCUT = 'shortcut';


var DoNotDisturbButton = GObject.registerClass (
class DoNotDisturbButton extends PanelMenu.Button {

    _init(settings) {
        super._init(0.5, null, true);
        this._settings = settings;
        this._timeoutActive = false;
        this._timeOutIndicators = [];
        this._unseenTimeoutId = 0;
        this._checkTimeoutId = 0;
        this._timeoutProcessed = false;
        this._timeoutInterval = 0;
        this._statusChangedSig = 0;
        this._touchEventSig = 0;
        this._btnPressSig = 0;
        this._keyPressSig = 0;
        this._changedSettingsSig = 0;
        this._timeoutEnabledChangedSig = 0;
        this._showCountChangedSig = 0;
        this._listActorAddedSig = 0;
        this._listActorRemovedSig = 0;
        this._statusBusy = false;
        this._layoutBox = new St.BoxLayout();
        this._notEmptyCount = new St.Label({ text: '', y_align: Clutter.ActorAlign.CENTER });
        this._list = Main.panel.statusArea.dateMenu._messageList._notificationSection._list;
        this._timeoutEnabled = this._settings.get_boolean('time-out-enabled');
        this._indicatorSources = Main.panel.statusArea['dateMenu']._indicator._sources;
        this._indicatorActor = Main.panel.statusArea['dateMenu']._indicator;
        this._showCount = this._settings.get_boolean('panel-count-show');
        this._setIcons();
        this._populateTmeOutIndicators();
        this._setLayoutBox();
        this.timeStart = 0;


        this._presence = new GnomeSession.Presence((proxy, error) => {
            this._onStatusChanged(proxy.status);
        });

        this._statusChangedSig = this._presence.connectSignal('StatusChanged', (proxy, senderName, [status]) => {
            this._onStatusChanged(status);
        });

        this._touchEventSig = this.connect('touch-event', (actor, event) => {
            this._onButtonPress(actor, event);
        });

        this._btnPressSig = this.connect_after('button-press-event', (actor, event) => {
            this._onButtonPress(actor, event);
        });

        this._keyPressSig = this.connect_after('key-press-event', (actor, event) => {
            this._onKeyPress(actor, event);
        });

        this._changedSettingsSig = this._settings.connect('changed::shortcut', () => {
            this._removeKeybinding();
            this._addKeybinding();
        });

        this._timeoutEnabledChangedSig = this._settings.connect('changed::time-out-enabled',  () => {
            this._timeoutEnabled = this._settings.get_boolean('time-out-enabled');
        });

        this._showCountChangedSig = this._settings.connect('changed::panel-count-show', () => {
            this._showCount = this._settings.get_boolean('panel-count-show');
            this._setNotEmptyCount();
        });

        this._listActorAddedSig = this._list.connect('actor-added', () => {
            this._setNotEmptyCount();
        });

        this._listActorRemovedSig = this._list.connect('actor-removed', () => {
            this._setNotEmptyCount();
        });

        this._addKeybinding();
    }

    _setIcons() {

        let available = this._settings.get_string('available-icon');
        let busy = this._settings.get_string('busy-icon');
        let iconStyle = 'icon-size: 1.3em; padding-left: 2px; padding-right: 2px';

        if (!GLib.file_test(available, GLib.FileTest.EXISTS))
            available  = 'default';
        if (available == 'default')
            available = AVAILABLE_PATH;
        if (!GLib.file_test(busy, GLib.FileTest.EXISTS))
            busy  = 'default';
        if (busy == 'default')
            busy = BUSY_PATH;
        this._iconAvailable = new St.Icon({ gicon: Gio.icon_new_for_string(available) });
        this._iconBusy = new St.Icon({ gicon: Gio.icon_new_for_string(busy) });
        this._iconBusy.set_style(iconStyle);
        this._iconAvailable.set_style(iconStyle);
    }

    _populateTmeOutIndicators() {
        let i = 0;
        let markupBegin = '<span foreground="white"><big>';
        let markupEnd = '</big></span>';
        this._timeOutSymbol = [ ' \uD83D\uDD5B', ' \uD83D\uDD52', ' \uD83D\uDD55', ' \uD83D\uDD58' ];

        while ( i < 4 ) {
            let ind = new St.Label({ text: markupBegin + this._timeOutSymbol[i] + markupEnd , y_align: Clutter.ActorAlign.CENTER });
            let ct = ind.get_clutter_text();

            ct.set_use_markup(true);
            this._timeOutIndicators.push(ind);
            i++;
        }
    }

    _setLayoutBox() {
        let i = 0;

        this._layoutBox.add_actor(this._iconAvailable);
        this._layoutBox.add_actor(this._iconBusy);
        while ( i < 4 ) {
            this._layoutBox.add_actor(this._timeOutIndicators[i++]);
        }
        this._layoutBox.add_actor(this._notEmptyCount);
        this.add_actor(this._layoutBox)
    }

    _startClock() {
        this._timeOutIndicators[0].show();
        this._timeOutIndicators[1].hide();
        this._timeOutIndicators[2].hide();
        this._timeOutIndicators[3].hide();
    }

    _advanceClock() {
        let i = 0;
        while (i < 3) {
            if (this._timeOutIndicators[i].visible) {
                this._timeOutIndicators[i++].hide();
                this._timeOutIndicators[i].show();
                return;
            }
            i++;
        }
        this._timeOutIndicators[3].hide();
        this._timeOutIndicators[0].show();
    }

    _stopClock() {
        let i = 0;
        while (i < 4)
        this._timeOutIndicators[i++].hide();
    }

    _timeoutEnabledChanged() {
        this._timeoutEnabled = this._settings.get_boolean('time-out-enabled');
    }


    _findUnseenNotifications() {
        if (!this._indicatorActor.visible) {
            let count = 0;
            this._indicatorSources.forEach((source) => {
                count += source.unseenCount;
            });
            if (count > 0 && !this._indicatorActor.visible)
                this._indicatorActor.visible = true;
        }
        return true;
    }

    _checkTimeout() {
        if(this._timeoutActive) {
            this._processActiveTimeout()
        }
        return true;
    }

    _startTimeout() {
        this._startClock();
        this._timeoutInterval = this._settings.get_int('time-out-interval') * 4;
        this._timeoutActive = true;
        this.timeStart = Date.now();
    }

    _processActiveTimeout() {
        this._timeoutInterval--;
        this._advanceClock();
        if (this._timeoutInterval < 0)
            this._endTimeout();
        }
     }

     _endTimeout() {
        this._stopClock();
        this._timeoutActive = false;
        this._togglePresence();
        //log("DONOT elasped time " + (Date.now() - this.timeStart)/1000)
     }

    _setNotEmptyCount() {
        let count = this._list.get_n_children();
        if (count < 1 || !this._showCount)
            this._notEmptyCount.set_text('');
        else
            this._notEmptyCount.set_text(' ' + count.toString());
    }

    _onStatusChanged(status) {
        this._iconAvailable.hide();
        this._iconBusy.hide();
        this._stopClock();
        if (status == GnomeSession.PresenceStatus.BUSY) {
            this._statusBusy = true;
            this._iconBusy.show();
            if (this._timeoutEnabled)
                this._startTimeout();
        } else {
            this._statusBusy = false;
            this._timeoutActive = false;
            this._iconAvailable.show();
        }
        this._toggle = !this._statusBusy;
        this._settings.set_boolean('busy-state', this._statusBusy);;
    }

    _onButtonPress(actor, event) {
        let type = event.type();
        let pressed = type == Clutter.EventType.BUTTON_PRESS;
        let button = pressed ? event.get_button() : -1;

        if (!pressed && type == Clutter.EventType.TOUCH_BEGIN) {
            this._togglePresence();
            return Clutter.EVENT_STOP;
        }
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

    _startUp() {
        this._unseenTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30000, this._findUnseenNotifications.bind(this));
        this._checkTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 15000, this._checkTimeout.bind(this));
        this._settings.set_boolean('busy-state', this._settings.get_boolean('override'));
        this._toggle = this._settings.get_boolean('busy-state');
        this._togglePresence();
    }

    _disconnectSignal(signalId, theConnected) {
        if (signalId != 0)
            theConnected.disconnect(signalId);
    }

    destroy() {
    if (this._unseenTimeoutId != 0) {
        GLib.source_remove(this._unseenTimeoutId);
        this._unseenTimeoutId = 0;
    };
    if (this._checkTimeoutId != 0) {
        GLib.source_remove(this._checkTimeoutId);
        this._checkTimeoutId = 0;
    }
    this._disconnectSignal(this._touchEventSig, this);
    this._disconnectSignal(this._btnPressSig, this);
    this._disconnectSignal(this._keyPressSig, this);
    this._disconnectSignal(this._changedSettingsSig, this._settings);
    this._disconnectSignal(this._timeoutEnabledChangedSig, this._settings);
    this._disconnectSignal(this._showCountChangedSig, this._settings);
    this._disconnectSignal(this._listActorAddedSig, this._list);
    this._disconnectSignal(this._listActorRemovedSig, this._list);
    this._removeKeybinding();
        this.get_children().forEach(function(c) { c.destroy(); });
        super.destroy();
    }
});

function newDoNotDisturbButton(settings) {
    return new DoNotDisturbButton(settings);
}

