
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


const ByteArray = imports.byteArray;
const Gio = imports.gi.Gio;
const Gvc = imports.gi.Gvc;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Mainloop = imports.mainloop;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Notify = Me.imports.notify;
const DOMAIN = Me.metadata['gettext-domain'];
const _ = imports.gettext.domain(DOMAIN).gettext;

// Import correct class non-GObject or GObject - a kingdom for an ifdef!
// Future: Get rid of hoop jumping when most distros are on GS 3.32 or later.
// Begin hoopydup
const Config = imports.misc.config;
const MAJOR_VERSION = parseInt(Config.PACKAGE_VERSION.split('.')[0]);
const MINOR_VERSION = parseInt(Config.PACKAGE_VERSION.split('.')[1]);
const EXTENSION_VERSION = Me.metadata['version'].toString();
const FORCE = Me.imports.force.getForce(); // only true when installing from zip.
var settings;

function setSettings() {
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
    settings = new Gio.Settings({ settings_schema: schemaObj });
}

setSettings();

function setCorrectImport() {

    let minorVersion = settings.get_int('minor-version');
    let extensionVersion = settings.get_string('extension-version');
    if (minorVersion != MINOR_VERSION || extensionVersion != EXTENSION_VERSION || FORCE) {
        try {
            let contents, output = Gio.file_new_for_path(Me.path + '/correctClass.js');
            if (MAJOR_VERSION == 3 && MINOR_VERSION < 32) {
                contents = 'const Me = imports.misc.extensionUtils.getCurrentExtension();\n' +
                           'var DoNotDisturbButton = Me.imports.dndBtn;\n';
            } else {
                contents = 'const Me = imports.misc.extensionUtils.getCurrentExtension();\n' +
                           'var DoNotDisturbButton = Me.imports.dndBtnGObject;\n';
            }
            let array = ByteArray.fromString(contents);
            output.replace_contents(array, null, false, Gio.FileCreateFlags.NONE, null);
            if (FORCE) {
                output = Gio.file_new_for_path(Me.path + '/force.js');
                contents = 'function getForce() { return false; };\n'
                array = ByteArray.fromString(contents);
                output.replace_contents(array, null, false, Gio.FileCreateFlags.NONE, null);
            }
            settings.set_int('minor-version', MINOR_VERSION);
            settings.set_string('extension-version', EXTENSION_VERSION);
            log('donotdistrub-button@nls1729 updated correctClass.js.');
        } catch (e) {
            log('donotdistrub-button@nls1729 failed to correctly set import.');
            throw e;
        }
    }
}

setCorrectImport();

const CorrectClass = Me.imports.correctClass;
// End hoopydup


class DoNotDisturbExtension {

    constructor() {
        this._btn = null;
        this._timeoutId = 0;
        this._settings = settings;
        if (!this._settings.get_boolean('time-out-always')) {
            this._settings.set_boolean('time-out-enabled', false);
        }
        this._leftChangedSig = 0;
        this._centerChangedSig = 0;
        this._overrideAllowed = true;
        this._mixerCtrl = null;
        this._StateChangedSig = 0;
        this._outputSink = null;
        this._busyStateChangedSig = 0;
        this._timeoutMuteId = 0;
    }

    _disableEnable() {
        this.disable();
        this.enable();
    }

    destroy() {
        if (this._btn != null) {
            this._btn.destroy();
            this._btn = null;
        }
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

    _setMute() {
        let busyState = this._settings.get_boolean('busy-state');
        let mute = this._settings.get_boolean('mute-busy');
        let unmute = this._settings.get_boolean('unmute-available');
        if (this._outputSink) {
            if (mute == busyState || (unmute != busyState && !busyState))
                this._outputSink.change_is_muted(busyState);
        }
    }

    _muteControlEnable() {
        //MUTE on Busy state - to eliminate all notification sounds must mute default sound stream.
        let aggMenu = Main.panel.statusArea.aggregateMenu;
        if (aggMenu.hasOwnProperty('_volume') && aggMenu._volume instanceof PanelMenu.SystemIndicator) {
            this._mixerCtrl = new Gvc.MixerControl({ name: 'Default Output Sound StrEam' });
            this._StateChangedSig = this._mixerCtrl.connect('state-changed',  () => {
                if (this._mixerCtrl.get_state() == Gvc.MixerControlState.READY) {
                    this._outputSink = this._mixerCtrl.get_default_sink();
                    this._setMute();
                }
            });
            this._mixerCtrlSinkChangedSig = this._mixerCtrl.connect('default-sink-changed', () => {
                this._outputSink = this._mixerCtrl.get_default_sink();
                this._setMute();
            });
            this._mixerCtrl.open();
            this._busyStateChangedSig = this._settings.connect('changed::busy-state', this._setMute.bind(this));
        }
    }

    _muteControlDisable() {
        if (this._mixerCtrl !== null) {
            if (this._outputSink !== null)
                this._outputSink.change_is_muted(true);
            if (this._StateChangedSig > 0) {
                this._mixerCtrl.disconnect(this._StateChangedSig);
                this._StateChangedSig = 0;
            }
            if (this._mixerCtrlSinkChangedSig > 0) {
                this._mixerCtrl.disconnect(this._mixerCtrlSinkChangedSig);
                this._mixerCtrlSinkChangedSig= 0;
            }
            this._mixerCtrl.close();
            this._mixerCtrl = null;
        }
        if (this._outputSink !== null) {
            this._outputSink = null;
        }
    }

    _delayedEnable() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        this._btn = CorrectClass.DoNotDisturbButton.newDoNotDisturbButton(this._settings, this._overrideAllowed);
        this._overrideAllowed = false;
        let position = this._getPosition();
        Main.panel.addToStatusArea('DoNotDistrub', this._btn, position[0], position[1]);
        this._btn._setNotEmptyCount();
        this._leftChangedSig = this._settings.connect('changed::panel-icon-left', this._disableEnable.bind(this));
        this._centerChangedSig = this._settings.connect('changed::panel-icon-center', this._disableEnable.bind(this));
        this._iconResetSig = this._settings.connect('changed::reset-icon', this._disableEnable.bind(this));
        this._muteControlEnable();
        this._timeoutMuteId = Mainloop.timeout_add(16000, this._setMute.bind(this));
        log('donotdistrub-button@nls1729 extension enabled.');
    }

    enable() {
        this._timeoutId = Mainloop.timeout_add(1500, this._delayedEnable.bind(this));
    }

    disable() {
        if (this._timeoutMuteId != 0) {
            Mainloop.source_remove(this._timeoutMuteId);
            this._timeoutMuteId = 0;
        }
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        if (this._leftChangedSig > 0) {
            this._settings.disconnect(this._leftChangedSig);
            this._leftChangedSig = 0;
        }
        if (this._centerChangedSig > 0) {
            this._settings.disconnect(this._centerChangedSig);
            this._centerChangedSig = 0;
        }
        if (this._iconResetSig > 0) {
            this._settings.disconnect(this._iconResetSig);
            this._iconResetSig = 0;
        }
        if (this._btn != null) {
            this._btn.destroy();
            this._btn = null;
        }
        this._muteControlDisable();
    }
};

function init(metadata) {
    return new DoNotDisturbExtension();
}
