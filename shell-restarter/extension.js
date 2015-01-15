
/* This extension is a derived work of the Gnome Shell.
*
* Copyright (c) 2015 Norman L. Smith
*
* This extension is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* This extension is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this extension; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
*/

const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Main = imports.ui.main;

let button;

function init() {
    button = new St.Bin({style_class: 'panel-button', reactive: true,
        can_focus: true, x_fill: true, y_fill: false, track_hover: true});
    let icon = new St.Icon({icon_name: 'view-refresh-symbolic',
        style_class: 'system-status-icon'});
    button.set_child(icon);
    button.connect('button-release-event', function (actor, event) {
        if (event.get_button() == 3 && Meta.restart === undefined) {
            global.reexec_self();
        } else {
            Meta.restart(_("Restarting…"));
        }       
    });
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._leftBox.remove_child(button);
}
