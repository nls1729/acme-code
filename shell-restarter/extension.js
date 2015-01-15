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
