//
//  TicketWalletPlugin.swift
//  App
//
//  Created by Simon Mechler on 2026-04-24.
//

import Capacitor
import PassKit

@objc(TicketWalletPlugin)
/// Capacitor bridge for adding passes to Apple Wallet.
public class TicketWalletPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier: String = "TicketWalletPlugin"
    public let jsName: String = "TicketWallet"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "addTicket", returnType: CAPPluginReturnPromise)
    ]

    /// Adds a base64-encoded pass to Apple Wallet.
    @objc func addTicket(_ call: CAPPluginCall) {

        guard let passDataRaw = call.getString("passData") else {
            call.reject("Pass data is required")

            return
        }

        guard
            let passData = Data(
                base64Encoded: passDataRaw,
                options: .ignoreUnknownCharacters
            )
        else {
            call.reject("Failed to decode pass data")

            return
        }

        do {
            guard PKPassLibrary.isPassLibraryAvailable() else {
                call.reject("Pass library not available")

                return
            }

            let pass = try PKPass(data: passData)
            if PKPassLibrary().containsPass(pass) {
                call.reject("Pass already added")

                return
            }

            guard let viewController = PKAddPassesViewController(pass: pass)
            else {
                call.reject("Failed to create PKAddPassesViewController")

                return
            }

            DispatchQueue.main.async {
                self.bridge?.viewController?.present(
                    viewController,
                    animated: true
                )
            }

            call.resolve(["success": true])
        } catch {
            call.reject("Failed to create pass: \(error.localizedDescription)")
        }
    }
}
