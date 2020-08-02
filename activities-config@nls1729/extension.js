
/*
  Activities Configurator Gnome Shell Extension

  Copyright (c) 2012-2020 Norman L. Smith

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

const Cairo = imports.cairo;
const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const DND = imports.ui.dnd;
const Layout = imports.ui.layout;
const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Mainloop = imports.mainloop;
const Config = imports.misc.config;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;
const Colors = Me.imports.colors;
const Keys = Me.imports.keys;
const Notify = Me.imports.notify;
const Readme = Me.imports.readme;
const DEFAULT_ICO = Me.path + Keys.ICON_FILE;
const DISABLE_TOGGLE = 32767;
const MAJOR_VERSION = parseInt(Config.PACKAGE_VERSION.split('.')[0]);
const MINOR_VERSION = parseInt(Config.PACKAGE_VERSION.split('.')[1]);
const HIDE_ICON = 'width: 0; height: 0; margin-left: 0px; margin-right: 0px; ';
const GioSSS = Gio.SettingsSchemaSource;
const THEME_SCHEMA = 'org.gnome.shell.extensions.user-theme';

var ActivitiesIconButton = GObject.registerClass(
class ActivitiesIconButton extends PanelMenu.Button {

    _init() {
        super._init(0.0, null, true);
        this.container.name = 'panelActivitiesIconButtonContainer';
        this.accessible_role = Atk.Role.TOGGLE_BUTTON;
        this.name = 'panelActivitiesIconButton';
        this._iconLabelBox = new St.BoxLayout();
        this._iconBin = new St.Bin();
        this._textBin = new St.Bin();
        this._iconLabelBox.add(this._iconBin);
        this._label = new St.Label({ text: "", y_align:Clutter.ActorAlign.CENTER });
        this._textBin.child = this._label;
        this._iconLabelBox.add(this._textBin);
        this.add_actor(this._iconLabelBox);
        this.label_actor = this._label;
        this._overviewShowingSig = 0;
        this._overviewHidingSig = 0;

        this._overviewShowingSig = Main.overview.connect('showing', () => {
            this.add_style_pseudo_class('overview');
            this.add_accessible_state(Atk.StateType.CHECKED);
        });
        this._overviewHidingSig = Main.overview.connect('hiding', () => {
            this.remove_style_pseudo_class('overview');
            this.remove_accessible_state(Atk.StateType.CHECKED);
        });
        this._waylandDragOverTimedOutId = 0;
        this._xdndTimeOut = 0;
    }

    set label(labelText) {
        this._label.set_text(labelText);
    }

    get label() {
        return (this._label.get_text());
    }

    set style(textStyle) {
        this._label.set_style(textStyle);
        let ct = this._label.get_clutter_text();
        ct.set_use_markup(true);
    }


    handleDragOver(source, _actor, _x, _y, _time) {
        if (source != Main.xdndHandler)
            return DND.DragMotionResult.CONTINUE;

        if (this._xdndTimeOut != 0)
            GLib.source_remove(this._xdndTimeOut);
        this._xdndTimeOut = GLib.timeout_add(GLib.PRIORITY_DEFAULT, BUTTON_DND_ACTIVATION_TIMEOUT, () => {
            this._xdndToggleOverview();
        });
        GLib.Source.set_name_by_id(this._xdndTimeOut, '[gnome-shell] this._xdndToggleOverview');

        return DND.DragMotionResult.CONTINUE;
    }

    vfunc_captured_event(event) {
        if (event.type() == Clutter.EventType.BUTTON_PRESS && event.get_button() == 3) {
            return Clutter.EVENT_PROPAGATE;
        } else if (event.type() == Clutter.EventType.BUTTON_PRESS ||
            event.type() == Clutter.EventType.TOUCH_BEGIN) {
            if (!Main.overview.shouldToggleByCornerOrButton())
                return Clutter.EVENT_STOP;
        } else if (Meta.is_wayland_compositor() && toggleThreshold == DISABLE_TOGGLE) {
            // Handle Drag Over in Wayland when Hot Corner Disabled
            switch (event.type()) {
                case Clutter.EventType.ENTER:
                    this._motionUnHandled = true;
                    break;
                case Clutter.EventType.MOTION:
                    if (this._motionUnHandled) {
                        if(event.get_state() & Clutter.ModifierType.BUTTON1_MASK) {
                            if (this._waylandDragOverTimedOutId != 0)
                                Mainloop.source_remove(this._waylandDragOverTimedOutId);
                            this._waylandDragOverTimedOutId = Mainloop.timeout_add(500, () => {
                                if (Main.overview.shouldToggleByCornerOrButton())
                                    Main.overview.toggle();
                                this._waylandDragOverTimedOutId = 0;
                            });
                        }
                    }
                    this._motionUnHandled = false;
                    break;
                case Clutter.EventType.LEAVE:
                    if (this._waylandDragOverTimedOutId != 0) {
                        Mainloop.source_remove(this._waylandDragOverTimedOutId);
                        this._waylandDragOverTimedOutId = 0;
                    }
                    break;
            }
        }
        return Clutter.EVENT_PROPAGATE;
    }

    vfunc_event(event) {
        if (event.type() == Clutter.EventType.BUTTON_RELEASE && event.get_button() == 3) {
            let app_path = '/usr/bin/gnome-extensions-app';
            if (GLib.file_test(app_path, GLib.FileTest.EXISTS)) {
                Util.spawn([app_path]);
            } else {
                ExtensionUtils.openPrefs();
            }
            return Clutter.EVENT_PROPAGATE;
        } else if (event.type() == Clutter.EventType.TOUCH_END ||
            event.type() == Clutter.EventType.BUTTON_RELEASE) {
            if (Main.overview.shouldToggleByCornerOrButton())
                Main.overview.toggle();
        }
        return Clutter.EVENT_PROPAGATE;
    }

    vfunc_key_release_event(keyEvent) {
        let symbol = keyEvent.keyval;
        if (symbol == Clutter.KEY_Return || symbol == Clutter.KEY_space) {
            if (Main.overview.shouldToggleByCornerOrButton()) {
                Main.overview.toggle();
                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _xdndToggleOverview() {
        let [x, y] = global.get_pointer();
        let pickedActor = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x, y);

        if (pickedActor == this && Main.overview.shouldToggleByCornerOrButton())
            Main.overview.toggle();

        GLib.source_remove(this._xdndTimeOut);
        this._xdndTimeOut = 0;
        return GLib.SOURCE_REMOVE;
    }

    destroy() {
        if (this._overviewShowingSig != 0)
            Main.overview.disconnect(this._overviewShowingSig);
        if (this._overviewHidingSig != 0)
            Main.overview.disconnect(this._overviewHidingSig);
        if (this._xdndTimeOut != 0) {
            GLib.source_remove(this._xdndTimeOut);
            this._xdndTimeOut = 0;
        }
        if (this._waylandDragOverTimedOutId != 0) {
            Mainloop.source_remove(this._waylandDragOverTimedOutId);
            this._waylandDragOverTimedOutId = 0;
        }
        super.destroy();
    }
});


class Configurator {

    constructor() {
        this._enabled = false;
        let schemaSource = GioSSS.get_default();
        let schemaObj = schemaSource.lookup(THEME_SCHEMA, true);
        if (schemaObj)
            this._themeSettings = new Gio.Settings({ settings_schema: schemaObj });
        this._settings = ExtensionUtils.getSettings();
        this._firstEnable = this._settings.get_boolean(Keys.FIRST_ENABLE);
        if (this._firstEnable)
            this._settings.set_string(Keys.NEW_ICO, DEFAULT_ICO);
        this._savedText = this._settings.get_string(Keys.ORI_TXT);
        this._iconPath = '';
        this._checkConflictSignal = null;
        this._conflictCount = 0;
        this._timeoutId = 0;
        this._conflictDetection = false;
        this._panelColor = Colors.getColorRGB(this._settings.get_string(Keys.COLOURS));
        this._panelOpacity = (100 - this._settings.get_int(Keys.TRS_PAN)) / 100;
        this._roundedCornersHidden = false;
        this._transparencySig = null;
        this._colorSig = null;
        this._signalIdLC = null;
        this._signalIdRC = null;
        this._activitiesIndicator = null;
        this._signalShow = null;
        this._hotCornerThreshold = 0;
        this._signalHotCornersChanged = null;
        this._maxWinSigId1 = null;
        this._maxWinSigId2 = null;
        this._maxWinSigId3 = null;
        this._shadowString = '';
        this._showLeftSignal = null;
        this._showRightSignal = null;
        this._hideTimeoutId = 0;
        this._hideCount = 0;
        this._themeTimeoutId = 0;
        this._showOverviewNoAppsRunning = false;
        this._positionRight = this._settings.get_boolean(Keys.BTN_POSITION);
        this._appSystem = Shell.AppSystem.get_default();
        this._appStateChangedSigId = null;
        this._leftBoxActorAddedSig = null;
        // For detection of global setting or gsetting key enable-hot-corners
        this._hotCornerSettings = global.settings;
        this._keyFound = false;
        this._keyValue = false;
        this._keyChanged = false;
        this._keyChangedSig = null;
        this._panelDelayTimeout = 0;
        this._enableDelayValue = 1500;
    }

    _appStateChanged(appSystem, app) {
        if (app.state == Shell.AppState.STOPPED) {
            let windows = global.get_window_actors().filter(function(w) { return !w.metaWindow.is_skip_taskbar(); });
            if (windows.length == 0)
                this._showOverview();
        } else if ((app.state == Shell.AppState.STARTING || app.state == Shell.AppState.RUNNING) && Main.overview.visible == true) {
            Main.overview.toggle();
        }
    }

    _disconnectGlobalSignals() {
        if (this._maxWinSigId1 > 0) {
            this._wm.disconnect(this._maxWinSigId1);
            this._maxWinSigId1 = null;
        }
        if (this._maxWinSigId2 > 0) {
            this._wm.disconnect(this._maxWinSigId2);
            this._maxWinSigId2 = null;
        }
        if (this._maxWinSigId3 > 0) {
            this._screen.disconnect(this._maxWinSigId3);
            this._maxWinSigId3 = null;
        }
        if (this._panelDelayTimeout != 0) {
            Mainloop.source_remove(this._panelDelayTimeout);
            this._panelDelayTimeout = 0;
        }
    }

    _tileMaxWindowPanelEffect() {
        // The Tile Maximize Effect is enabled by default.  It supplements the
        // Window Maximized Effect by treating a tiled window on the primary monitor
        // like a maximized window.  It can be turned off if it interferes with
        // an extension which handles tiling.
        this._tileOff = this._settings.get_boolean(Keys.TILE_OFF);
        if (this._tileOff)
            this._maxUnmax();
    }

    _maxWindowPanelEffect() {
        this._maxOnPrimary = false;
        this._actionNeeded1 = true;
        this._actionNeeded2 = true;
        this._panelTransparentState = true;
        this._workspace = null;
        if (global.screen === undefined) {
            this._screen = global.display;
            this._activeWorkspaceGetter = global.workspace_manager;
            this._wm = Main.wm._shellwm;
        } else {
            this._screen = global.screen;
            this._activeWorkspaceGetter = global.screen;
            this._wm = global.window_manager;
        }
        this._maxWinEffect = this._settings.get_int(Keys.MAX_WIN_EFFECT);
        if (this._maxWinEffect > 0) {
            this._maxUnmax();
            if (MAJOR_VERSION == 3 && MINOR_VERSION < 30) {
                if (this._maxWinSigId1 == null)
                    this._maxWinSigId1 = this._wm.connect_after('hide-tile-preview', this._maxUnmax.bind(this));
                if (this._maxWinSigId2 == null)
                    this._maxWinSigId2 = this._wm.connect('size-change', this._maxUnmax.bind(this));
            } else {
                if (this._maxWinSigId1 == null)
                    this._maxWinSigId1 = this._wm.connect_after('hide-tile-preview', this._panelDelay.bind(this));
                if (this._maxWinSigId2 == null)
                    this._maxWinSigId2 = this._wm.connect('size-changed', this._maxUnmax.bind(this));
            }
            if (this._maxWinSigId3 == null)
                this._maxWinSigId3 = this._screen.connect('restacked', this._maxUnmax.bind(this));
        } else {
            this._disconnectGlobalSignals();
            this._setPanelBackground(false);
            this._setPanelTransparency();
        }
    }

    _panelDelay() {
        if (this._panelDelayTimeout == 0) {
            this._panelDelayTimeout = Mainloop.timeout_add(1000, this._panelDelayExpired.bind(this));
        }
    }

    _panelDelayExpired() {
        this._maxUnmax();
        Mainloop.source_remove(this._panelDelayTimeout);
        this._panelDelayTimeout = 0;
    }

    _maxUnmax() {
        let currentWindow;
        let leftTiled = false;
        let rightTiled = false;
        this._maxOnPrimary = false;
        let primaryMonitor = this._screen.get_primary_monitor();
        // In previous line primaryMonitor is an index.
        let top = Main.layoutManager.panelBox.get_height();
        let halfWidth = Main.layoutManager.primaryMonitor.width / 2;
        // In previous line primaryMonitor is an object.
        let workspace = this._activeWorkspaceGetter.get_active_workspace();
        if (this._workspace != workspace) {
            this._actionNeeded1 = true;
            this._actionNeeded2 = true;
            this._workspace = workspace;
        }
        let windows = workspace.list_windows();
        for (let i = 0; i < windows.length; ++i) {
            currentWindow = windows[i];
            if (currentWindow.is_hidden() || currentWindow.get_monitor() != primaryMonitor)
                continue;
            if (currentWindow.maximized_horizontally && currentWindow.maximized_vertically) {
                this._maxOnPrimary = true;
                break;
            }
            if (this._tileOff)
                continue;
            // Begin panel tile check
            let rect = currentWindow.get_frame_rect();
            if(rect.y == top && !leftTiled && rect.x == 0 && rect.width == halfWidth)
                leftTiled = true;
            if(rect.y == top && !rightTiled && rect.x == halfWidth && rect.width == halfWidth)
                rightTiled = true;
            if (leftTiled || rightTiled) {
                this._maxOnPrimary = true;
                break;
            }
            // End panel tile check
        }
        if (this._maxOnPrimary && this._actionNeeded1) {
            this._actionNeeded1 = false;
            this._actionNeeded2 = true;
            if (this._panelTransparentState) {
                this._setPanelBackground(true);
                this._panelTransparentState = false;
            }
        } else if (!this._maxOnPrimary && this._actionNeeded2) {
            this._actionNeeded1 = true;
            this._actionNeeded2 = false;
            if (!this._panelTransparentState) {
                this._setPanelBackground(false);
                this._panelTransparentState = true;
            }
        }
    }

    _setBarriersSupport(value) {
        this._settings.set_boolean(Keys.BARRIERS, value);
        if (value)
            this._hotKey = Keys.HOTC_PT; // Toggle Barrier Pressue Threshold
        else
            this._hotKey = Keys.HOTC_TO; // Toggle Delay Time Out
    }

    _connectSettings() {
        this._settingsSignals = [];
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.TILE_OFF, this._tileMaxWindowPanelEffect.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.MAX_WIN_EFFECT, this._maxWindowPanelEffect.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.REMOVED, this._setActivities.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.NEW_TXT, this._setText.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.NEW_ICO, this._setIcon.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+this._hotKey, this._setHotCornerThreshold.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.NO_HOTC, this._setHotCorner.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.NO_TEXT, this._setText.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.NO_ICON, this._setIcon.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.PAD_TXT, this._setText.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.PAD_ICO, this._setIcon.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.SCF_ICO, this._setIcon.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.CON_DET, this._setConflictDetection.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.HIDE_RC, this._setHiddenCorners.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.HIDE_APPMBI, this._setHideAppMenuButtonIcon.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.SHADOW_COLOR, this._setShadow.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.SHADOW_TRANS, this._setShadow.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.SHADOW_LEN, this._setShadow.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.SHADOW_BLUR, this._setShadow.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.SHADOW_SPRED, this._setShadow.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.SHOW_OVERVIEW, this._setShowOver.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.BTN_POSITION, this._setPositionRight.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.OVERR_THEME, this._setOverrideTheme.bind(this)));
        this._settingsSignals.push(this._settings.connect('changed::'+Keys.DISABLE_ENABLE_DELAY, this._setDisableEnableDelay.bind(this)));
        this._colorSig = this._settings.connect('changed::'+Keys.COLOURS, this._setPanelColor.bind(this));
        this._transparencySig = this._settings.connect('changed::'+Keys.TRS_PAN, this._setPanelTransparency.bind(this));
    }

    _setPositionRight() {
        this._positionRight = this._settings.get_boolean(Keys.BTN_POSITION);
        this.disable();
        this._timeoutId = Mainloop.timeout_add(1000, this._delayedEnable.bind(this));
    }

    _connectThemeContextSig() {
        this._themeContext = St.ThemeContext.get_for_stage(global.stage);
        return this._themeContext.connect('changed', this._themeChanged.bind(this));
    }

    _themeChanged() {
        if (this._themeTimeoutId != 0) {
            Mainloop.source_remove(this._themeTimeoutId);
            this._themeTimeoutId = 0;
        }
        this._themeTimeoutId = Mainloop.timeout_add(1500, this._getAndSetShellThemeId.bind(this));
    }

    _getAndSetShellThemeId() {
        let themeIdStored =  this._settings.get_string(Keys.SHELL_THEME_ID);
        let themeId;
        if (this._themeSettings === undefined) {
            themeId = '';
        } else {
            themeId = this._themeSettings.get_string('name');
        }
        let currentMode = Main.sessionMode.currentMode;
        if (themeId == '') {
            themeId = Main._getDefaultStylesheet().get_path();
            if (themeId == '') {
                themeId = Main._getDefaultStylesheet().get_uri();
            }
        }
        themeId = themeId + '<|>' + currentMode;
        if (themeId != themeIdStored) {
            this._settings.set_string(Keys.SHELL_THEME_ID, themeId);
            this._settings.set_boolean(Keys.OVERR_THEME, false);
        }
        this._setPanelRGBT();
    }

    _setPanelRGBT() {
        if (this._themeTimeoutId != 0) {
            Mainloop.source_remove(this._themeTimeoutId);
            this._themeTimeoutId = 0;
        }
        this._setPanelColor();
        this._setPanelTransparency();
    }

    _setShowOver() {
        this._showOverviewNoAppsRunning = this._settings.get_boolean(Keys.SHOW_OVERVIEW);
        if (this._showOverviewNoAppsRunning) {
            if (this._appStateChangedSigId == null) {
                this._appStateChangedSigId = this._appSystem.connect('app-state-changed', this._appStateChanged.bind(this));
            }
        } else if (this._appStateChangedSigId > 0) {
            this._appSystem.disconnect(this._appStateChangedSigId);
            this._appStateChangedSigId = null;
        }
    }

    _setOverrideTheme() {
        this._overrideTheme = this._settings.get_boolean(Keys.OVERR_THEME);
        this._setPanelRGBT();
    }

    _handleCornerSignals(connect) {
        if (connect) {
            if (this._signalIdLC == null)
                this._signalIdLC = Main.panel._leftCorner.connect('repaint', this._redoLeft.bind(this));
            if (this._signalIdRC == null)
                this._signalIdRC = Main.panel._rightCorner.connect('repaint', this._redoRight.bind(this));
        } else {
            if (this._signalIdLC > 0) {
                Main.panel._leftCorner.disconnect(this._signalIdLC);
                this._signalIdLC = null;
            }
            if (this._signalIdRC > 0) {
                Main.panel._rightCorner.disconnect(this._signalIdRC);
                this._signalIdRC = null;
            }
        }
    }

    _disconnectSignals() {
        this._disconnectGlobalSignals();
        if (this._checkConflictSignal > 0) {
            Main.panel._leftBox.disconnect(this._checkConflictSignal);
            this._checkConflictSignal = null;
        }
        while(this._settingsSignals.length > 0) {
            let sig = this._settingsSignals.pop();
            if (sig > 0)
               this._settings.disconnect(sig);
        }
        this._handleCornerSignals(false);
        if (this._signalHotCornersChanged > 0) {
            Main.layoutManager.disconnect(this._signalHotCornersChanged);
            this._signalHotCornersChanged = null;
        }
        if (this._transparencySig > 0) {
            this._settings.disconnect(this._transparencySig);
            this._transparencySig = null;
        }
        if (this._colorSig > 0) {
            this._settings.disconnect(this._colorSig);
            this._colorSig = null;
        }
        if (this._themeContextSig > 0) {
            this._themeContext.disconnect(this._themeContextSig);
            this._themeContextSig = null;
        }
        if (this._appStateChangedSigId > 0) {
            this._appSystem.disconnect(this._appStateChangedSigId);
            this._appStateChangedSigId = null;
        }
    }

    _setIcon() {
        let iconPath = this._settings.get_string(Keys.NEW_ICO);
        if (this._iconPath != iconPath) {
            if (!GLib.file_test(iconPath, GLib.FileTest.EXISTS)) {
                Main.notifyError(_("Missing Icon:"),Readme.makeTextStr(Readme.ICON_MIA));
                iconPath = DEFAULT_ICO;
                this._settings.set_string(Keys.NEW_ICO, DEFAULT_ICO);
            }
            this._activitiesIconButton._iconBin.child = new St.Icon({ gicon: Gio.icon_new_for_string(iconPath) });
            this._activitiesIconButton._iconBin.child.style_class = 'activities-icon';
            this._iconPath = iconPath;
        }
        if (this._settings.get_boolean(Keys.NO_ICON)) {
            this._activitiesIconButton._iconBin.hide();
        } else {
            let pixels = this._settings.get_int(Keys.PAD_ICO);
            let icosize = this._settings.get_double(Keys.SCF_ICO);
            let iconStyle = 'icon-size: %fem; padding-left: %dpx; padding-right: %dpx'.format(icosize, pixels, pixels);
            this._activitiesIconButton._iconBin.hide();
            this._activitiesIconButton._iconBin.child.set_style(iconStyle);
            this._activitiesIconButton._iconBin.show();
        }
    }

    _setText() {
        let labelText = this._settings.get_string(Keys.NEW_TXT) || this._savedText;
        if (this._settings.get_boolean(Keys.NO_TEXT))
            labelText = '';
        this._activitiesIconButton.label = labelText;
        if (labelText != '') {
            let pixels = this._settings.get_int(Keys.PAD_TXT);
            let textStyle = 'padding-left: %dpx; padding-right: %dpx'.format(pixels, pixels);
            this._activitiesIconButton.style = textStyle;
        }
    }

    _monitorsChanged() {

        this._setHotCorner();
    }

    _hotCornersChanged() {

        this._savedToggleOverview = [];
        for(let i = 0; i < Main.layoutManager.hotCorners.length; i++) {
            if (Main.layoutManager.hotCorners[i] != null) {
                if (!this._barriersSupported) {

                    this._savedToggleOverview[i] = Main.layoutManager.hotCorners[i]._toggleOverview;
                    Main.layoutManager.hotCorners[i]._toggleOverview = _overviewToggler;
                }
            }
        }
        this._handleBarrierSupport();
    }

    _handleBarrierSupport() {
        if (this._barriersSupported) {
           for(let i = 0; i < Main.layoutManager.hotCorners.length; i++) {
               if (Main.layoutManager.hotCorners[i] != null)
                   Main.layoutManager.hotCorners[i]._pressureBarrier._threshold = toggleThreshold;
           }
        }
    }

    _setHotCornerThreshold() {
        this._activitiesIconButton._hotCornerThreshold = this._settings.get_int(this._hotKey);
        this._setHotCorner();
    }

    _setHotCorner() {
        if (this._settings.get_boolean(Keys.NO_HOTC))
            toggleThreshold = DISABLE_TOGGLE;
        else
            toggleThreshold = this._activitiesIconButton._hotCornerThreshold;
        this._hotCornersChanged();
    }

    // Changed disabled Hot Corner behavior for DND to be the same as if Hot Corner is enabled.
    // Dragging an item into the Hot Corner will toggle the Overview when the Hot Corner is disabled.
    // _dragBegin and _dragEnd are are functional in Xorg session.
    // Wayland is handled in vfunc_captured_event of ActivitiesIconButton.

    _dragEnd() {
        if (this._settings.get_boolean(Keys.NO_HOTC)) {
            toggleThreshold = DISABLE_TOGGLE;
        } else {
            toggleThreshold = this._activitiesIconButton._hotCornerThreshold;
        }
        if (this._barriersSupported)
            this._handleBarrierSupport();
    }

    _dragBegin() {
        toggleThreshold = 50;
        if (this._barriersSupported)
            this._handleBarrierSupport();
    }

    _setActivities() {
        let indicator = Main.panel.statusArea['activities-icon-button'];
        if (indicator != null) {
            if (this._settings.get_boolean(Keys.REMOVED)) {
                indicator.container.hide();
            } else {
                indicator.container.show();
            }
        }
    }

    _setPanelStyle(backgroundStyle) {
        Main.panel.set_style(backgroundStyle);
    }

    _removePanelStyle() {
        Main.panel.set_style(null);
        if (this._roundedCornersHidden) {
            Main.panel._leftCorner.hide();
            Main.panel._rightCorner.hide();
        } else {
            Main.panel._leftCorner.show();
            Main.panel._rightCorner.show();
        }
    }

    _setPanelColor() {
        this._panelColor = Colors.getColorRGB(this._settings.get_string(Keys.COLOURS));
        this._setPanelBackground(false);
    }

    _setPanelTransparency() {
        this._panelOpacity = (100 - this._settings.get_int(Keys.TRS_PAN)) / 100;
        this._setPanelBackground(false);
    }

    _setHiddenCorners() {
        this._roundedCornersHidden = this._settings.get_boolean(Keys.HIDE_RC);
        if (this._roundedCornersHidden) {
            if (this._showLeftSignal == null)
                this._showLeftSignal = Main.panel._leftCorner.connect('show', this._reHideCorners.bind(this));
            if (this._showRightSignal == null)
                this._showRightSignal = Main.panel._rightCorner.connect('show', this._reHideCorners.bind(this));
        } else {
            if (this._showLeftSignal > 0) {
                Main.panel._leftCorner.disconnect(this._showLeftSignal);
                this._showLeftSignal = null;
            }
            if (this._showRightSignal > 0) {
                Main.panel._rightCorner.disconnect(this._showRightSignal);
                this._showRightSignal = null;
            }
            this._hideCount = 0;
        }
        this._setPanelBackground(false);
    }

    // An extension can show rounded hidden corners in conflict with this extension.  The normal
    // case is to optionally hide corners and re-show them when the extension is disabled or the
    // preference to hide is changed. The following rehide logic works around the conflict. In the
    //  unlikely event another extension catches the hide signal and re-shows the corners, a message
    //  and warning is displayed..

    _reHideCorners() {
        if (this._hideTimeoutId == 0)
            this._hideTimeoutId = Mainloop.timeout_add(1000, this._doReHideCorners.bind(this));
    }

    _doReHideCorners() {
        if (this._hideTimeoutId > 0) {
            Mainloop.source_remove(this._hideTimeoutId);
            this._hideTimeoutId = 0;
        }
        if ((Main.panel._leftCorner.visible || Main.panel._rightCorner.visible) && this._roundedCornersHidden) {
            Main.panel._leftCorner.hide();
            Main.panel._rightCorner.hide();
            this._hideCount = this._hideCount + 1;
        }
        if (this._hideCount > 2000) { // This should never happen.
            let msg = Me.uuid + ': ' + _("Conflict with hidden rounded corners.");
            Main.notifyError(_("Conflict Detected:"), msg);
            this._hideCount = -2000;
        }
    }

    _setShadow() {
        let length = this._settings.get_int(Keys.SHADOW_LEN);
        if (length == 0) {
            this._shadowString = '';
        } else {
            length = length.toString();
            let color = Colors.getColorStringCSS(Colors.getColorRGB(this._settings.get_string(Keys.SHADOW_COLOR)));
            let opacity = ((100 - this._settings.get_int(Keys.SHADOW_TRANS)) / 100).toString();
            let blur = this._settings.get_int(Keys.SHADOW_BLUR).toString();
            let spread = this._settings.get_int(Keys.SHADOW_SPRED).toString();
            this._shadowString =  ' box-shadow: 0px ' + length + 'px ' + blur + 'px ' + spread + 'px rgba(' + color + ',' + opacity + ');';
        }
        this._setPanelBackground(false);
    }

    _setPanelBackground(dynamicOpaquePanel) {
        if (this._transparencySig > 0) {
            this._settings.disconnect(this._transparencySig);
            this._transparencySig = null;
        }
        if (this._colorSig > 0) {
            this._settings.disconnect(this._colorSig);
            this._colorSig = null;
        }
        if (Main.getThemeStylesheet() != null || Main.sessionMode.currentMode == 'classic') {
            this._userOrClassicTheme = true;
            let themeNode = Main.panel.get_theme_node();
            let color = themeNode.get_background_color().to_string();
            let rgbT = Colors.getColorRGBandTransparency(color);
            this._themeRGB = rgbT.rgb;
        } else {
            this._userOrClassicTheme = false;
        }
        let colorString = Colors.getColorStringCSS(this._panelColor);
        this._panelOpacity = (100 - this._settings.get_int(Keys.TRS_PAN)) / 100;
        let backgroundStyle = '';
        let shadowString = this._shadowString;
        if (dynamicOpaquePanel) {
            shadowString = '';
            if (this._maxWinEffect == 2) {
                colorString = '0,0,0';
            }
            if (this._maxWinEffect == 1) {
                if (this._userOrClassicTheme && !this._overrideTheme) {
                    colorString = this._themeRGB;
                }
            }
            this._panelOpacity = 1.0;
        }
        this._removePanelStyle();
        backgroundStyle = 'background-color: rgba(' + colorString + ',' + this._panelOpacity.toString() + ');';
        backgroundStyle = backgroundStyle + shadowString;
        if (!this._overrideTheme && this._userOrClassicTheme) {
            backgroundStyle = '';
        }
        if (backgroundStyle != '') {
            this._setPanelStyle(backgroundStyle);
        }
        if (this._panelOpacity < .05 || this._roundedCornersHidden) {
            Main.panel._leftCorner.hide();
            Main.panel._rightCorner.hide();
        } else {
            Main.panel._leftCorner.show();
            Main.panel._rightCorner.show();
        }
        if (this._transparencySig == null) {
            this._transparencySig = this._settings.connect('changed::'+Keys.TRS_PAN, this._setPanelTransparency.bind(this));
        }
        if (this._colorSig == null) {
            this._colorSig = this._settings.connect('changed::'+Keys.COLOURS, this._setPanelColor.bind(this));
        }
        if (Main.panel.get_style() == null || !Main.panel._leftCorner.visible) {
            this._handleCornerSignals(false);
        } else {
            this._handleCornerSignals(true);
        }
        if (!this._roundedCornersHidden) {
            Main.panel._leftCorner.queue_repaint();
            Main.panel._rightCorner.queue_repaint();
        }
    }

    _redoLeft() {
        this._repaintPanelCorner(Main.panel._leftCorner);
    }

    _redoRight() {
        this._repaintPanelCorner(Main.panel._rightCorner);
    }

    _repaintPanelCorner(corner) {
        let panelBackgroundColor = Colors.getClutterColor(this._panelColor, this._panelOpacity);
        let node = corner.get_theme_node();
        let cornerRadius = node.get_length('-panel-corner-radius');
        let borderWidth = node.get_length('-panel-corner-border-width');
        let borderColor = node.get_color('-panel-corner-border-color');
        let overlap = borderColor.alpha != 0;
        let offsetY = overlap ? 0 : borderWidth;
        let cr = corner.get_context();
        cr.setOperator(Cairo.Operator.SOURCE);
        cr.moveTo(0, offsetY);
        if (corner._side == St.Side.LEFT)
            cr.arc(cornerRadius, borderWidth + cornerRadius, cornerRadius, Math.PI, 3 * Math.PI / 2);
        else
            cr.arc(0, borderWidth + cornerRadius, cornerRadius, 3 * Math.PI / 2, 2 * Math.PI);
        cr.lineTo(cornerRadius, offsetY);
        cr.closePath();
        let savedPath = cr.copyPath();
        let xOffsetDirection = corner._side == St.Side.LEFT ? -1 : 1;
        let over = Panel._over(borderColor, panelBackgroundColor);
        Clutter.cairo_set_source_color(cr, over);
        cr.fill();
        if (overlap) {
            let offset = borderWidth;
            Clutter.cairo_set_source_color(cr, panelBackgroundColor);
            cr.save();
            cr.translate(xOffsetDirection * offset, - offset);
            cr.appendPath(savedPath);
            cr.fill();
            cr.restore();
        }
        cr.$dispose();
        return true;
    }

    _setConflictDetection() {
        this._conflictDetection = this._settings.get_boolean(Keys.CON_DET);
        if (this._conflictDetection && this._enabled)
            this._conflicts();
        if (this._conflictDetection && this._checkConflictSignal == null)
            this._checkConflictSignal = Main.panel._leftBox.connect('actor-added', this._conflicts.bind(this));
        if (!this._conflictDetection && this._checkConflictSignal > 0) {
            Main.panel._leftBox.disconnect(this._checkConflictSignal);
            this._checkConflictSignal = null;
        }
    }

    destroy() {
        this._activitiesIconButton.destroy();
        this._activitiesIconButton = null;
    }

/*  Conflict Resolution:

    This extension's ActivitiesIconButton prefers to occupy the Activities position (the leftmost) in the Panel.
    At session startup this extension delays its enable processing for 500ms to insure that it can insert itself
    in the left panel at position 0.  This solves most conflicts.  If another extension inserts an indicator in
    position 0 at a later time then the ActivitiesIconButton can be moved from its preferred place. To re-establish
    its position this function is called when an 'actor-added' signal occurs.  A race condition can occur if another
    extension follows this strategy.  This extension will stop the race if one is detected.  If the user does not
    care about the position of the ActivitiesIconButton, conflict detection can be disabled.  Conflict Detection is
    only effective when ActivitiesIconButton is in the left position.  If the button is set to the right corner
    detection is disabled.
*/
    _conflicts() {
        if ((Main.sessionMode.currentMode == 'user' || Main.sessionMode.currentMode == 'classic') && !this._positionRight) {
            if (Main.panel._leftBox.get_first_child().name != 'panelActivitiesIconButtonContainer') {
                this._conflictCount = this._conflictCount + 1;
                if (this._conflictCount > 30) {
                    Main.notifyError(_("Conflict Detected:"),Readme.makeTextStr(Readme.CONFLICTS));
                    this._conflictCount = 0;
                    this.disable();
                } else {
                    this.disable();
                    this._timeoutId = Mainloop.timeout_add(1000, this._delayedEnable.bind(this));
                }
            }
        }
    }

/*
    StatusTitleBar@devpower.org conflicts with this extension.  The following redo and related code for the
    Hide Application Menu Button Icon option resolves the conflict.
*/

    _leftBoxActorAdded() {
        if (this._hideAppMenuButtonIcon) {
            if (Main.panel.statusArea.appMenu._iconBox.get_style() != HIDE_ICON) {
                Main.panel.statusArea.appMenu._iconBox.set_style(HIDE_ICON);
            }
        }
    }

    _setHideAppMenuButtonIcon() {
        this._hideAppMenuButtonIcon = this._settings.get_boolean(Keys.HIDE_APPMBI);
        if (!this._hideAppMenuButtonIcon) {
            if (Main.panel.statusArea.appMenu._iconBox.get_style() == HIDE_ICON) {
                Main.panel.statusArea.appMenu._iconBox.set_style(null);
            }
        } else {
            this._leftBoxActorAdded();
        }
    }

    _showOverview() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        let workspace = this._activeWorkspaceGetter.get_active_workspace();
        let windows = workspace.list_windows();
        if (!Main.overview.visible && windows.length == 0)
            Main.overview.toggle();
    }

    _enableHotCornersChanged() {
        if (!this._hotCornerSettings.get_boolean('enable-hot-corners')) {
            Main.notifyError(Readme.TITLE,Readme.makeTextStr(Readme.DISABLED_HOT_CORNER));
        }
    }

    _delayedEnable() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        let verboseNotify = Notify.getVerboseNotify();
        if (this._keyChanged && typeof Main.layoutManager.hotCorners[0] != 'undefined') {
            if(!this._settings.get_boolean(Keys.NO_HOTC)) {
                this._settings.set_boolean(Keys.NO_HOTC, true);
            }
            let title = Readme.makeTextStr(Readme.TITLE);
            let message = Readme.makeTextStr(Readme.NO_HOT_CORNERS_CHANGED);
            let close = Readme.makeTextStr(Readme.CLOSE);
            verboseNotify._notify(title, message, close);
        }
        if (typeof Main.layoutManager.hotCorners[0] == 'undefined') {
            let title = Readme.makeTextStr(Readme.TITLE);
            let message;
            if (this._keyFound)
                message = Readme.makeTextStr(Readme.NO_HOT_CORNERS_UNHANDLED_KEY_FOUND);
            else
                message = Readme.makeTextStr(Readme.NO_HOT_CORNERS_CONFLICT);
            let close = Readme.makeTextStr(Readme.CLOSE);
            verboseNotify._notify(title, message, close);
            return;
        }
        if (this._keyFound)
            this._keyChangedSig = this._hotCornerSettings.connect('changed::enable-hot-corners', this._enableHotCornersChanged.bind(this));
        this._savedBarrierThreshold = Main.layoutManager.hotCorners[Main.layoutManager.primaryIndex]._pressureBarrier._threshold;
        this._barriersSupported = global.display.supports_extended_barriers();
        this._setBarriersSupport(this._barriersSupported);
        this._activitiesIconButton = new ActivitiesIconButton();
        this._activitiesIndicator = Main.panel.statusArea['activities'];
        if (this._activitiesIndicator != null) {
            this._signalShow = this._activitiesIndicator.container.connect('show', () => {
                this._activitiesIndicator = Main.panel.statusArea['activities'];
                if (this._activitiesIndicator != null)
                    this._activitiesIndicator.container.hide();
            });
            this._activitiesIndicator.container.hide();
        }
        this._overrideTheme = this._settings.get_boolean(Keys.OVERR_THEME);
        this._connectSettings();
        this._iconPath = '';
        this._setIcon();
        this._setHotCornerThreshold();
        this._setHiddenCorners();
        this._setPanelBackground(false);
        this._setShadow();
        let side = 'left';
        let position = 0;
        if (this._positionRight) {
             position = -1;
             side = 'right';
        }
        Main.panel.addToStatusArea('activities-icon-button', this._activitiesIconButton, position, side);
        Main.panel._leftCorner.setStyleParent(Main.panel._leftBox);
        this._setActivities();
        this._setConflictDetection();
        if (Main.sessionMode.currentMode == 'user') {
            this._leftBoxActorAddedSig = Main.panel._leftBox.connect('actor-added', () => {
                this._leftBoxActorAdded();
            });
            this._setHideAppMenuButtonIcon();
            this._setHotCorner();
            this._signalHotCornersChanged = Main.layoutManager.connect_after('hot-corners-changed', this._hotCornersChanged.bind(this));
            this._signalMonitorsChanged = Main.layoutManager.connect_after('monitors-changed', this._monitorsChanged.bind(this));
        }

        if (!Meta.is_wayland_compositor()) {
            this._dndHandlerBeginSig = Main.xdndHandler.connect('drag-begin', this._dragBegin.bind(this));
            this._dndHandlerEndSig = Main.xdndHandler.connect('drag-end', this._dragEnd.bind(this));
        }

        this._themeContextSig = this._connectThemeContextSig();
        this._getAndSetShellThemeId();
        this._setShowOver();
        if ((Main.sessionMode.currentMode == 'classic' || Main.sessionMode.currentMode == 'user') && this._showOverviewNoAppsRunning)
            this._timeoutId = Mainloop.timeout_add(1000, this._showOverview.bind(this));
        this._maxWindowPanelEffect();
        this._setText();
        this._enabled = true;
        log('Activities Configurator Enabled');
    }

    _getHotCornerState() {
        // Ubuntu 17.10 until 19.10
        this._keyFound = false;
        this._keyValue = false;
        this._keyChanged = false;
        let keys = this._hotCornerSettings.list_keys();
        let i;
        for (i in keys) {
            if (keys[i] == 'enable-hot-corners') {
                this._keyFound = true;
                this._keyValue = this._hotCornerSettings.get_boolean('enable-hot-corners');
                if (!this._keyValue)
                    this._keyChanged = this._hotCornerSettings.set_boolean('enable-hot-corners', true);
                break;
            }
        }
        if (this._keyFound)
            return;
        // Ubuntu 19.10 until ???
        this._hotCornerSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
        keys = this._hotCornerSettings.list_keys();
        for (i in keys) {
            if (keys[i] == 'enable-hot-corners') {
                this._keyFound = true;
                this._keyValue = this._hotCornerSettings.get_boolean('enable-hot-corners');
                if (!this._keyValue)
                    this._keyChanged = this._hotCornerSettings.set_boolean('enable-hot-corners', true);
                break;
            }
        }
    }

    _setDisableEnableDelay() {
        if (this._settings.get_boolean(Keys.DISABLE_ENABLE_DELAY)) {
            this._enableDelayValue = 5;
        } else {
            this._enableDelayValue = 1500;
        }
    }

    enable() {
        // For extension to function in classic mode
        // Conflict Detection must be enabled.
        if (Main.sessionMode.currentMode == 'classic')
            this._settings.set_boolean(Keys.CON_DET, true);
        // Extension must delay completion of enable to allow theme to be
        // loaded and for Conflict Detection to function if it is enabled.
        this._getHotCornerState();
        this._timeoutId = Mainloop.timeout_add(this._enableDelayValue, this._delayedEnable.bind(this));
    }

    disable() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        if (this._hideTimeoutId != 0) {
            Mainloop.source_remove(this._hideTimeoutId);
            this._hideTimeoutId = 0;
        }
        if (this._themeTimeoutId != 0) {
            Mainloop.source_remove(this._themeTimeoutId);
            this._themeTimeoutId = 0;
        }
        if (this._keyChangedSig > 0) {
            this._hotCornerSettings.disconnect(this._keyChangedSig);
            this._keyChangedSig = null;
        }
        this._panelAppMenuButtonIconHidden = false;
        if (this._enabled) {
            if (this._showLeftSignal > 0) {
                Main.panel._leftCorner.disconnect(this._showLeftSignal);
                this._showLeftSignal = null;
            }
            if (this._showRightSignal > 0) {
                Main.panel._rightCorner.disconnect(this._showRightSignal);
                this._showRightSignal = null;
            }
            if (this._leftBoxActorAddedSig > 0) {
                Main.panel._leftBox.disconnect(this._leftBoxActorAddedSig);
                this._leftBoxActorAddedSig = null;
            }
            if (Main.panel.statusArea.appMenu._iconBox.get_style() == HIDE_ICON) {
                Main.panel.statusArea.appMenu._iconBox.set_style(null);
            }
            if (!Meta.is_wayland_compositor()) {
                if (this._dndHandlerBeginSig > 0) {
                    Main.xdndHandler.disconnect(this._dndHandlerBeginSig);
                    this._dndHandlerBeginSig = null;
                }
                if (this._dndHandlerEndSig > 0) {
                    Main.xdndHandler.disconnect(this._dndHandlerEndSig);
                    this._dndHandlerEndSig = null;
                }
            }
            this._disconnectSignals();
            for(let i = 0; i < Main.layoutManager.hotCorners.length; i++) {
                if (Main.layoutManager.hotCorners[i] != null) {
                    Main.layoutManager.hotCorners[i]._pressureBarrier._threshold = this._savedBarrierThreshold;
                    if (!this._barriersSupported)
                        Main.layoutManager.hotCorners[i]._toggleOverview = this._savedToggleOverview[i];
                }
            }
            this._removePanelStyle();
            this._activitiesIndicator = Main.panel.statusArea['activities'];
            if (this._activitiesIndicator != null) {
                if (this._signalShow > 0)
                    this._activitiesIndicator.container.disconnect(this._signalShow);
                if (Main.sessionMode.currentMode == 'user')
                    this._activitiesIndicator.container.show();
            }
            this._activitiesIconButton.destroy();
            this._activitiesIconButton = null;
            this._enabled = false;
            log('Activities Configurator Disabled');
        }
    }
};

let toggleThreshold = 0;

function _overviewToggler() {

    if (this._monitor.inFullscreen)
        return;

    if (Main.overview.shouldToggleByCornerOrButton()) {
        if (toggleThreshold != DISABLE_TOGGLE) {
            if (toggleThreshold > 0) {
                Mainloop.timeout_add(toggleThreshold, () => {
                    if (this._entered) {
                        this._rippleAnimation();
                        Main.overview.toggle();
                    }
                });
            } else {
                this._rippleAnimation();
                Main.overview.toggle();
            }
        }
    }
}

function init(metadata) {
    ExtensionUtils.initTranslations();
    return new Configurator();
}
