package com.crewlink.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CrewLinkSync")
public class CrewLinkSyncPlugin extends Plugin {
    private static final String TAG = "CrewLinkSyncPlugin";

    @PluginMethod
    public void syncUser(PluginCall call) {
        String token = call.getString("token");
        String role = call.getString("role", "volunteer");
        String serverUrl = call.getString("serverUrl");

        if (token == null || serverUrl == null) {
            call.reject("Missing token or serverUrl");
            return;
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(CrewLinkBackgroundService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putString(CrewLinkBackgroundService.KEY_TOKEN, token)
                .putString(CrewLinkBackgroundService.KEY_ROLE, role)
                .putString(CrewLinkBackgroundService.KEY_SERVER_URL, serverUrl)
                .putBoolean(CrewLinkBackgroundService.KEY_IS_FOREGROUND, true)
                .apply();

        try {
            Intent serviceIntent = new Intent(context, CrewLinkBackgroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.d(TAG, "CrewLinkBackgroundService started from syncUser");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start service: " + e.getMessage());
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void clearUser(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(CrewLinkBackgroundService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();

        try {
            Intent serviceIntent = new Intent(context, CrewLinkBackgroundService.class);
            context.stopService(serviceIntent);
            Log.d(TAG, "CrewLinkBackgroundService stopped from clearUser");
        } catch (Exception ignored) {}

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setAppForeground(PluginCall call) {
        boolean isForeground = call.getBoolean("isForeground", true);
        CrewLinkBackgroundService.isAppInForeground = isForeground;

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(CrewLinkBackgroundService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(CrewLinkBackgroundService.KEY_IS_FOREGROUND, isForeground).apply();

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getInitialTask(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(CrewLinkBackgroundService.PREFS_NAME, Context.MODE_PRIVATE);
        String taskId = prefs.getString("openChatForTask", null);

        if (taskId != null) {
            prefs.edit().remove("openChatForTask").apply();
        }

        JSObject ret = new JSObject();
        ret.put("taskId", taskId);
        call.resolve(ret);
    }

    @PluginMethod
    public void openUpiApp(PluginCall call) {
        String upiUri = call.getString("upiUri");
        String app = call.getString("app", "any"); // "gpay", "phonepe", "paytm", "any"

        if (upiUri == null || upiUri.trim().isEmpty()) {
            call.reject("Missing upiUri");
            return;
        }

        try {
            Context context = getContext();
            android.net.Uri uri = android.net.Uri.parse(upiUri);
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            String targetPackage = null;
            if ("gpay".equalsIgnoreCase(app) || "googlepay".equalsIgnoreCase(app)) {
                targetPackage = "com.google.android.apps.nbu.paisa.user";
            } else if ("phonepe".equalsIgnoreCase(app)) {
                targetPackage = "com.phonepe.app";
            } else if ("paytm".equalsIgnoreCase(app)) {
                targetPackage = "net.one97.paytm";
            } else if ("bhim".equalsIgnoreCase(app)) {
                targetPackage = "in.org.npci.upiapp";
            }

            if (targetPackage != null) {
                intent.setPackage(targetPackage);
                try {
                    context.startActivity(intent);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("app", app);
                    ret.put("package", targetPackage);
                    call.resolve(ret);
                    return;
                } catch (Exception notInstalled) {
                    Log.w(TAG, "Specific app package " + targetPackage + " not found or failed, falling back to chooser: " + notInstalled.getMessage());
                    intent.setPackage(null);
                }
            }

            // Fallback to system chooser showing all installed UPI apps
            String amount = call.getString("amount", "");
            String chooserTitle = (amount != null && !amount.isEmpty()) ? "Pay ₹" + amount + " via UPI" : "Pay via UPI";
            Intent chooser = Intent.createChooser(intent, chooserTitle);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("app", "chooser");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch UPI payment app: " + e.getMessage());
            call.reject("Could not launch UPI app: " + e.getMessage());
        }
    }
}
