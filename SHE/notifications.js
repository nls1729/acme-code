
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

const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Gettext = imports.gettext;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const DOMAIN = Me.metadata['gettext-domain'];
const _ = Gettext.domain(DOMAIN).gettext;

const ICON = {
    info    : 'dialog-information-symbolic',
    error   : 'dialog-error-symbolic',
    warning : 'dialog-warning-symbolic'
};

function notify(details, icon, logn, critical) {
    if (critical === undefined)
        critical = false;
    let source = new ExtensionNotificationsSource(icon);
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, Me._uuid, details);
    if (critical)
        notification.setUrgency(MessageTray.Urgency.CRITICAL);
    source.notify(notification);
    if (logn === undefined)
        return;
    log(Me.uuid + ' : ' + details);
}

const ExtensionNotificationsSource = new Lang.Class({
    Name: 'ExtensionNotificationsSource',
    Extends: MessageTray.Source,

    _init: function(icon) {
        this.parent(_("Extension"), icon);
    },

    open: function() {
        this.destroy();
    }
});
