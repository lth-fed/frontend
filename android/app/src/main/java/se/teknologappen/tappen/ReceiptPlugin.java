package se.teknologappen.tappen;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "Receipt")
public class ReceiptPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        String data = call.getString("data");
        String filename = call.getString("filename", "receipt.pdf");
        if (data == null || data.isEmpty()) {
            call.reject("Receipt data is required");
            return;
        }

        try {
            File receipt = new File(getContext().getCacheDir(), filename);
            try (FileOutputStream output = new FileOutputStream(receipt)) {
                output.write(Base64.decode(data, Base64.DEFAULT));
            }
            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                receipt
            );
            Intent view = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/pdf")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(view, null));
            call.resolve(new JSObject());
        } catch (IOException | IllegalArgumentException error) {
            call.reject("Could not open receipt", error);
        }
    }
}
