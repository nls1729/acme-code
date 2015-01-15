const St = imports.gi.St;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Lang = imports.lang;

const ExtensionNotificationSource = new Lang.Class({
    Name: 'ExtensionNotificationSource',
    Extends: MessageTray.Source,

    _init: function() {

        this.parent(_("Extension"), 'dialog-warning-symbolic');
    },

    open: function() {
        this.destroy();
    }
});

function notifyError(msg, details) {
    log('error: ' + msg + ': ' + details);
    notify(msg, details);
}

function notify(msg, details) {
    let source = new ExtensionNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, msg, details);
    if (source.setTransient === undefined)
        notification.setTransient(true);
    else
        source.setTransient(true);
    source.notify(notification);
}

