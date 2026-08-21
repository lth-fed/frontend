package se.teknologappen.tappen;

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
    }
}
