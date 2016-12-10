README

    Gnome Shell Extension Reloader extension-reloader

    2016-11-12

    This extension is intended for use by Gnome Shell Extension writers.
    It is common practice to restart the Shell during testing to reload
    an extension with changes made to the extension's code. Wayland does
    not allow restarting the Shell.  To reload an extension under Wayland
    a logout and a login is required.  This extension reloads only the
    selected extension with two mouse clicks saving time for the extension
    writer. This extension requires the reload option in the recently
    updated gnome-shell-extension-tool (Gnome Bugzilla #772593).  A copy
    of the new tool from the Gnome Github mirror is included with this
    extension. The new tool is not included in GS 3.22.2.

    The upcoming release of Fedora 25 will default to using Wayland instead
    of Xorg.  I have submitted an enhancement patch to the gnome-tweak-tool
    (Gnome Bugzilla #774072) to include buttons for reloading extensions in
    the Extensions section of the Tweak Tool.

    When the gnome-shell-extension-tool with reload capability is released,
    the borrowed copy of gnome-shell-extension-tool will be removed from this
    extension.

    2016-11-13 Uploaded to ego for review.

    2016-11-23 Extension Reloader - updated copyright due to fsf address changed
               Removed address and added license url instead. Uploaded for review.

    2016-12-09 Extension Reloader - added logic to consistently present the menu.
               The extension's current state is displayed.  The order of the
               extensions is determined by their state sorted within state by name.
               Only enabled extensions are reloadable.


zip file: Thu Dec  8 13:23:54 EST 2016 2d37243c59137c58b2d8ed24b80f40333e557878

...
