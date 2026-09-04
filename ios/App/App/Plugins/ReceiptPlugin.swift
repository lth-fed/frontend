//
//  ReceiptPlugin.swift
//  App
//
//  Created by Simon Mechler on 2026-08-28.
//

import Capacitor
import QuickLook
import UIKit

@objc(ReceiptPlugin)
/// Capacitor bridge for previewing a downloaded PDF receipt. WKWebView doesn't honor
/// `<a download>`/blob URLs the way a browser does, so the JS side hands the raw PDF
/// bytes here and we show it in QuickLook, which lets the user read it and, from its
/// own toolbar, save/share it or just close the preview.
public class ReceiptPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier: String = "ReceiptPlugin"
    public let jsName: String = "Receipt"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    /// Read lazily by QLPreviewControllerDataSource, so it must outlive `open(_:)`.
    private var previewURL: URL?

    @objc func open(_ call: CAPPluginCall) {
        guard let dataString = call.getString("data"), !dataString.isEmpty else {
            call.reject("Receipt data is required")
            return
        }
        guard
            let data = Data(
                base64Encoded: dataString,
                options: .ignoreUnknownCharacters
            )
        else {
            call.reject("Failed to decode receipt data")
            return
        }
        let filename = call.getString("filename") ?? "receipt.pdf"

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(filename)
        do {
            try data.write(to: url, options: .atomic)
        } catch {
            call.reject("Could not save receipt: \(error.localizedDescription)")
            return
        }

        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController else {
                call.reject("Could not present receipt preview")
                return
            }

            self.previewURL = url

            let preview = QLPreviewController()
            preview.dataSource = self
            preview.delegate = self

            presenter.present(preview, animated: true) {
                call.resolve()
            }
        }
    }
}

extension ReceiptPlugin: QLPreviewControllerDataSource {
    public func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
        previewURL == nil ? 0 : 1
    }

    public func previewController(
        _ controller: QLPreviewController,
        previewItemAt index: Int
    ) -> QLPreviewItem {
        (previewURL as NSURL?) ?? NSURL()
    }
}

extension ReceiptPlugin: QLPreviewControllerDelegate {
    /// `temporaryDirectory` isn't cleaned up promptly by the OS while the app keeps running,
    /// so remove the file ourselves once the user is done viewing it.
    public func previewControllerDidDismiss(_ controller: QLPreviewController) {
        guard let url = previewURL else { return }
        previewURL = nil
        try? FileManager.default.removeItem(at: url)
    }
}
