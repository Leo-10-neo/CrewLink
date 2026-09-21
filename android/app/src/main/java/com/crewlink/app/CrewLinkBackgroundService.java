package com.crewlink.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class CrewLinkBackgroundService extends Service {
    private static final String TAG = "CrewLinkService";
    public static final String PREFS_NAME = "CrewLinkPrefs";
    public static final String KEY_TOKEN = "authToken";
    public static final String KEY_ROLE = "userRole";
    public static final String KEY_SERVER_URL = "serverUrl";
    public static final String KEY_IS_FOREGROUND = "isAppInForeground";

    private static final String CHANNEL_SYNC_ID = "crewlink_sync_channel";
    private static final String CHANNEL_ALERTS_ID = "crewlink_chat_alerts";
    private static final int FOREGROUND_NOTIFICATION_ID = 9001;

    private static final AtomicBoolean isRunning = new AtomicBoolean(false);
    public static volatile boolean isAppInForeground = false;

    private ExecutorService executor;
    private final Set<String> seenNotificationIds = Collections.synchronizedSet(new HashSet<>());
    private boolean isInitialPoll = true;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "CrewLinkBackgroundService onCreate");
        createNotificationChannels();
        startServiceForeground();

        executor = Executors.newSingleThreadExecutor();
        isRunning.set(true);
        executor.execute(this::pollLoop);
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;

            // 1. Silent sync channel for ongoing foreground service
            NotificationChannel syncChannel = new NotificationChannel(
                    CHANNEL_SYNC_ID,
                    "CrewLink Service Status",
                    NotificationManager.IMPORTANCE_LOW
            );
            syncChannel.setDescription("Keeps CrewLink connected to receive task alerts and messages.");
            syncChannel.setShowBadge(false);
            syncChannel.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
            manager.createNotificationChannel(syncChannel);

            // 2. High priority alert channel for task messages
            NotificationChannel alertChannel = new NotificationChannel(
                    CHANNEL_ALERTS_ID,
                    "CrewLink Task & Chat Messages",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.setDescription("Alerts for new messages and task assignments.");
            alertChannel.enableLights(true);
            alertChannel.setLightColor(Color.BLUE);
            alertChannel.enableVibration(true);
            alertChannel.setVibrationPattern(new long[]{0, 250, 150, 250});
            alertChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(alertChannel);
        }
    }

    private void startServiceForeground() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_SYNC_ID)
                .setContentTitle("CrewLink")
                .setContentText("Active in background • Ready for messages")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE);

        Notification notification = builder.build();

        try {
            if (Build.VERSION.SDK_INT >= 34) { // Android 14+
                startForeground(FOREGROUND_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(FOREGROUND_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(FOREGROUND_NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting foreground service: " + e.getMessage());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startServiceForeground();
        return START_STICKY; // Instructs OS to recreate service if killed
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "App task cleared/swiped from recents. Scheduling quick restart alarm.");
        isAppInForeground = false;

        // Schedule an alarm to ensure service stays alive even if process is recycled
        Intent restartIntent = new Intent(getApplicationContext(), CrewLinkBackgroundService.class);
        PendingIntent restartPending = PendingIntent.getService(
                getApplicationContext(),
                1,
                restartIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 1500, restartPending);
        }
    }

    private void pollLoop() {
        while (isRunning.get()) {
            try {
                checkNewNotifications();
            } catch (Throwable t) {
                Log.w(TAG, "Poll error: " + t.getMessage());
            }

            try {
                // Poll every 3.5 seconds
                Thread.sleep(3500);
            } catch (InterruptedException e) {
                break;
            }
        }
    }

    private void checkNewNotifications() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String token = prefs.getString(KEY_TOKEN, null);
        String serverUrl = prefs.getString(KEY_SERVER_URL, null);
        String role = prefs.getString(KEY_ROLE, "volunteer");

        if (token == null || token.trim().isEmpty() || serverUrl == null || serverUrl.trim().isEmpty()) {
            return;
        }

        // Format base URL
        String base = serverUrl.trim().replaceAll("/+$", "");
        String endpoint = "admin".equalsIgnoreCase(role)
                ? base + "/api/notifications/admin"
                : base + "/api/notifications";

        HttpURLConnection conn = null;
        try {
            URL url = new URL(endpoint);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);

            int status = conn.getResponseCode();
            if (status == 200) {
                consecutiveNetworkErrors = 0;
                InputStream is = conn.getInputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONArray array = new JSONArray(response.toString());

                // On the very first poll, register existing IDs so we only alert on truly *new* incoming messages
                if (isInitialPoll) {
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject obj = array.optJSONObject(i);
                        if (obj != null) {
                            String id = obj.optString("_id", "");
                            if (!id.isEmpty()) seenNotificationIds.add(id);
                        }
                    }
                    isInitialPoll = false;
                    return;
                }

                // Check for new unread notifications
                for (int i = 0; i < array.length(); i++) {
                    JSONObject notif = array.optJSONObject(i);
                    if (notif == null) continue;

                    String id = notif.optString("_id", "");
                    boolean read = notif.optBoolean("read", false);

                    if (!read && !id.isEmpty() && !seenNotificationIds.contains(id)) {
                        seenNotificationIds.add(id);

                        // Only show outside notification if the app is currently in background or cleared
                        boolean inForeground = isAppInForeground || prefs.getBoolean(KEY_IS_FOREGROUND, false);
                        if (!inForeground) {
                            String message = notif.optString("message", "New notification");
                            String taskId = notif.optString("taskId", "");
                            String link = notif.optString("link", "");

                            if (taskId.isEmpty() && !link.isEmpty() && link.contains("taskId=")) {
                                try {
                                    int idx = link.indexOf("taskId=");
                                    String sub = link.substring(idx + 7);
                                    int amp = sub.indexOf('&');
                                    taskId = (amp != -1) ? sub.substring(0, amp) : sub;
                                } catch (Exception ignored) {}
                            }

                            String title = "admin".equalsIgnoreCase(role)
                                    ? "CrewLink • Admin"
                                    : (message.toLowerCase().contains("admin") ? "CrewLink • Admin" : "CrewLink");

                            showChatMessageNotification(id.hashCode(), title, message, taskId, role, link);
                        }
                    }
                }
            } else {
                handleNetworkFailure(prefs);
            }
        } catch (Exception e) {
            Log.d(TAG, "Fetch notifications exception: " + e.getMessage());
            handleNetworkFailure(prefs);
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private int consecutiveNetworkErrors = 0;

    private void handleNetworkFailure(SharedPreferences prefs) {
        consecutiveNetworkErrors++;
        if (consecutiveNetworkErrors >= 2) {
            String updatedUrl = fetchLiveUrlFromRegistry();
            if (updatedUrl != null && !updatedUrl.isEmpty()) {
                Log.d(TAG, "Native service self-healed tunnel URL from registry: " + updatedUrl);
                prefs.edit().putString(KEY_SERVER_URL, updatedUrl).apply();
                consecutiveNetworkErrors = 0;
            }
        }
    }

    private String fetchLiveUrlFromRegistry() {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://raw.githubusercontent.com/Leo-10-neo/CrewLink/main/current_tunnel_url.txt?_cb=" + System.currentTimeMillis());
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            if (conn.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String line = reader.readLine();
                reader.close();
                if (line != null && line.contains("trycloudflare.com")) {
                    return line.trim();
                }
            }
        } catch (Exception ignored) {}
        finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    private void showChatMessageNotification(int notifId, String title, String message, String taskId, String role, String link) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("taskId", taskId);
        intent.putExtra("role", role);
        intent.putExtra("link", link);
        intent.putExtra("fromNotification", true);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                notifId,
                intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ALERTS_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setVibrate(new long[]{0, 250, 150, 250})
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(pendingIntent);

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(notifId, builder.build());
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "CrewLinkBackgroundService onDestroy");
        isRunning.set(false);
        if (executor != null) {
            executor.shutdownNow();
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
