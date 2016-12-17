/*
  This file is part of the extension-reloader@nls1729.

  Copyright (c) 2016 Norman L. Smith

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

const St = imports.gi.St;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Lang = imports.lang;
const ICON = [ "dialog-information-symbolic",
               "dialog-warning-symbolic",
               "dialog-error-symbolic"
             ];


const ExtensionNotificationSource = new Lang.Class({
    Name: 'ExtensionNotificationSource',
    Extends: MessageTray.Source,

    _init: function(type) {

        this.parent(_("Extension"), ICON[type]);
    },

    open: function() {
        this.destroy();
    }
});

function notifyError(msg, details) {
    log('error: ' + msg + ': ' + details);
    notify(msg, details);
}

function notify(msg, details, type) {
    let src = new ExtensionNotificationSource(type);
    Main.messageTray.add(src);
    let notification = new MessageTray.Notification(src, msg, details);
    if (type == 2)
        log('error: ' + msg + ' : ' + details);
    if (src.setTransient === undefined)
        notification.setTransient(true);
    else
        src.setTransient(true);
    src.notify(notification);
}

