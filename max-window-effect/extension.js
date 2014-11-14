/*
 *  Copyright (C) 2014 Norman L. Smith
 *
 *  max-window-effect@nls1729 - Gnome Shell Extension
 *
 *  This extension is a derived work of the Gnome Shell.
 *
 *  This extension is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU General Public License as 
 *  published by the Free Software Foundation; either version 2 of the
 *  License, or (at your option) any later version. 
 *
 *  The extension is is distributed in the hope it will be useful, 
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 *  General Public License for more details. 
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this extension. If not, see <http://www.gnu.org/licenses/>.
 *
 */

const Cairo = imports.cairo;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;

const BACKGROUND_STYLE = 'background-color: black';

const MaxWindowEffect = new Lang.Class({
    Name: 'MaxWindowEffect',

    _init : function() {
        this._maximizeId = null;
        this._unmaximizeId = null;
        this._restackedId = null;
    },

    _disconnectGlobalSignals: function() {
        if(this._maximizeId != null) {
            global.window_manager.disconnect(this._maximizeId);
            this._maximizeId = null;
        }
        if(this._unmaximizeId != null) {
            global.window_manager.disconnect(this._unmaximizeId);
            this._unmaximizeId = null;
        }
        if(this._restackedId != null) {
            global.screen.disconnect(this._restackedId);
            this._restackedId = null;
        }
    },

    _handleCornerSignals: function(connect) {
        if(connect) {
            if(this._signalIdLC == null)
                this._signalIdLC = Main.panel._leftCorner.actor.connect('repaint', Lang.bind(this, this._redoLeft));
            if(this._signalIdRC == null)
                this._signalIdRC = Main.panel._rightCorner.actor.connect('repaint', Lang.bind(this, this._redoRight));
        } else {
            if(this._signalIdLC != null) {
                Main.panel._leftCorner.actor.disconnect(this._signalIdLC);
                this._signalIdLC = null;
            }
            if(this._signalIdRC != null) {
                Main.panel._rightCorner.actor.disconnect(this._signalIdRC);
                this._signalIdRC = null;
            }
        }
    },

    _redoLeft: function() {
        this._repaintPanelCorner(Main.panel._leftCorner);
    },

    _redoRight: function() {
        this._repaintPanelCorner(Main.panel._rightCorner);
    },

    _repaintPanelCorner: function(corner) {
        if(this._actionNeeded1)
            return true;
        let panelBackgroundColor = new Clutter.Color({red: 0, green: 0, blue: 0, alpha: 255});
        let node = corner.actor.get_theme_node();
        let cornerRadius = node.get_length('-panel-corner-radius');
        let borderWidth = node.get_length('-panel-corner-border-width');
        let borderColor = node.get_color('-panel-corner-border-color');
        let overlap = borderColor.alpha != 0;
        let offsetY = overlap ? 0 : borderWidth;
        let cr = corner.actor.get_context();
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
    },

    _maxUnmax: function() {
        let currentWindow;
        this._maxOnPrimary = false;
        let primaryMonitor = global.screen.get_primary_monitor();
        let workspace = global.screen.get_active_workspace();
        if(this._workspace != workspace) {
            this._actionNeeded1 = true;
            this._actionNeeded2 = true;
            this._workspace = workspace;
        }
        let windows = workspace.list_windows();
        for (let i = 0; i < windows.length; ++i) {
            currentWindow = windows[i];
            if(currentWindow.get_monitor() != primaryMonitor)
                continue;
            if(currentWindow.maximized_horizontally && currentWindow.maximized_vertically && !currentWindow.is_hidden()) {
                this._maxOnPrimary = true;
                break;
            }
        }
        if(this._maxOnPrimary && this._actionNeeded1) {
            this._actionNeeded1 = false;
            this._actionNeeded2 = true;
            Main.panel.actor.set_style(BACKGROUND_STYLE);
            for (id in Main.panel.statusArea)
            {
	        let item = Main.panel.statusArea[id];
	        if (typeof item.actor !== 'undefined')
	        {
                    item.actor.set_style("color: white");
	        }  
	    }
        } else if(!this._maxOnPrimary && this._actionNeeded2) {
            this._actionNeeded1 = true;
            this._actionNeeded2 = false;
            for (id in Main.panel.statusArea)
            {
	        let item = Main.panel.statusArea[id];
	        if (typeof item.actor !== 'undefined')
	        {
                    item.actor.set_style(null);
	        }  
	    }
            Main.panel.actor.set_style(null);
        }
    },

    _maxWindowPanelEffect: function() {
        this._signalIdLC = null;
        this._signalIdRC = null;
        this._maxOnPrimary = false;
        this._actionNeeded1 = true;
        this._actionNeeded2 = true;
        this._workspace = null;
        this._maxUnmax();
        if(this._maximizeId == null)
            this._maximizeId = global.window_manager.connect('maximize', Lang.bind(this, this._maxUnmax));
        if(this._unmaximizeId == null)
            this._unmaximizeId = global.window_manager.connect('unmaximize',Lang.bind(this, this._maxUnmax));
        if(this._restackedId == null)
            this._restackedId = global.screen.connect('restacked', Lang.bind(this, this._maxUnmax));
        this._handleCornerSignals(true);
    },

    enable: function() {
        this._maxWindowPanelEffect();
    },

    disable: function() {
        this._disconnectGlobalSignals();
        this._handleCornerSignals(false);
        Main.panel.actor.set_style(null);
    }
});

function init(metadata) {
    return new MaxWindowEffect();
}

