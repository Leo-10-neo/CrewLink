package com.crewlink.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "CrewLinkBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || "android.intent.action.MY_PACKAGE_REPLACED".equals(action)) {
            Log.d(TAG, "Boot or package update received. Checking saved auth state...");

            SharedPreferences prefs = context.getSharedPreferences(CrewLinkBackgroundService.PREFS_NAME, Context.MODE_PRIVATE);
            String token = prefs.getString(CrewLinkBackgroundService.KEY_TOKEN, null);

            if (token != null && !token.trim().isEmpty()) {
                Log.d(TAG, "User logged in. Starting CrewLinkBackgroundService after boot.");
                Intent serviceIntent = new Intent(context, CrewLinkBackgroundService.class);
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        ContextCompat.startForegroundService(context, serviceIntent);
                    } else {
                        context.startService(serviceIntent);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to start service on boot: " + e.getMessage());
                }
            }
        }
    }
}
