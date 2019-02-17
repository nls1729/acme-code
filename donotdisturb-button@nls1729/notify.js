const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;

class ExtensionNotificationSource extends MessageTray.Source {

    constructor() {
        super('Extension', 'dialog-information-symbolic');
    }

    open() {
        super.destroy();
    }
};


function notify(msg, details) {
    let source = new ExtensionNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, msg, details);
    if (source.setTransient === undefined)
        notification.setTransient(false);
    else
        source.setTransient(false);
    source.notify(notification);
}

