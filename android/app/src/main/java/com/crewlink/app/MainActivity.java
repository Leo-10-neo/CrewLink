package com.crewlink.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "CrewLinkMainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CrewLinkSyncPlugin.class);
        super.onCreate(savedInstanceState);

        // Prevent top bar collision by offsetting status bar height
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            int statusBarHeight = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            v.setPadding(0, statusBarHeight, 0, 0);
            return insets;
        });

        try {
            WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
            controller.setAppearanceLightStatusBars(true);
        } catch (Exception ignored) {}

        handleNotificationIntent(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        CrewLinkBackgroundService.isAppInForeground = true;
        updateForegroundState(true);
    }

    @Override
    public void onPause() {
        super.onPause();
        CrewLinkBackgroundService.isAppInForeground = false;
        updateForegroundState(false);
    }

    private void updateForegroundState(boolean isForeground) {
        try {
            SharedPreferences prefs = getSharedPreferences(CrewLinkBackgroundService.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(CrewLinkBackgroundService.KEY_IS_FOREGROUND, isForeground).apply();
        } catch (Exception ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationIntent(intent);
    }

    private void handleNotificationIntent(Intent intent) {
        if (intent == null) return;

        String taskId = intent.getStringExtra("taskId");
        String role = intent.getStringExtra("role");
        String link = intent.getStringExtra("link");

        if (taskId != null && !taskId.trim().isEmpty()) {
            Log.d(TAG, "Notification clicked with taskId: " + taskId + ", role: " + role);

            // Persist to SharedPreferences
            try {
                SharedPreferences prefs = getSharedPreferences(CrewLinkBackgroundService.PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit().putString("openChatForTask", taskId).apply();
            } catch (Exception ignored) {}

            // Delay slightly to ensure WebView is ready, then dispatch event and update URL
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().postDelayed(() -> {
                    try {
                        String targetUrl = "admin".equalsIgnoreCase(role)
                                ? "/admin/dashboard?view=tasks&taskId=" + taskId
                                : "/volunteer/event-support/" + taskId;

                        String js = String.format(
                                "sessionStorage.setItem('openChatForTask', '%s');" +
                                "localStorage.setItem('openChatForTask', '%s');" +
                                "window.dispatchEvent(new CustomEvent('crewlink:openChat', { detail: { taskId: '%s' } }));" +
                                "if (!window.location.pathname.includes('%s')) { window.location.href = '%s'; }",
                                taskId, taskId, taskId, taskId, targetUrl
                        );

                        getBridge().getWebView().evaluateJavascript(js, null);
                        Log.d(TAG, "Injected notification navigation JS: " + js);
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to evaluate JS for notification: " + e.getMessage());
                    }
                }, 600);
            }
        } else if (link != null && !link.trim().isEmpty()) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().postDelayed(() -> {
                    try {
                        String js = "window.location.href = '" + link + "';";
                        getBridge().getWebView().evaluateJavascript(js, null);
                    } catch (Exception ignored) {}
                }, 600);
            }
        }
    }
}
