README

donotdisturb-button@nls1729

Gnome Shell 3.16 removed the ability to set a busy status for
notifications.

This extension only sets status for notifications. It does not
integrate setting of presence with Online Accounts.

The issue is discussed on the Fedora Desktop List:
https://lists.fedoraproject.org/pipermail/desktop/2015-June/012417.html

Panel button toggles presense status {BUSY | AVAILABLE}.

Uploaded to ego website 2015-06-15.

Corrected error in README.txt updated metadata.json

Uploaded to ego website 2015-09-26.

Uploaded version 6 to ego website 2016-09-23.

Added preferences to allow assigning keyboard shortcut to toggle button.
Uploaded version 7 to ego website 2016-10-07.

Added notification count.  Changed to find location of clock and locate
button next to clock. Uploaded version 8 to ego website 2016-10-23.

Changed panel button location to be set by preference (user request).
Added Greek translations thanks to Tom Tryfonidis.
Uploaded version 9 to ego website 2016-11-12.

Do Not Disturb Button - updated copyright due to fsf address change
Removed addess and added license url instead in extension.js.
Removed copyright from prefs.js. Uploaded for review 2016-11-23.

Do Not Disturb Button -  changed name of translation mo files
requested by Andrew Toskin to avoid duplicate filenames when
creating RPM packages for Fedora.  Changed to use default
schema directory if not installed from zip file. Uploaded for
review 2017-03-12.

Do Not Disturb Button - changed available and busy icons to the
style of the No Notifications icon displayed in the notifications
area of the calendar.  Github issue #22. Updated for GS3.24
Uploaded for review 2017-04-05

Do Not Disturb Button - changed to make display of notification
count optional.  Added function to show notification indicator dot
(after time display in panel) when unseen notifications reside in
the calendar notification area.  Thanks to Christoph Schroeder for
Github nls1729/acme-code pull request #23 Add option to hide
notification count. Translations updated. Thanks to Jonatan Zeidler.
Uploaded for review 2017-05-21.

Do Not Disturb Button - The modified Gnome Shell in the Ubuntu default
Ubuntu Session operates in the 'ubuntu' mode.  Removed restrictions
based on mode to accomadate Ubuntu 17.10 and 18.04 and going forward.
Added a preference to allow user to set the busy state at extension
init (ie. login). Uploaded for review 2017-11-25.

Do Not Disturb Button - Updated translations. Uploaded for
review 2017-11-30.

2018-04-15 Updated metadata.json to GS 3.28 

2018-04-19 Before the following changes there was one option which
allowed the user to set busy state of the session with the Busy
preference.  If unchecked the busy state was set to Available at login.
If checked the busy state was set to Busy.  During the session the busy
state could be set by clicking the extension icon. The busy state set
by the panel icon was not retained during a screen lock or a switch
to another user. A re-login to the current session after a screen lock
or user switch was treated like logging into a new startup session.
The Busy State preference determined the busy state of the extension.

The Busy State Override At Session Start preference is added and consists
of an "Enable" checkbox, "Busy" radiobutton and "Avaliable" radiobutton.
If "Enable" is unchecked, the default is that the state of the extension
icon controls the busy state in a persistent manner.  Whatever state the
icon was in when the session ended or was interrupted by a screen lock or
user switch determines the state at the next session login or re-login
after a screen lock or user switch.  If the "Enable" is checked the state
indicated by the selected radiobutton will only set the state at the next
new session startup login; otherwise, the new persistent behavoir set
by the extension panel button is in effect.

zip file: 2018-04-20 09:03:13 116f7d59e1a21c6fe5b7e178e9d49b232fa6b303
