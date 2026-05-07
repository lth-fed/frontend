package se.teknologappen.tappen;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "TicketWallet")
public class TicketWalletPlugin extends Plugin {
    @PluginMethod()
    public void addTicket(PluginCall call) {
        String passData = call.getString("passData");

        if (passData == null || passData.isEmpty()) {
            call.reject("Pass data is required");

            return;
        }

        byte[] decodedPassData = Base64.decode(passData, Base64.DEFAULT);

        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            executor.submit(new SavePassTask(call, new WeakReference<>(getContext()), decodedPassData));
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Error submitting the task.");
        }
    }

    private record SavePassTask(PluginCall call, WeakReference<Context> contextRef,
                                byte[] passData) implements Runnable {

        @Override
        public void run() {
            Context context = contextRef.get();
            if (context == null) {
                call.reject("Context is no longer available.");

                return;
            }

            File file = new File(context.getCacheDir(), "ticket.pkpass");

            try {
                savePassToFile(file);

                Uri uri = FileProvider.getUriForFile(
                        context,
                        "se.teknologappen.tappen.fileprovider",
                        file
                );

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/vnd.apple.pkpass");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                if (intent.resolveActivity(context.getPackageManager()) != null) {
                    context.startActivity(intent);
                    call.resolve(new JSObject().put("success", true));
                } else {
                    call.reject("No app found to handle the pass.");
                }
            } catch (Exception e) {
                e.printStackTrace();
                call.reject("Error processing the pass.");
            }
        }

        private void savePassToFile(File file) throws IOException {
            try (FileOutputStream fileOutputStream = new FileOutputStream(file)) {
                fileOutputStream.write(passData);
            }
        }
    }
}