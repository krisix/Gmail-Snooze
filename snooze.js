/**
 * Gmail Snooze by Cezary Piekacz
 * https://github.com/cpiekacz/Gmail-Snooze
 *
 * About
 * =====
 *
 * Gmail Snooze is a Google Apps Script which allows e-mail snoozing. It removes
 * e-mails marked by one of the labels from inbox and bring them back later at a
 * predefined time. It was inspired by the Mailbox application for iPhone.
 *
 * How to install
 * ==============
 *
 * 1. Login to your Google Drive
 * 2. Create a new script
 * 3. Paste the code bellow
 * 4. Define your own labels and trigger hours in the SETUP section
 * 5. Save the script
 * 6. Click on 'Run > Install' in main menu, this will create labels in Gmail and
 *	  define the following triggers:
 *	    - cleanLabels - Time-driven - Minute timer - Every minute
 *	    - runEvening - Time-driven - Day timer - 18:00 - 19:00
 *	    - runTomorrow - Time-driven - Day timer - 6:00 - 7:00 (or earlier)
 *	    - runSaturday - Time-driven - Week timer - Every saturday at 6:00 - 7:00
 * 7. Authorize the script and grant access to Gmail
 *
 * How to customize
 * ==============
 *
 * You can change names of the labels as well as times at which events are fired.
 * To do that just edit the coresponing parameters in the SETUP section of the
 * script. You can also disable marking e-mail as unread after they are moved back
 * into inbox. To do that just set the markUnread parameter to false.
 *
 * How to use
 * ==========
 *
 * When you want to snooze an email for one day, just mark it with label Tomorrow.
 * After one minute it will be removed from your Inbox and marked as read. The next
 * in the morning (at the time of you choosing), this script will bring this e-mail
 * back to your inbox and mark it as unread.
 *
 * Licence
 * =======
 *
 * Gmail Snooze is available under the MIT license.
 *
 * Copyright © 2013 Cezary Piekacz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in the
 * Software without restriction, including without  * limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so, subject
 * to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 **/

var SETUP = {
	// Used to group all the snooze labels
	groupingLabel: 'Remind me',

	// Labels used for marking e-mails
	labels: {
		evening:  'In the evening',
		tomorrow: 'Tomorrow',
		saturday: 'On Saturday' 
	},
	
	// Hours at which triggers will be fired
	hours: {
		evening: 18, // In the evening at 6PM
		tomorrow: 6, // Tomorrow at 6AM
		saturday: 6  // On Saturday at 6AM
	},

	// Mark messages unread after moving them back into inbox
	markUnread: true
}

/*** DO NOT EDIT BELOW THIS LINE ***/

function Install() {
	// Creates labels in Gmail and triggers for events
	GmailApp.createLabel(SETUP.groupingLabel);
	
	for (var i in SETUP.labels)
		GmailApp.createLabel(SETUP.groupingLabel + '/' + SETUP.labels[i]);
	
	// Delete all current script triggers
	var triggers = ScriptApp.getScriptTriggers();
	for (var i in SETUP.triggers)
		ScriptApp.deleteTrigger(SETUP.triggers[i]);
	
	// Create script triggers
	ScriptApp.newTrigger("cleanLabels").timeBased().everyMinutes(1).create();
	ScriptApp.newTrigger("runEvening").timeBased().everyDays(1).atHour(SETUP.hours.evening).create();
	ScriptApp.newTrigger("runTomorrow").timeBased().everyDays(1).atHour(SETUP.hours.tomorrow).create();
	ScriptApp.newTrigger("runSaturday").timeBased().onWeekDay(ScriptApp.WeekDay.SATURDAY).atHour(SETUP.hours.saturday).create();
}

function __moveEmailsToInbox(labelName) {
	/**
	 * Moves messages from label <labelName> back into Inbox
	 *
	 * @param labelName Second part of the labels name
	 * @access private
	 **/
	var label = GmailApp.getUserLabelByName(SETUP.groupingLabel + '/' + labelName);
	var threads = null;
	
	// Get threads 100 at a time
	while (!threads || threads.length == 100) {
		threads = label.getThreads(0, 100);

		if (threads.length == 0)
			return;
		 
		GmailApp.moveThreadsToInbox(threads);

		if (SETUP.markUnread)
			GmailApp.markThreadsUnread(threads);
			
		label.removeFromThreads(threads);
	}
}

function cleanLabels() {
	/**
	 * Removes e-mails which have one of the labels defined in SETUP from Inbox
	 * and markes them as read. This function is used just to clean Inbox and labels.
	 * Trigger this function to run every day at every minute
	 *
	 * @access public
	 **/
	for (var i in SETUP.labels) {
		var label = GmailApp.getUserLabelByName(SETUP.groupingLabel + '/' + SETUP.labels[i]);
		var threads = null;

		// Get threads 100 at a time
		while (!threads || threads.length == 100) {
			threads = label.getThreads(0, 100);
			
			if (threads.length == 0)
				return;
			
			GmailApp.markThreadsRead(threads);
		GmailApp.moveThreadsToArchive(threads);
		}
	}
}

function runEvening() {
	/**
	 * Moves e-mails from 'In the evening' label back into Inbox
	 * Trigger this function to run every day in the evening, e.g. 18:00 - 19:00
	 *
	 * @access public
	 **/
	__moveEmailsToInbox(SETUP.labels.evening);
}

function runTomorrow() {
	/**
	 * Moves e-mails from 'Tomorrow' label back into Inbox
	 * Trigger this function to run every day in the morning, e.g. 6:00 - 7:00
	 *
	 * @access public
	 **/
	__moveEmailsToInbox(SETUP.labels.tomorrow);
}

function runSaturday() {
	/**
	 * Moves e-mails from 'On Saturday' label back into Inbox
	 * Trigger this function to run every Saturday in the morning, e.g. 6:00 - 7:00
	 *
	 * @access public
	 **/
	__moveEmailsToInbox(SETUP.labels.saturday);
}