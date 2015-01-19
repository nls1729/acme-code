
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

const GLib = imports.gi.GLib;
const Lang = imports.lang;

/*
    See https://developer.gnome.org/desktop-entry-spec
    Localized values for keys
*/

const LangPostfixer = new Lang.Class({
    Name:'LangPostfixer',

    _init: function() {
        this._langCountryModifier = null;
        this._langCountry = null;
        this._langModifier = null;
        this._lang = null;
        this._langPostfixes = this._establishLanguagePostfixes();
    },

    _establishLanguagePostfixes: function() {
        let lang = GLib.environ_getenv(GLib.get_environ(), 'LANG');
        let haveModifier = false;
        let haveEncoding = false;
        let haveCountry = false;
        if (lang.indexOf('@') != -1)
            haveModifier = true;
        if (lang.indexOf('.') != -1)
            haveEncoding = true;
        if (lang.indexOf('_') != -1)
            haveCountry = true;
        if (!haveCountry && !haveEncoding && !haveModifier) {
            this._lang = lang;
        } else if (haveCountry) {
            if (haveEncoding) {
                this._langCountry = lang.split('.')[0];
                if (haveModifier)
                    this._langCountryModifier = this._langCountry + '@' + lang.split('@')[1];
            } else if (haveModifier) {
                this._langCountry = lang.split('@')[0];
                this._langCountryModifier = lang;
            } else {
                this._langCountry = lang;
            }
            this._lang = this._langCountry.split('_')[0];
        } else if (!haveEncoding && haveModifier) {
            this._langModifier = lang;
            this._lang = this._langModifier.split('@')[0];
        } else if (haveEncoding && haveModifier) {
            this._lang = lang.split('.')[0];
            this._langModifier = this._lang + '@' + lang.split('@')[1];
            this._lang = this._langModifier.split('@')[0];
        }
        return [ this._langCountryModifier, this._langCountry, this._langModifier, this._lang ];
    }
});

