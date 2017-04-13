package rocks.crownstone.consumerapp;

import android.app.Activity;

import no.nordicsemi.android.dfu.DfuBaseService;

/**
 * Copyright (c) 2015 Bart van Vliet <bart@dobots.nl>. All rights reserved.
 * <p/>
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3, as
 * published by the Free Software Foundation.
 * <p/>
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 3 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 * <p/>
 * Created on 11-4-17
 *
 * @author Bart van Vliet
 */
public class DfuService extends DfuBaseService {
	@Override
	protected Class<? extends Activity> getNotificationTarget() {

        /*
         * As a target activity the NotificationActivity is returned, not the MainActivity. This is because
         * the notification must create a new task:
         *
         * intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
         *
         * when you press it. You can use NotificationActivity to check whether the new activity
         * is a root activity (that means no other activity was open earlier) or that some
         * other activity is already open. In the latter case the NotificationActivity will just be
         * closed. The system will restore the previous activity. However, if the application has been
         * closed during upload and you click the notification, a NotificationActivity will
         * be launched as a root activity. It will create and start the main activity and
         * terminate itself.
         *
         * This method may be used to restore the target activity in case the application
         * was closed or is open. It may also be used to recreate an activity history using
         * startActivities(...).
         */
		return NotificationActivity.class;
	}

	@Override
	protected boolean isDebug() {
		// Here return true if you want the service to print more logs in LogCat.
		// Library's BuildConfig in current version of Android Studio is always set to DEBUG=false, so
		// make sure you return true or your.app.BuildConfig.DEBUG here.
		return BuildConfig.DEBUG;
	}
}
