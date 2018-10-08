const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const St = imports.gi.St;


class ExtensionNotificationSource extends MessageTray.Source {

    constructor() {
        super('Extension', 'dialog-warning-symbolic');
    }

    open() {
        super.destroy();
    }
};

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


class VerboseNotify {

    constructor() {
        this._visible = false;
        this._box = new St.BoxLayout({ vertical: true });
        this._titleBin = new St.Bin();
        this._msgBin = new St.Bin();
        this._closeBin = new St.Bin({ reactive: true });
        this._clickedSig = this._closeBin.connect('button-press-event', this._clicked.bind(this));
        this._box.add(this._titleBin);
        this._box.add(this._msgBin);
        this._box.add(this._closeBin);
        this._titleBin.child = new St.Label({style_class: 'title-text'});
        this._msgBin.child = new St.Label({style_class: 'msg-text'});
        this._closeBin.child = new St.Label({style_class: 'close-text'});
    }

    _clicked() {
        if (this._visible)
            Main.uiGroup.remove_actor(this._box);
        this._visible = false;
    }

    _notify(titleText, msgText, closeText) {
        this._titleBin.child.set_text(titleText);
        this._msgBin.child.set_text(msgText);
        this._closeBin.child.set_text(closeText);
        Main.uiGroup.add_actor(this._box);
        let monitor = Main.layoutManager.primaryMonitor;
        this._box.set_position(Math.floor(monitor.width / 2 - this._box.width / 2),
                               Math.floor(monitor.height / 2 - this._box.height / 2));
        this._visible = true;
    }

    destroy() {
        if (this._visible)
            Main.uiGroup.remove_actor(this._box);
        this._closeBin.disconnect(this._clickedSig);
        this._box.destroy();
    }
};

function getVerboseNotify() {
    return new VerboseNotify();
}

