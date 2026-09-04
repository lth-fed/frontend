package se.teknologappen.tappen;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        registerPlugin(NativeCapabilitiesPlugin.class);
        registerPlugin(ReceiptPlugin.class);
        registerPlugin(TicketWalletPlugin.class);
        super.onCreate(savedInstanceState);

        // Capacitor's push plugin processes taps in onNewIntent(). Android does not invoke that
        // callback for the intent which creates a cold app process, so forward only an initial
        // FCM notification intent after the bridge and plugins have loaded. The plugin retains
        // the event until the web listener is registered.
        Intent launchIntent = getIntent();
        Bundle extras = launchIntent == null ? null : launchIntent.getExtras();
        if (extras != null && extras.containsKey("google.message_id")) {
            onNewIntent(launchIntent);
        }
    }
}
