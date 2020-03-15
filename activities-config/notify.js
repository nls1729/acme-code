
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

const Main = imports.ui.main;
const St = imports.gi.St;

class VerboseNotify {

    constructor() {
        this._visible = false;
        this._box = new St.BoxLayout({ vertical: true });
        this._titleBin = new St.Bin();
        this._msgBin = new St.Bin();
        this._closeBtn = new St.Button({style_class: 'close-text'});
        this._clickedSig = this._closeBtn.connect('button-press-event', this._clicked.bind(this));
        this._box.add(this._titleBin);
        this._box.add(this._msgBin);
        this._box.add(this._closeBtn);
        this._titleBin.child = new St.Label({style_class: 'title-text'});
        this._msgBin.child = new St.Label({style_class: 'msg-text'});
    }

    _clicked() {
        if (this._visible)
            Main.uiGroup.remove_actor(this._box);
        this._visible = false;
    }

    _notify(titleText, msgText, closeText) {
        this._titleBin.child.set_text(titleText);
        this._msgBin.child.set_text(msgText);
        this._closeBtn.label = closeText;
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

