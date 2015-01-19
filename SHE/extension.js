
/*
  Copyright (C) 2015 Norman L. Smith

  This file is part of the Start Here Extension SHE@nls1729.

  The extension is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public Licenseas published by the Free
  Software Foundation; either version 2 of the License, or (at your option)
  any later version.  The extension is distributed in the hope it will be
  useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
  Public License for more details.  You should have received a copy of the
  GNU General Public License along with the extension.

  If not, see <http://www.gnu.org/licenses/>.

  This extension is a derived work of the Gnome Shell.
*/

const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GMenu = imports.gi.GMenu;
const Gtk = imports.gi.Gtk;
const Pango = imports.gi.Pango;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ByteArray = imports.byteArray;
const Gettext = imports.gettext;
const Lang = imports.lang;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const Signals = imports.signals;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const _ = Gettext.domain(Me.metadata['gettext-domain']).gettext;
const LangPostfixer = Me.imports.langpostfixer;
const Notify = Me.imports.notifications.notify;
const shellAppSystem = Shell.AppSystem.get_default();
const BG_FMT = '-arrow-border-radius: 8px; -arrow-background-color: %s';
const DEE = Me.path + '/dee.js';
const DIRECTORY_INDEX = GLib.get_user_data_dir() + '/start_here_launchers/Directory_Index_lldir';
const EXTENDED_FORMAT_STR = 'X-NLS1729-SHE-Directory';
const LOCAL_APPS_PATH = GLib.get_user_data_dir() + '/applications';
const NOTIFY = Me.imports.notifications.ICON;
const START_HERE = 'Start_Here_she_lldir/';
const TOP_DIR = GLib.get_user_data_dir() + '/start_here_launchers/';

const BUTTON_TYPE = {
    TopRow:      0,
    Directory:   1,
    Link:        2,
    Application: 3
};

const MODE = {
    Launch:           1,
    Edit:             2,
    Delete:           3,
    Applications:     4,
    CopyInProgress:   5,
    ChooseDirectory:  6,
    DeleteInProgress: 7,
    ChangeDirectory:  8,
    Deleted:          9,
    Copied:          10
};

const MODES = [
    '',
    _("Launch"),
    _("Edit"),
    _("Delete"),
    _("Applications"),
    _("Copy in progress"),
    _("Choose Directory"),
    _("Delete in progress"),
    _("Changing directory"),
    _("Delete completed"),
    _("Copy completed")
];

const GRID = {
    Rows:         4,
    Columns:      7,
    ButtonHeight: 115
};

const RESPONSE = {
    Enter:     0,
    Delete:    1,
    Insert:    2,
    Secondary: 3
};

const TOP_ROW_COMMENTS = [
    _("Return to Previous or") + ' Start Here',
    _("Set mode to Launch"),
    _("Set mode to Edit"),
    _("Set mode to Delete"),
    _("Load System Applications"),
    _("Create New Button"),
    _("Directory Index")
];

const HELP = [
    [_("Primary Mouse or Backspace returns to previous menu."),
     _("Secondary Mouse or Home clears history to ") + ' Start Here.'
    ],

    [_(""),
     _("To open selected Menu:"),
     _("To open selected Link:"),
     _("To launch selected Application:"),
     _("Primary Mouse, Enter, Return or Space Bar.")
    ],

    [_("To launch the Desktop Entry Editor for selected button:"),
     _("Primary Mouse, Enter, Return or Space Bar.")
    ],

    [_("To delete the selected Button:"),
     _("Secondary Mouse or Delete Key.")
    ],

    [_("Launch Application with Primary Mouse, Enter, Return or Space Bar."),
     _("Copy selected Button to Current Menu with Secondary Mouse or Insert Key.")
    ]
];

const ICON = {
    default_icon:  Me.path + '/etc/start-here-symbolic.svg',
    launch_icon:   Me.path + '/etc/system-run-symbolic.svg',
    edit_icon:     Me.path + '/etc/text-editor-symbolic.svg',
    delete_icon:   Me.path + '/etc/user-trash-symbolic.svg',
    apps_icon:     Me.path + '/etc/view-grid-symbolic.svg',
    create_icon:   Me.path + '/etc/list-add-symbolic.svg',
    directory:     Me.path + '/etc/folder-symbolic.svg',
    symbolic_link: Me.path + '/etc/emblem-symbolic-link.svg'
};

const ExtensionPanelButton = new Lang.Class({
    Name:'ExtensionPanelButton',
    Extends:PanelMenu.Button,

    _init: function(settings) {
        this.parent(0.5, null, false);
        Main.panel.menuManager.addMenu(this.menu);
        this._settingsInit(settings);
        let gicon = this._getIcon(this._iconPath);
        let icon = new St.Icon({ gicon: gicon, style_class: 'she-icon' });
        let arrow = new St.Label({ text: '\u25BE', style_class: 'unicode-arrow', y_expand: true, y_align: Clutter.ActorAlign.CENTER });
        let layoutBox = new St.BoxLayout();
        layoutBox.add_actor(icon);
        layoutBox.add_actor(arrow);
        this.actor.add_actor(layoutBox);
        this.actor.accessible_role = Atk.Role.MENU;
        this.actor._delegate = this;
        this._dirMgr = new DirectoryManager(this);
        this._actions = new GridButtonActions(this, this._settings);
        this._postfixes = new LangPostfixer.LangPostfixer()._langPostfixes;
        this._mode = 0;
        this._linksAndDirectoires = [];
        this._fileQueue = [];
        this._gridBtns = [];
        this._localLaunchers = { array: [], loaded: false };
        this._sysAppLaunchers = { array: [], loaded: false };
        this._displayRequired = false;
        this._constructMenuLayout();
        this._topRow = this._createTopRowTools();
        this._loadTimerId = 0;
        this._reloadTimerId = 0;
        this._loadLaunchers(true, true);
        this._connectInit();
    },

    _settingsInit: function(settings) {
        this._iconPath = settings.get_string('panel-icon-path');
        if (this._iconPath == 'default')
            this._iconPath = ICON.default_icon;
        this._helpEnabled = settings.get_boolean('show-help-messages');
        this._topRowIconsSize = settings.get_string('top-row-icons-size');
        this._descriptionTextSize = settings.get_string('description-text-size');
        this._menuIconsSize = settings.get_string('menu-icons-size');
        this._menuTextSize = settings.get_string('menu-text-size');
        if (settings.get_boolean('menu-button-text-white'))
            this._menuBtnColor = 'white';
        else
            this._menuBtnColor = 'yellowgreen';
        this._bgRGBA = settings.get_string('menu-background-rgba');
        this._bgStyle = BG_FMT.format(this._bgRGBA);
        this._settings = settings;
    },

    _connectInit: function() {
        this._loadLocalTimerId = 0;
        this._openToggledId = this.menu.connect('open-state-changed', Lang.bind(this, this._openToggled));
        this._loadedSigId = this.connect('loaded', Lang.bind(this, this._checkLoaded));
        this._installChgId = shellAppSystem.connect('installed-changed', Lang.bind(this, function() {
            this._loadLaunchers(false, true);
        }));
        this._reloadSigId = this._settings.connect('changed::reload-required', Lang.bind(this, function() {
            this._reloadTimerId = Mainloop.timeout_add(1500, Lang.bind(this, function() {
                log("TIMEOUT");
                this._loadLaunchers(true, false);
                this._reloadTimerId = 0;
                return false;
            }));
        }));
    },

    destroy: function() {
        if (this._loadTimerId != 0) {
            Mainloop.source_remove(this._loadTimerId);
            this._loadTimerId = 0;
        }
        if (this._reloadTimerId != 0) {
            Mainloop.source_remove(this._reloadTimerId);
            this._reloadTimerId = 0;
        }
        Main.panel.menuManager.removeMenu(this.menu);
        this.disconnect(this._loadedSigId);
        this.menu.disconnect(this._openToggledId);
        shellAppSystem.disconnect(this._installChgId);
        this._settings.disconnect(this._reloadSigId);
        this._clearGrid();
        this.menu.removeAll();
        this.menu.actor.get_children().forEach(function(child) { child.destroy() });
        this.parent();
    },

    _openToggled: function(menu, open) {
        if (open) {
            this.menu.actor.set_style(this._bgStyle);
            this._setMode(MODE.Launch);
            Main.pushModal(this.menu.actor);
            this._selectDisplay();
        } else {
            Main.popModal(this.menu.actor);
        }
    },

    _clearGrid: function() {
        let childActors = this._lowerGrid.get_children();
        for (let i in childActors) {
            this._lowerGrid.remove_actor(childActors[i]);
            childActors[i]._delegate.destroy();
        }
        let childActors = this._topGrid.get_children();
        for (let i in childActors) {
            this._topGrid.remove_actor(childActors[i]);
            childActors[i]._delegate.destroy();
        }
    },

    _constructMenuLayout : function() {
        let topBoxLayout = new St.BoxLayout({ style_class: 'she-top-box-layout', vertical: true });
        this._topHeaderGrid = new St.Table({ homogeneous: true });
        this._curDirName = new St.Label({ text: 'Start Here' });
        this._curDirLevel = new St.Label({ text: '' });
        this._curDirNameLevel = new St.Label({ text: '' });
        let style = 'text-align: left; font-weight: bold; text-decoration: underline; color:' + this._menuBtnColor + ';' + this._descriptionTextSize + ';';
        this._curDirNameLevel.set_style(style);
        this._selectedMode = new St.Label({ text: '' });
        this._selectedMode.set_style('font-weight: bold; text-align: right; ' + this._descriptionTextSize + ';');
        this._selectedItemName = new St.Label({ text: '' });
        this._selectedItemName.set_style('text-align: center; ' + this._descriptionTextSize + ';');
        this._topHeaderGrid.add(this._curDirNameLevel, { row: 0, col: 0 });
        this._topHeaderGrid.add(this._selectedItemName, { row: 0, col: 1 });
        this._topHeaderGrid.add(this._selectedMode, { row: 0, col: 2 });
        topBoxLayout.add(this._topHeaderGrid);
        this._selectedCmnt = new St.Label({ text: '' });
        this._selectedCmnt.set_style('text-align: center; width: 880px; ' + this._descriptionTextSize + ';');
        topBoxLayout.add(this._selectedCmnt);
        this._curDirNameLevel.set_text(this._curDirName.text + this._curDirLevel.text);
        let gridsLayoutBox = new St.BoxLayout({ style_class: 'she-grid-box', vertical: true });
        let topButtonBox = new St.BoxLayout({ style_class: 'she-btn-box', vertical: true });
        let topGridTableBoxLayout = new St.BoxLayout();
        this._topGrid = new St.Table({ homogeneous: true, reactive: true, style_class: 'she-grid-table' });
        topGridTableBoxLayout.add(this._topGrid);
        topButtonBox.add_actor(topGridTableBoxLayout);
        let lowerButtonBox = new St.BoxLayout({ style_class: 'she-btn-box', vertical: true });
        this._lowerGrid = new St.Table({ homogeneous: false, reactive: true, style_class: 'she-grid-table' });
        let lowerGridTableBoxLayout = new St.BoxLayout();
        lowerGridTableBoxLayout.add(this._lowerGrid);
        this._scrollView = new St.ScrollView();
        let vScroller = this._scrollView.get_vscroll_bar();
        vScroller.connect('scroll-start', Lang.bind(this, function() { this.menu.passEvents = true; }));
        vScroller.connect('scroll-stop', Lang.bind(this, function() { this.menu.passEvents = false; }));
        this._scrollView.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        this._scrollView.set_mouse_scrolling(true);
        lowerButtonBox.add_actor(this._scrollView);
        this._scrollView.add_actor(lowerGridTableBoxLayout);
        gridsLayoutBox.add(topButtonBox);
        gridsLayoutBox.add(lowerButtonBox);
        let section = new PopupMenu.PopupMenuSection();
        section.actor.add_actor(topBoxLayout);
        section.actor.add_actor(gridsLayoutBox);
        if (this._helpEnabled) {
            let messageBox = new St.BoxLayout({ style_class: 'she-message-box', vertical: true });
            section.actor.add_actor(messageBox);
            this._msg1 = new St.Label({ style_class: 'she-message' });
            this._msg1.clutter_text.line_wrap = true;
            this._msg1.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
            this._msg1.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
            this._msg2 = new St.Label({ style_class: 'she-message' });
            this._msg2.clutter_text.line_wrap = true;
            this._msg2.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
            this._msg2.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
            messageBox.add_child(this._msg1);
            messageBox.add_child(this._msg2);
        }
        this.menu.addMenuItem(section);
    },

    _setScrollViewHeight: function(numberOfButtons) {
        let overflow = 0;
        if ((numberOfButtons % GRID.Columns) > 0)
            overflow = 1;
        let rows = Math.floor(numberOfButtons / GRID.Columns) + overflow;
        if (rows > GRID.Rows)
            rows = GRID.Rows;
        this._scrollView.height = GRID.ButtonHeight * rows;
    },

    _scrollGridBox: function(gridChildActor) {
        let adjustment = 15;
        let vScrollBar = this._scrollView.get_vscroll_bar();
        let currentValue = vScrollBar.get_adjustment().get_value();
        let newValue = currentValue;
        let box = gridChildActor.get_allocation_box();
        if (currentValue > (box.y1 - adjustment))
            newValue = box.y1 - adjustment;
        if ((this._scrollView.height + currentValue) < (box.y2 + adjustment))
            newValue = box.y2 - this._scrollView.height + adjustment;
        if (newValue != currentValue)
            vScrollBar.get_adjustment().set_value(newValue);
    },

    _goHomeOrPrevious: function(home) {
        if (this._dirMgr._curDir.top == false) {
            if (home) {
                this._dirMgr._rewindDirStack();
            } else {
                this._dirMgr._popDir();
            }
        }
        this._setMode(MODE.ChangeDirectory, this._dirMgr._curDir.name);
    },

    _getButtonCountAndSelected: function() {

        let buttonCount = this._lowerGrid.get_children().length + GRID.Columns;
        let selected;
        for (selected = 0; selected < buttonCount; selected++) {
            if (this._gridBtns[selected].actor.has_style_pseudo_class('active'))
                break;
        }
        if (selected == buttonCount)
            selected = -1;
        return [buttonCount, selected];
    },

    _onMenuKeyPress: function(actor, event) {
        let [ buttonCount, selected ] = this._getButtonCountAndSelected();
        if (selected == -1) {
            this._gridBtns[0].actor.add_style_pseudo_class('active');
            return true;
        }
        let selection = selected;
        let activate = false;
        let response = null;
        switch(event.get_key_symbol()) {
            case Clutter.KEY_space:
            case Clutter.KEY_KP_Space:
            case Clutter.KEY_Return:
            case Clutter.KEY_KP_Enter:
                response = RESPONSE.Enter;
                activate = true;
                break;
            case Clutter.KEY_Home:
            case Clutter.KEY_KP_Home:
                this._goHomeOrPrevious(true);
                return true;
            case Clutter.KEY_BackSpace:
                this._goHomeOrPrevious(false);
                return true;
            case Clutter.KEY_Escape:
                this.menu.close();
                return true;
            case Clutter.KEY_KP_Up:
            case Clutter.KEY_Up:
                if ((selection - GRID.Columns) >= 0)
                    selected = selection - GRID.Columns;
                break;
            case Clutter.KEY_KP_Down:
            case Clutter.KEY_Down:
                if (selection < 0) {
                    selected = 0;
                    break;
                }
                if ((selection + GRID.Columns) < buttonCount) {
                    selected = selection + GRID.Columns;
                    break;
                }
                for (let j = GRID.Columns - 1; j > -1; j--) {
                    if ((selection + j) < buttonCount) {
                        selected = selection + j;
                        break;
                    }
                }
                break;
            case Clutter.KEY_KP_Right:
            case Clutter.KEY_Right:
                let row = Math.floor(selection / GRID.Columns);
                selected = (row * GRID.Columns) + GRID.Columns;
                if (selected >= buttonCount)
                    selected = buttonCount - 1;
                if ((selection + 1) < selected)
                    selected = selection + 1;
                break;
            case Clutter.KEY_KP_Left:
            case Clutter.KEY_Left:
                if ((selection - 1) >= 0)
                    selected = selection - 1;
                break;
            case Clutter.KEY_Delete:
            case Clutter.KEY_KP_Delete:
                response = RESPONSE.Delete;
                activate = true;
                break;
            case Clutter.KEY_Insert:
            case Clutter.KEY_KP_Insert:
                response = RESPONSE.Insert;
                activate = true;
                break;
            default:
                return Clutter.EVENT_PROPAGATE;
        }
        if (activate) {
            if (this._gridBtns[selection]._mask != 0) {
                if (Main.overview._shown)
                    Main.overview.toggle();
                if (this._gridBtns[selection]._activate(this._gridBtns[selection].actor, event, this._mode, response))
                    this.menu.close();
                return Clutter.EVENT_PROPAGATE;
            }
        } else if (selected == selection) {
            return Clutter.EVENT_PROPAGATE;
        }
        this._setBtnState(this._gridBtns[selected].actor, true);
        this._scrollGridBox(this._gridBtns[selected].actor);
        return Clutter.EVENT_PROPAGATE;
    },

    _connectGridButtonSignals: function(i) {
        this._gridBtns[i]._enterSigId = this._gridBtns[i].actor.connect('enter-event', Lang.bind(this, function(actor, e) {
            this._setBtnState(actor, true);
        }));
        this._gridBtns[i]._leaveSigId = this._gridBtns[i].actor.connect('leave-event', Lang.bind(this, function(actor, e) {
            this._setBtnState(actor, false);
            actor._delegate._target = false;
        }));
        this._gridBtns[i]._pressSigId = this._gridBtns[i].actor.connect('button-press-event', Lang.bind(this, function(actor, e) {
            actor._delegate._target = true;
        }));
        this._gridBtns[i]._releaseSigId = this._gridBtns[i].actor.connect('button-release-event', Lang.bind(this, function(actor, e) {
            if (actor._delegate._target == true) {
                actor._delegate._target = false;
                if (actor._delegate._activate(actor, e, this._mode, null)) {
                    if (Main.overview._shown)
                        Main.overview.toggle();
                        this.menu.close();
                }
            }
        }));
    },

    _setBtnState: function(selected, entered) {
        let previous = this._getButtonCountAndSelected()[1];
        if (previous != -1) {
            if (this._gridBtns[previous].actor.has_style_pseudo_class('active')) {
                this._gridBtns[previous].actor.remove_style_pseudo_class('active');
                this._gridBtns[previous].actor._target = false;
            }
        }
        if (this._selectedCmnt.has_style_class_name('she-warning-text'))
            this._selectedCmnt.remove_style_class_name('she-warning-text');
        if (entered) {
            this._selectedCmnt.set_text(selected._delegate._info.comment);
            this._selectedItemName.set_text(selected._delegate._info.name);
            selected.add_style_pseudo_class('active');
            if (this._helpEnabled) {
                if (selected._delegate._info.type == BUTTON_TYPE.TopRow) {
                    if (selected._delegate._info.firstBtn && selected._delegate._mask != 0) {
                        this._msg1.set_text(HELP[0][0]);
                        this._msg2.set_text(HELP[0][1]);
                    } else {
                        this._msg1.set_text('');
                        this._msg2.set_text('');
                    }
                } else if (this._mode > MODE.Launch && this._mode < MODE.CopyInProgress) {
                    this._msg1.set_text(HELP[this._mode][0]);
                    this._msg2.set_text(HELP[this._mode][1]);
                } else {
                   this._msg1.set_text(HELP[1][selected._delegate._info.type]);
                   this._msg2.set_text(HELP[1][4]);
                }
            }
        } else {
            this._selectedCmnt.set_text('');
            this._selectedItemName.set_text('');
            if (this._helpEnabled) {
                this._msg1.set_text('');
                this._msg2.set_text('');
            }
        }
    },

    _display: function(launcherArray) {
        if (this._displayInProgress === true)
            return;
        this._displayInProgress = true;
        this._clearGrid();
        let modeBtnSelected = null;
        let (i = 0, row = 0, col = 0) {
            this._selectedCmnt.set_text('');
            this._selectedItemName.set_text('');
            while (this._gridBtns.length > 0)
                this._gridBtns.pop();
            for (i in launcherArray) {
                let info = launcherArray[i];
                let gridButton = new GridButton(info, i, this);
                this._gridBtns[i] = gridButton;
                if (row == 0)
                    this._topGrid.add(gridButton.actor, { row: row, col: col });
                else
                    this._lowerGrid.add(gridButton.actor, { row: row, col: col });
                if (++col == GRID.Columns) {
                    col = 0;
                    row++;
                }
            }
            for (let i in this._gridBtns) {
                let button = this._gridBtns[i];
                if (button._enterSigId == 0) {
                    if (i > 0)
                        button._mask = button.actor.get_button_mask();
                    this._connectGridButtonSignals(i);
                }
                this._gridBtns[i].actor.remove_style_pseudo_class('active');
                if (i < 7) {
                    if (i == this._mode) {
                        if (i > 1)
                            modeBtnSelected = button.actor;
                        button._mask = 0;
                    }
                    if (this._dirMgr._curDir.path.endsWith('Directory_Index_lldir')) {
                        if (i == 6) {
                            this._selectedMode.text = MODES[MODE.ChooseDirectory];
                            modeBtnSelected = button.actor;
                        }
                        if (i > 1 && i < 7)
                            button._mask = 0;
                    }
                    if (launcherArray.length == 7 && (i > 0 && i < 4))
                        button._mask = 0;
                    if (this._mode == MODE.Applications && (i > 1 && i < 6)) {
                        button._mask = 0;
                    } else if (i == 6 && this._noDirFound) {
                        button._mask = 0;
                    }
                    if (button._mask == 0) {
                        let style = 'color:#a0a0a0; ' + this._topRowIconsSize;
                        button.icon.set_style(style);
                        button._info.comment = '';
                    } else {
                        let style = 'color:#ffffff; ' + this._topRowIconsSize;
                        button.icon.set_style(style);
                        button._info.comment = TOP_ROW_COMMENTS[i];
                    }
                }
            }
            this._setScrollViewHeight(this._lowerGrid.get_children().length);
        }
        if (modeBtnSelected === null) {
            this._setBtnState(this._gridBtns[0].actor, false);
            this._scrollGridBox(this._gridBtns[0].actor);
        } else {
            this._setBtnState(modeBtnSelected, true);
        }
        this._displayInProgress = false;
    },
    _getIcon: function(iconString) {
        let icon;
        if (iconString === undefined)
           iconString = ICON.default_icon;
        if (iconString.indexOf('/') != -1 && iconString.indexOf('.') > 0)
            icon = Gio.icon_new_for_string(iconString);
        else
            icon = new Gio.ThemedIcon({name: iconString});
        return icon;
    },

    _setMode: function(mode, name) {
        this._selectedMode.text = MODES[mode];
        this._mode = mode;
        if (mode == MODE.ChangeDirectory) {
            let level = '';
            if (this._dirMgr._dirStack.length > 1 && !this._dirMgr._curDir.popPop) {
                let depth = this._dirMgr._dirStack.length - 1;
                level = '  < ' + depth.toString() + ' >';
            }
            this._curDirName.set_text(name);
            this._curDirLevel.set_text(level);
            this._curDirNameLevel.set_text(this._curDirName.text + this._curDirLevel.text);
            this._loadLaunchers(true, false);
        }
        if (mode == MODE.Deleted)
            this._loadLaunchers(true, false);
    },

    _getEmptyLauncherInfo: function() {
        let launcherInfo = {
            type:          0,
            desktopFileId: null,
            name:          null,
            comment:       '',
            icon:          null,
            url:           null,
            dir:           null,
            file:          null,
            app:           null,
            action:        null,
            firstBtn:      false,
            iconSize:      this._menuIconsSize
        };
        return launcherInfo;
    },

    _loadLaunchers: function(local, system) {
        if (!this._loadInProgress) {
            this._localLaunchers.loaded = !local;
            this._sysAppLaunchers.loaded = !system;
            this._loadInProgress = true;
            this._cnt = 0;
            this._doLoadLaunchersAsync();
            this._loadTimerId = Mainloop.timeout_add(200, Lang.bind(this, function() {
                this._checkLoaded();
            }));
        }
    },

    _checkLoaded: function() {
        if (this._localLaunchers.loaded && this._sysAppLaunchers.loaded) {
            this._loadTimerId = 0;
            this._loadInProgress = false;
            switch (this._mode) {
                case MODE.Deleted:
                case MODE.Copied:
                case MODE.ChangeDirectory:
                    this._setMode(MODE.Launch);
                    break;
                default:
                    break;
            }
            this._selectDisplay();
            return false;
        } else {
            return true;
        }
    },

    _loadContents: function(f, res) {

        let contents;
        try {
            let contentsArray = f.load_contents_finish(res);
            if (contentsArray[0] != true) {
                throw new Error('Fail loading ' + f.get_path());
            }
            contents = contentsArray[1];
        } catch (e) {
            Notify(e.message, NOTIFY.error, true);
            throw e;
        }
        let lines = contents.toString().split('\n');
    	let itemArray = {};
        let (i, key, value, processItem = false) {
            for (i in lines) {
                let line = lines[i].toString();
                if (!processItem) {
                    if (line.indexOf('[Desktop Entry]') == 0)
                        processItem = true;
                    continue;
                }
                if (line.indexOf('[') == 0) {
                    processItem = false;
                    break;
                }
                let p = line.indexOf('=');
                if (p > 0) {
                    key = line.substr(0, p);
                    value = line.substr(p + 1);
                } else {
                    continue;
                }
                itemArray[key] = value;
            }
        }
        let langKeys = this._getLangKeys(itemArray);
        let info = this._getEmptyLauncherInfo();
        info.name = itemArray[langKeys['Name']];
        info.comment = itemArray[langKeys['Comment']];
        if (info.comment === undefined)
            info.comment = '';
        info.icon = this._getIcon(itemArray[langKeys['Icon']]);
        info.file = f.get_path();
        if (itemArray['Type'] == 'Link') {
            info.type = BUTTON_TYPE.Link;
            info.url = itemArray['URL'];
        } else if (itemArray['Type'] == 'Directory') {
            info.type = BUTTON_TYPE.Directory;
            info.dir = itemArray[EXTENDED_FORMAT_STR];
        }
        if (info.type != null) {
            Util.insertSorted(this._localLaunchers.array, info,
                Lang.bind(this, function (a, b) {
                    return this._comparer(a, b);
            }));
        }
        if (this._localLaunchers.array.length == this._lengthTarget) {
            if (this._dirMgr._curDir.popPop) {
                let j = this._localLaunchers.array.length - 1;
                let i = j - 1;
                while (i > 0) {
                    let info = this._localLaunchers.array[j];
                    if (info.type == BUTTON_TYPE.Directory) {
                        let info2 = this._localLaunchers.array[i];
                        if (info2.type == BUTTON_TYPE.Directory && info.name == info2.name)
                               this._localLaunchers.array.splice(j,1);
                    }
                    j = i--;
                }
            }
            this._localLaunchers.loaded = true;
            this.emit('loaded');
        } else {
            this._serializeLoading();
        }
    },

    _serializeLoading: function() {

        let file = this._fileQueue.pop();
        file.load_contents_async(null,
            Lang.bind(this, function(f, res) {
                this._loadContents(f, res);
        }));
    },

    _loadLinkAndDirFilesAsync: function(files) {

        let path = this._dirMgr._curDir.path;
        while (this._linksAndDirectoires.length > 0) {
            let fileInfo = this._linksAndDirectoires.pop();
            if (!fileInfo.get_is_symlink()) {
                let fileName = fileInfo.get_name();
                let fullPath = GLib.build_filenamev([path, fileName]);
                let line = '';
                let file = Gio.file_new_for_path(fullPath);
                this._fileQueue.push(file);
            }
        }
        this._serializeLoading();
    },

    _enumerate: function(obj, res) {

        let array = obj.next_files_finish(res);
        while (array.length > 0) {
            let fileInfo = array.pop();
            let desktopFileName = fileInfo.get_name();
            if (fileInfo.get_is_symlink()) {
                let app = shellAppSystem.lookup_app(desktopFileName);
                if (app != null) {
                    let appInfo = app.get_app_info();
                    let info = this._getEmptyLauncherInfo();
                    info.type = BUTTON_TYPE.Application;
                    info.desktopFileId = desktopFileName;
                    info.name = appInfo.get_name();
                    info.comment = appInfo.get_description();
                    if (info.comment === null)
                        info.comment = '';
                    info.icon = appInfo.get_icon();
                    info.file = appInfo.get_filename();
                    info.app = shellAppSystem.lookup_app(desktopFileName);
                    Util.insertSorted(this._localLaunchers.array, info, Lang.bind(this, function (a, b) {
                        return this._comparer(a, b);
                    }));
                } else {
                    let msg = _("Unexpected null app") + ' : ' + fileInfo.get_name();
                    Notify(msg, NOTIFY.error, true);
                }
            } else {
                if (desktopFileName.endsWith('.directory') && this._noDirFound) {
                    this._noDirFound = false;
                }
                if (desktopFileName.endsWith('.directory') || desktopFileName.endsWith('.desktop')) {
                    this._linkOrDir++;
                    this._linksAndDirectoires.push(fileInfo);
                } else {
                    let msg = _("Illegal file") + ' : ' + this._dirMgr._curDir.path + fileInfo.get_name();
                    Notify(msg, NOTIFY.error, true);
                }
            }
        }
        this._enum.close(null);
        if (this._linkOrDir > 0) {
            this._lengthTarget = this._localLaunchers.array.length + this._linkOrDir;
            this._loadLinkAndDirFilesAsync();
        } else {
            this._localLaunchers.loaded = true;
            this.emit('loaded');
        }
    },

    _comparer: function(a, b) {

        let aName = a.type.toString() + a.name;
        let bName = b.type.toString() + b.name;
        if (aName.toUpperCase() > bName.toUpperCase())
            return 0;
        else
            return -1;
    },

    _loadDirectory: function(dir) {

        let iter = dir.iter();
        let nextType;
        while ((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
            if (nextType == GMenu.TreeItemType.ENTRY) {
                let entry = iter.get_entry();
                let desktopFileId = entry.get_desktop_file_id();
                let app = shellAppSystem.lookup_app(desktopFileId);
                let appInfo = app.get_app_info();
                if (appInfo.should_show()) {
                    let info = this._getEmptyLauncherInfo();
                    info.type = BUTTON_TYPE.Application;
                    info.desktopFileId = desktopFileId;
                    info.name = appInfo.get_name();
                    info.comment = appInfo.get_description();
                    if (info.comment === null)
                        info.comment = '';
                    info.icon = appInfo.get_icon();
                    info.file = appInfo.get_filename();
                    info.app = app;
                    Util.insertSorted(this._sysAppLaunchers.array, info,
                        Lang.bind(this, function (a, b) {
                            return this._comparer(a, b);
                        }));
                }
            } else if (nextType == GMenu.TreeItemType.DIRECTORY) {
                let subdir = iter.get_directory();
                if (!subdir.get_is_nodisplay())
                    this._loadDirectory(dir);
            }
        }
    },

    _doLoadLaunchersAsync: function() {

        let dir;
        let flags = Gio.FileQueryInfoFlags.NONE
        let priority = GLib.PRIORITY_LOW;
        let attribs = 'standard::*';
        this._linkOrDir = 0;
        if (!this._sysAppLaunchers.loaded) {
            while (this._sysAppLaunchers.array.length > 0) {
                this._sysAppLaunchers.array.pop();
            }
            for (let i in this._topRow)
                this._sysAppLaunchers.array.push(this._topRow[i]);
            let tree = new GMenu.Tree({ menu_basename: 'applications.menu' });
            tree.load_sync();
            let root = tree.get_root_directory();
            let iter = root.iter();
            let nextType;
            while ((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
                if (nextType == GMenu.TreeItemType.DIRECTORY) {
                    dir = iter.get_directory();
                    if (!dir.get_is_nodisplay())
                        this._loadDirectory(dir);
                }
            }
            this._sysAppLaunchers.loaded = true;
            this.emit('loaded');
        }

        if (!this._localLaunchers.loaded) {
            while (this._localLaunchers.array.length > 0) {
                this._localLaunchers.array.pop();
            }
            for (let i in this._topRow)
                this._localLaunchers.array.push(this._topRow[i]);
            if (this._dirMgr._curDir.name == 'Start Here')
                this._noDirFound = true;
            dir = this._dirMgr._curDirectory;
            if (dir.query_exists(null)) {
                let path = this._dirMgr._curDir.path;
                dir.enumerate_children_async(attribs, flags, priority, null, Lang.bind(this, function(obj, res) {
                    try {
                        this._enum = obj.enumerate_children_finish(res);
                        if (this._enum === null)
                            throw new Error('Null enumeration ' + this._dirMgr._curDir.path);
                    } catch (e) {
                        Notify(e.message, NOTIFY.error, true);
                        throw e;
                    }
                    this._enum.next_files_async(200, priority, null, Lang.bind(this, function(obj, res) {
                        this._enumerate(obj, res);
                    }));
                }));
            } else {
                this._localLaunchers.loaded = true;
                this.emit('loaded');
            }
        }
    },

    _selectDisplay: function() {

        if (this._mode == MODE.Applications) {
            if (this._sysAppLaunchers.loaded)
                this._display(this._sysAppLaunchers.array);
        } else {
            if (this._localLaunchers.loaded) {
                this._display(this._localLaunchers.array);
            }
        }
    },

    _getLangKeys: function(itemArray) {

        let keys = { Name: 'Name', Comment: 'Comment', Icon: 'Icon' };
        let i, key, langKey;
        for (key in keys) {
            for (i in this._postfixes) {
                if (this._postfixes[i] === null)
                    continue;
                langKey = key + '[' + this._postfixes[i] + ']';
                if (itemArray[langKey] !== undefined) {
                    keys[key] = langKey;
                    break;
                }
            }
        }
        return keys;
    },

    _createTopRowTools: function() {

        return [
            { type: BUTTON_TYPE.TopRow, name: '', comment: '',
                icon: this._getIcon(ICON.default), url: null, file: null, app: null,
                action: Lang.bind(this, function() {
                    this._goHomeOrPrevious(false);
                    return false;
                }),
                firstBtn: true, iconSize: this._topRowIconsSize
            },
            { type: BUTTON_TYPE.TopRow, name: '', comment: '',
                icon: this._getIcon(ICON.launch_icon), url: null, file: null, app: null,
                action: Lang.bind(this, function() {
                    this._setMode(MODE.Launch);
                    this._selectDisplay();
                    return false;
                }),
                firstBtn: false, iconSize: this._topRowIconsSize
            },
            { type: BUTTON_TYPE.TopRow, name: '', comment: '',
                icon: this._getIcon(ICON.edit_icon), url: null, file: null, app: null,
                action: Lang.bind(this, function() {
                    this._setMode(MODE.Edit);
                    this._selectDisplay();
                    return false;
                }),
                firstBtn: false, iconSize: this._topRowIconsSize
            },
            { type: BUTTON_TYPE.TopRow, name: '', comment: '',
                icon: this._getIcon(ICON.delete_icon), url: null, file: null, app: null,
                action: Lang.bind(this, function() {
                    this._setMode(MODE.Delete);
                    this._selectDisplay();
                    return false;
                }),
                firstBtn: false, iconSize: this._topRowIconsSize
            },
            { type: BUTTON_TYPE.TopRow, name: '', comment: '',
                icon: this._getIcon(ICON.apps_icon), url: null, file: null, app: null,
                action: Lang.bind(this, function() {
                    this._setMode(MODE.Applications);
                    this._selectDisplay();
                    return false;
                }),
                firstBtn: false, iconSize: this._topRowIconsSize
            },
            { type: BUTTON_TYPE.TopRow, name: '', comment: '',
                icon: this._getIcon(ICON.create_icon), url: null, file: null, app: null,
                action: Lang.bind(this, function(seqNum, event) {
                    let name = this._curDirName.get_text();
                    let path = this._dirMgr._curDir.path;
                    let command = [DEE, Me.path, name, path, seqNum, 'CREATE'];
                    Util.trySpawn(command);
                    return true;
                }),
                firstBtn: false, iconSize: this._topRowIconsSize
            },
            { type: BUTTON_TYPE.TopRow, name: '', comment: '',
                icon: this._getIcon(ICON.directory), url: null, file: null, app: null,
                action: Lang.bind(this, function() {
                    this._dirMgr._pushDir('Directory_Index_lldir', 'Directory Index', false,  true);
                    this._setMode(MODE.ChangeDirectory, 'Directory Index');
                }),
                firstBtn: false, iconSize: this._topRowIconsSize
            }
        ];
    }
});
Signals.addSignalMethods(ExtensionPanelButton.prototype);

const GridButton = new Lang.Class({
    Name:'GridButton',

    _init: function(launcherInfo, index, panelBtn) {

        this._panelBtn = panelBtn;
        this._dirMgr = panelBtn._dirMgr;
        if (index > 6)
            this.actor = new St.Button({ reactive: true, style_class: 'she-grid-button', x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
        else
            this.actor = new St.Button({ reactive: true, style_class: 'she-top-button', x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
        this.actor._delegate = this;
        this._index = index;
        this._info = launcherInfo;
        this._target = false;
        this._enterSigId = 0;
        this._leaveSigId = 0;
        this._releaseSigId = 0;
        this._pressSigId = 0;
        this._mask = 0;
        let style = this._info.iconSize;
        if (this._info.firstBtn) {
            if (panelBtn._dirMgr._curDir.top == false) {
                this._mask = this.actor.get_button_mask();
            } else {
                this._info.comment = '';
                this._info.name = '';
            }
        }
        this.icon = new St.Icon({ gicon: this._info.icon });
        this.icon.set_style(style);
        style = 'text-align:center; ' + this._panelBtn._menuTextSize;
        let icon, gIcon;
        if (this._info.type == BUTTON_TYPE.Directory || this._info.type == BUTTON_TYPE.Link) {
            style = 'color: ' + this._panelBtn._menuBtnColor + '; font-weight: bold; ' + style;
            if (this._info.type == BUTTON_TYPE.Directory) {
                gIcon = this._panelBtn._getIcon(ICON.directory);
                icon = new St.Icon({ gicon: gIcon, icon_size: 12 });
            } else {
                gIcon = this._panelBtn._getIcon(ICON.symbolic_link);
                icon = new St.Icon({ gicon: gIcon, icon_size: 18 });
            }
        }
        let label = new St.Label({text: this._info.name});
        let box = new St.BoxLayout({ vertical: true });
        box.add(this.icon, { x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
        box.add(label, { x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
        if (icon !== undefined)
            box.add(icon, { x_fill: false, y_fill: false, x_align: St.Align.END, y_align: St.Align.END });
        label.set_style(style);
        this.actor.set_child(box);
    },

    destroy: function() {

        if (this._enterSigId != 0) {
            this.actor.disconnect(this._enterSigId);
            this.actor.disconnect(this._leaveSigId);
            this.actor.disconnect(this._releaseSigId);
            this.actor.disconnect(this._pressSigId);
            let child = this.actor.get_child();
            child.destroy();
            this.actor.destroy();
            this.emit('destroy');
        }
    },

    _activate: function(actor, event, mode, response) {

        if (this._mask == 0)
            return false;
        if (event.type() == Clutter.EventType.BUTTON_RELEASE) {
            if (event.get_button() == 1)
                response = RESPONSE.Enter;
            else if (event.get_button() == 3)
                response = RESPONSE.Secondary;
            else
                 return false;
        }
        return this._panelBtn._actions._activate(actor, event, mode, response);
    },
});
Signals.addSignalMethods(GridButton.prototype);

const GridButtonActions = new Lang.Class({
    Name:'GridButtonActions',

    _init: function(panelBtn, settings) {

       this._panelBtn = panelBtn;
       this._settings = settings;
       this._dirMgr = panelBtn._dirMgr;
    },

    _getSeqNr: function() {

        let sequenceNumber = this._settings.get_int('sequence');
        sequenceNumber = (sequenceNumber + 1) % 0xffffffff;
        this._settings.set_int('sequence', sequenceNumber);
        return  '.SHE.' + sequenceNumber.toString();
    },

    _activate: function(actor, event, mode, response) {

        if (actor._delegate._info.type == BUTTON_TYPE.TopRow) {
            if (response == RESPONSE.Enter) {
                return actor._delegate._info.action(this._getSeqNr(), event);
            }
            if (response == RESPONSE.Secondary && actor._delegate._info.firstBtn)
                this._panelBtn._goHomeOrPrevious(true);
            return false;
        }

        switch(mode) {

            case MODE.DeleteInProgress:
            case MODE.CopyInProgress:
            case MODE.ChangeDirectory:
                break;

            case MODE.Launch:
                if (response == RESPONSE.Enter) {
                    if (actor._delegate._info.type == BUTTON_TYPE.Application) {
                        try {
                            actor._delegate._info.app.open_new_window(event.get_time());
                        } catch (e) {
                            Notify(actor._delegate._info.name + ' : ' + e.message, NOTIFY.error, true);
                        }
                        return true;
                    }
                    if (actor._delegate._info.type == BUTTON_TYPE.Directory) {
                        this._dirMgr._pushDir(actor._delegate._info.dir, actor._delegate._info.name, false, false);
                        this._panelBtn._setMode(MODE.ChangeDirectory, this._dirMgr._curDir.name);
                        return false;
                    }
                    if (actor._delegate._info.type == BUTTON_TYPE.Link) {
                        try {
                            let context = global.create_app_launch_context(0,-1);
                            if (!Gio.AppInfo.launch_default_for_uri(actor._delegate._info.url, context))
                                throw new Error(_("Failed launch default for URI "));
                        } catch (e) {
                            Notify(actor._delegate._info.name + ' : ' + e.message, NOTIFY.error, true);
                        }
                        return true;
                    }
                }
                break;

            case MODE.Edit:
                if (response == RESPONSE.Enter && actor._delegate._info.type != BUTTON_TYPE.TopRow) {
                    let dirName = this._panelBtn._curDirName.get_text();
                    let dirPath = this._dirMgr._curDir.path;
                    let seqNum = this._getSeqNr();
                    let infoFile = actor._delegate._info.file;
                    Util.trySpawn([DEE, Me.path, dirName, dirPath, seqNum, infoFile]);
                    return true;
                }
                break;

            case MODE.Delete:
                if (response == RESPONSE.Delete || response == RESPONSE.Secondary) {
                    this._panelBtn._setMode(MODE.DeleteInProgress);
                    let errMsg = _("Delete Failed : ");
                    try {
                        switch (actor._delegate._info.type) {
                            case BUTTON_TYPE.Application:
                                let infoFile = Gio.file_new_for_path(actor._delegate._info.file);
                                let baseName = infoFile.get_basename();
                                let appLinkPath =  GLib.build_filenamev([this._dirMgr._curDir.path, baseName]);
                                let symbolicLink = Gio.file_new_for_path(appLinkPath);
                                if (!symbolicLink.delete(null))
                                    throw new error(errMsg + appLinkPath);
                                if (!infoFile.delete(null))
                                    throw new error (errMsg + actor._delegate._info.file);
                                this._panelBtn._setMode(MODE.Deleted);
                                break;
                            case BUTTON_TYPE.Link:
                                let desktopLink = Gio.file_new_for_path(actor._delegate._info.file);
                                if (!desktopLink.delete(null))
                                    throw new error( errMsg + actor._delegate._info.file);
                                this._panelBtn._setMode(MODE.Deleted);
                                break;
                            case BUTTON_TYPE.Directory:
                                this._targetDirPath = GLib.build_filenamev([TOP_DIR, actor._delegate._info.dir]);
                                this._targetDesktopFile = actor._delegate._info.file;
                                this._targetDirName = actor._delegate._info.name;
                                this._dirDeleteAsync();
                                return false;
                        }
                    } catch (e) {
                        errMsg = e.message + ' : ' + actor._delegate._info.name;
                        Notify(errMsg, NOTIFY.error, true);
                        return true;
                    }
                } else if (response == RESPONSE.Enter) {
                    this._panelBtn._selectedCmnt.add_style_class_name('she-warning-text');
                    this._panelBtn._selectedCmnt.set_text(HELP[MODE.Delete][1]);
                }
                break;

            case MODE.Applications:
                if (response == RESPONSE.Secondary || response == RESPONSE.Insert) {
                    this._installExtensionSysAppAsync(actor._delegate._info.file);
                    return false;
                } else if (response == RESPONSE.Enter) {
                    actor._delegate._info.app.open_new_window(event.get_time());
                    return true;
                }
                break;
        }
        return false;
    },

    _dirDeleteAsync: function() {

        let flags = Gio.FileQueryInfoFlags.NONE;
        let priority = GLib.PRIORITY_LOW;
        let attribs = 'standard::*';
        let dirDirectory = Gio.File.new_for_path(DIRECTORY_INDEX);
        try {
            if (dirDirectory.query_exists(null)) {
                dirDirectory.enumerate_children_async(attribs, flags, priority, null, Lang.bind(this, function(obj, res) {
                    let enumerator = obj.enumerate_children_finish(res);
                    let softDelete = false;
                    if (enumerator === null)
                        throw new Error(_("Null enumeration") + ' : ' + DIRECTORY_INDEX);
                    enumerator.next_files_async(500, priority, null, Lang.bind(this, function(obj, res) {
                        let array = obj.next_files_finish(res);
                        let arrayOfTargets = [];
                        while (array.length > 0) {
                            let info = array.pop();
                            let baseName = info.get_name();
                            if (baseName.endsWith('.directory')) {
                                let dirName = baseName.split('-.SHE.')[0];
                                dirName = dirName.replace(/_/g,' ');
                                if (dirName == this._targetDirName) {
                                    arrayOfTargets.push(baseName);
                                }
                            }
                        }
                        arrayOfTargets.sort();
                        for(let index in arrayOfTargets) {
                            if(this._targetDesktopFile.endsWith(arrayOfTargets[index])) {
                                if(index > 0) {
                                    softDelete = true;
                                    break;
                                }
                            }
                        }
                        enumerator.close(null);
                        this._attemptDirDelete(softDelete);
                    }));
                }));
            } else {
                throw new Error(_("Does not exist") + ' : '  + DIRECTORY_INDEX);
            }
        } catch (e) {
            Notify(e.message, NOTIFY.error, true);
            throw e;
        }
    },

    _attemptDirDelete: function(softDelete) {

        let errMsg, prefix = _("Delete Failed : ");
        try {
            if (GLib.file_test(this._targetDirPath, GLib.FileTest.EXISTS) && !softDelete) {
                if (this._targetDirName != 'Start Here') {
                    errMsg = prefix + this._targetDirName;
                    let dir = Gio.file_new_for_path(this._targetDirPath);
                    if (!dir.delete(null))
                        throw new error(errMsg);
                }
            }
            errMsg = prefix + this._targetDesktopFile;
            let desktopFile = Gio.file_new_for_path(this._targetDesktopFile);
            if (!desktopFile.delete(null))
                throw new error(errMsg);
            let baseName = desktopFile.get_basename();
            let hardLink = GLib.build_filenamev([DIRECTORY_INDEX, baseName]);
            errMsg = prefix + hardLink;
            desktopFile = Gio.file_new_for_path(hardLink);
            if (!desktopFile.delete(null))
                throw new error(errMsg);
        } catch (e) {
            Notify(e.message + ' : ' + errMsg, NOTIFY.error, true);
        }
        this._panelBtn._setMode(MODE.Deleted);
    },

    _createDesktopFileAndLinkAsync: function(bytes, newAppPath, newSymLinkPath) {

        let newAppFile = Gio.File.new_for_path(newAppPath);
        newAppFile.append_to_async(Gio.FileCreateFlags.REPLACE_DESTINATION, GLib.PRIORITY_LOW, null,
            Lang.bind(this, function(f, res, ud) {
                let stream;
                try {
                    stream = f.append_to_finish(res);
                    if (stream === null)
                        throw new Error(_("Create stream fail:") + ud);
                } catch (e) {
                    Notify(e.message, NOTIFY.error, true);
                    throw e;
                }
                stream.write_bytes_async(bytes, bytes.length, null,
                    Lang.bind(this, function(s, res, ud) {
                        try {
                            let cnt = s.write_bytes_finish(res);
                            if (cnt != bytes.length)
                                throw new Error(_("Write stream fail:") + ud);
                        } catch (e) {
                            Notify(e.message, NOTIFY.error, true);
                            throw e;
                        }
                        s.close_async(GLib.PRIORITY_LOW, null,
                            Lang.bind(this, function(s, res, ud) {
                                try {
                                    if (!s.close_finish(res))
                                        throw new Error(_("Close stream fail:") + ud[0]);
                                    let newSymLinkFile = Gio.File.new_for_path(ud[1]);
                                    if (!newSymLinkFile.make_symbolic_link(ud[0], null))
                                        throw new Error(_("Create symbolic link fail:") + ud[1]);
                                } catch (e) {
                                    Notify(e.message, NOTIFY.error, true);
                                    throw e;
                                }
                                let command = [DEE, ud[0]];
                                Util.trySpawn(command);
                                this._panelBtn._setMode(MODE.Copied);
                            }, [newAppPath, newSymLinkPath]));
                    }, newAppPath));
            }, newAppPath));
    },

    _installExtensionSysAppAsync: function(desktopFile) {

        let appFile = Gio.file_new_for_path(desktopFile);
        let currentStartHereDir = this._dirMgr._curDirectory;
        if (!currentStartHereDir.query_exists(null))
            currentStartHereDir.make_directory_with_parents(null);
        this._panelBtn._setMode(MODE.CopyInProgress);
        let baseName = appFile.get_basename();
        appFile.load_contents_async(null, Lang.bind(this, function(f, res, ud) {
            let result, contents, i, stream, cnt, needNoDisplay = true;
            let flags = Gio.FileCreateFlags.REPLACE_DESTINATION;
            try {
                [result, contents] = f.load_contents_finish(res);
                if (!result)
                    throw new Error(_("Failed to load contents " + ud[0]))
            } catch (e) {
                Notify(e.message, NOTIFY.error, true);
                throw e;
            }
            let lines = contents.toString().split('\n');
            contents = '';
            let processItem = false;
            let dbusActivateable = '';
            for(i in lines) {
                if (lines[i] == '')
                    continue;
                if (processItem && needNoDisplay) {
                    if (lines[i].indexOf('NoDisplay=true') == 0)
                        needNoDisplay = false;
                }
                if (lines[i].indexOf('[') == 0 && processItem && needNoDisplay) {
                    contents = contents + 'NoDisplay=true\n';
                    needNoDisplay = false;
                }
                if (!processItem) {
                    if (lines[i].indexOf('[Desktop Entry]') == 0)
                         processItem = true;
                }
                contents = contents + lines[i] + '\n';
            }
            if (needNoDisplay)
                contents = contents + 'NoDisplay=true\n';
            let bytes = ByteArray.fromString(contents);
            let newBase = ud[2].replace(/\.desktop$/,'') + '_' + dbusActivateable + this._getSeqNr() + '.desktop';
            let newAppPath =  GLib.build_filenamev([LOCAL_APPS_PATH, newBase]);
            let newSymLinkPath =  GLib.build_filenamev([ud[1], newBase]);
            this._createDesktopFileAndLinkAsync(bytes, newAppPath, newSymLinkPath);
        }, [desktopFile, this._dirMgr._curDir.path, baseName]));
    }
});

const DirectoryManager = new Lang.Class({
    Name:'DirectoryManager',

    _init: function(panelBtn) {

        this._panelBtn = panelBtn;
        this._dirStack = [];
        let path = START_HERE;
        this._curDir = {};
        this._curDirectory = null;
        this._pushDir(path, 'Start Here', true, false);
    },

    _popDir: function() {

        if (this._curDir.top == false) {
            this._dirStack.pop();
            this._curDir = this._dirStack[this._dirStack.length - 1];
            if (this._curDir.popPop) {
                this._dirStack.pop();
                this._curDir = this._dirStack[this._dirStack.length - 1];
            }
            this._curDirectory = Gio.file_new_for_path(this._curDir.path);
        }
    },

    _rewindDirStack: function() {

        if (this._dirStack.length > 1) {
            while (this._curDir.top == false) {
                this._dirStack.pop();
                this._curDir = this._dirStack[this._dirStack.length - 1];
            }
            this._curDirectory = Gio.file_new_for_path(this._curDir.path);
        }
    },

    _pushDir: function(path, name, isTop, isPopPop) {

        this._curDir = {path: null, name: null, top: false, popPop: false};
        this._curDir.path = TOP_DIR + path;
        this._curDir.name = name;
        this._curDir.top = isTop;
        this._curDir.popPop = isPopPop;
        this._dirStack.push(this._curDir);
        this._curDirectory = Gio.file_new_for_path(this._curDir.path);
    }

});

const StartHereExtension = new Lang.Class({
    Name:'StartHereExtension',

    _init: function() {
        this._panelBtn = null;
        this._applySigId = null;
        this._enabled = false;
        this._firstEnable = true;
        let GioSSS = Gio.SettingsSchemaSource;
        let schema = Me.metadata['settings-schema'];
        let schemaDir = Me.dir.get_child('schemas').get_path();
        let schemaSource = GioSSS.new_from_directory(schemaDir, GioSSS.get_default(), false);
        let schemaObj = schemaSource.lookup(schema, true);
        this._settings = new Gio.Settings({ settings_schema: schemaObj });
        this._getPosition();
    },

    destroy: function() {
        if (this._panelBtn != null) {
            this._panelBtn.destroy();
            this._panelBtn = null;
        }
        if (this._applySigId != null) {
            this._settings.disconnect(this._applySigId);
            this._applySigId = null;
        }
        if (this._loadTimerId != 0) {
            Mainloop.source_remove(this._loadTimerID);
            this._loadTimerId = 0;
        }
    },

    _getPosition: function() {
        let center = this._settings.get_boolean('panel-icon-center');
        let left = this._settings.get_boolean('panel-icon-left');
        if (center) {
            if (left)
                this._pos = [ 0, 'center'];
            else
                this._pos = [-1, 'center'];
        } else {
            if (left)
                this._pos = [ 1, 'left'];
            else
                this._pos = [ 0, 'right'];
        }
    },

    enable: function() {
        if (Main.sessionMode.currentMode == 'user' && !this._enabled) {
            if (this._firstEnable) {
                if (!GLib.file_test(DEE, GLib.FileTest.IS_EXECUTABLE))
                    Util.trySpawn(['/usr/bin/chmod', '0700', DEE]);
                let dir = Gio.file_new_for_path(TOP_DIR);
                if (!dir.query_exists(null))
                    dir.make_directory_with_parents(null);
                this._firstEnable = false;
            }
            this._panelBtn = new ExtensionPanelButton(this._settings);
            Main.panel.addToStatusArea('SHE_panel_button', this._panelBtn, this._pos[0], this._pos[1]);
            this._applySigId = this._settings.connect('changed::apply-settings', Lang.bind(this, function() {
                if (this._enabled) {
                    this._getPosition();
                    this.disable();
                    this.enable();
                }
            }));
        }
        this._enabled = true;
    },

    disable: function() {
        if (this._panelBtn != null) {
            this._panelBtn.destroy();
            this._panelBtn = null;
        }
        if (this._applySigId != null) {
            this._settings.disconnect(this._applySigId);
            this._applySigId = null;
        }
        this._enabled = false;
    }
});

function init(metadata) {
    return new StartHereExtension();
}

