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

2018-04-22 Uploaded for review.

2018-07-29 Lots of changes for the future...

See:
https://bugzilla.gnome.org/show_bug.cgi?id=770185#c21
https://gitlab.gnome.org/GNOME/gnome-shell/merge_requests/112/diffs
https://github.com/nls1729/acme-code/issues/38

Added code to handle clutter.EventType.TOUCH_BEGIN to act the same as
a mouse click off the extension's panel button.

Updated code to use arrow notation => instead of Lang.bind for anonymous
functions.

Updated code to use ES6 classes.

Updated to use GJS ES6 class wrapper for GObject class in prefs.js.

Updated to use Function.prototype.bind() instead of Lang.bind for named
call backs.

2018-08-10  Thanks to p-bo for adding Czech translation.
Uploaded for review.  Reviewer please see previous comment 2018-07-29.

2018-10-03 Completed changes for ES6.

2018-10-09 Uploaded for review.


2018-10-28 Added user selection of the panel button icons to indicate busy or
available status.  Owen Williams filed a bug report that the provided icons were
not clearly visible when using some user themes. We decided user selection of the
icons would be useful.  Changed prefs.js widget arrangement to better display
translated text.

2018-10-29 Uploaded for review.

2019-02-17 Added Busy State Timeout feature. Version 26.01.

----
Description of the Busy State Timeout Feature

The Panel Button has been changed. It continues to toggle the
extension state between Busy and Available when clicked with the
primary mouse button.  Since the Preferences Tool will be involved
with using the Busy State Timeout Feature, quick access to the
tool is provided by a secondary mouse click of the Panel Button.

New Icons

When a Busy State Timeout starts an icon is displayed, ⏳.

When the Busy State Timeout Feature is enabled by checking the
Enable Checkbox the duration of the timeout is calculated and
displayed along with an icon, ⌛.

Extension States

When the Busy State of the extension is set and the the Busy State
Timeout Feature is enabled the timeout will start. If during the
duration of a timeout the extension's state is changed from Busy to
Available the timeout will be canceled.

Preferences

If a timeout is in progress when the Preferences Tool is activated
the timeout is cancelled and the feature is disabled.

The Enable Check Box enables or disables the Busy State Timeout
Feature.

The Once Radio Button is used to select a one time timeout. When the
Enable Check Box is checked and the Once Radio Button is selected a
timeout starts when the extension's busy state is set. When the one
time timeout expires the Busy State Timeout Feature is disabled.
A notification is sent, "Timeout Once Busy State Timeout expired.
Timeout disabled". The Busy State Timeout Feature will not start
a new one time timeout until the Enable Check Box preference is
checked to re-enable the Busy State Timeout Feature.  If during the
duration of a one time timeout the Gnome Session is ended at the next
session start the Busy State Timeout Feature will be disabled and a
notification is displayed, "Timeout Once Found at Session Start Busy
Timeout is disabled".  If there are unviewed notifications in the
in the queue notifications may not be displayed but will be added
to the queue.

The Always Radio Button

The Always Radio Button sets a recurring timeout state. When the
Enable Check Box is checked and the Always Radio Button is selected
a timeout starts whenever the extension busy state is set.

The Hours Spin Button and the Minutes Spin Button are provided to
set the duration of the timeout timer.

When changing preferences the following behavior insures if a timeout
is in progress it will be canceled. Changing the state of the Once
Radio Button or Always Radio Button or changing the setting of the
Hours Spin Button or Minutes Spin Button will disable the Busy State
Timeout Feature.  After changes are made the Enable Check Box must be
checked to enable the Busy State Timeout Feature.

A timeout will start at Session Start if:

Busy State Override At Session Start is not enabled and the extension
was in the Busy State and the Busy State Timeout was enabled and the
Always Radio Button was active at last session end.

A timeout will start at Session Start if:

Busy State Override At Session Start is enabled  and the Busy Radio
Button is active and Busy State Timeout was enabled and the Always
Radio Button was active at last session end.

A timeout will start during the session if:

The user set the extension from Available to Busy with the Panel
Button and the Busy State Timeout Feature is enabled a timeout.

Uploaded for review 2019-03-16. Busy State Timeout feature.

2019-03-27 Updated for GS 3.32.  Changed default icons to be compatible
with No Notifications icon in the notifications area of the calendar.

2019-03-28 Uploaded for review.

-----

zip file: 2019-03-28 14:33:06 70a5e0ac3f83149b9e5b4ab48bc5ba0bd7782f41
