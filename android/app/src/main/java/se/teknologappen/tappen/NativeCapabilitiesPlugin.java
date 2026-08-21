package se.teknologappen.tappen;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeCapabilities")
public class NativeCapabilitiesPlugin extends Plugin {
    @PluginMethod
    public void get(PluginCall call) {
        int firebaseAppId = getContext().getResources().getIdentifier(
            "google_app_id",
            "string",
            getContext().getPackageName()
        );
        JSObject result = new JSObject();
        result.put("pushConfigured", firebaseAppId != 0);
        call.resolve(result);
    }
}
