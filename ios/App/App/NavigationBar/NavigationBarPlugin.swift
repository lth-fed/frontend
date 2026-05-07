//
//  NavigationBarPlugin.swift
//  App
//
//  Created by Simon Mechler on 2026-05-07.
//

import Capacitor
import UIKit

@objc(NavigationBarPlugin)
public class NavigationBarPlugin: CAPPlugin {

    private var overlayVC: NavigationBarOverlay? {
        didSet {
            oldValue?.view.removeFromSuperview()
            oldValue?.removeFromParent()
        }
    }

    // MARK: - Configure

    @objc
    func configure(_ call: CAPPluginCall) {

        let title = call.getString("title")

        let visible = call.getBool("visible") ?? true

        let backButton: NavBarButtonConfig? = {
            guard let obj = call.getObject("backButton") else {
                return nil
            }

            return NavBarButtonConfig(
                id: obj["id"] as? String,
                title: obj["title"] as? String,
                systemIcon: obj["systemIcon"] as? String,
                style: parseBarButtonStyle(obj["style"] as? String)
            )
        }()

        let actionButton: NavBarButtonConfig? = {
            guard let obj = call.getObject("actionButton") else {
                return nil
            }

            return NavBarButtonConfig(
                id: obj["id"] as? String,
                title: obj["title"] as? String,
                systemIcon: obj["systemIcon"] as? String,
                style: parseBarButtonStyle(obj["style"] as? String)
            )
        }()

        DispatchQueue.main.async {

            self.ensureOverlay()

            self.overlayVC?.update(
                title: title,
                backButton: backButton,
                actionButton: actionButton,
                visible: visible
            )
        }

        call.resolve()
    }

    // MARK: - Visibility

    @objc
    func show(_ call: CAPPluginCall) {

        DispatchQueue.main.async {
            self.overlayVC?.view.isHidden = false
        }

        call.resolve()
    }

    @objc
    func hide(_ call: CAPPluginCall) {

        DispatchQueue.main.async {
            self.overlayVC?.view.isHidden = true
        }

        call.resolve()
    }

    // MARK: - Title

    @objc
    func setTitle(_ call: CAPPluginCall) {

        let title = call.getString("title")

        DispatchQueue.main.async {
            self.overlayVC?.setTitle(title)
        }

        call.resolve()
    }

    // MARK: - Buttons

    @objc
    func setBackButton(_ call: CAPPluginCall) {

        let config = NavBarButtonConfig(
            id: call.getString("id"),
            title: call.getString("title"),
            systemIcon: call.getString("systemIcon"),
            style: parseBarButtonStyle(call.getString("style"))
        )

        DispatchQueue.main.async {
            self.overlayVC?.setBackButton(config)
        }

        call.resolve()
    }

    @objc
    func setActionButton(_ call: CAPPluginCall) {

        let config = NavBarButtonConfig(
            id: call.getString("id"),
            title: call.getString("title"),
            systemIcon: call.getString("systemIcon"),
            style: parseBarButtonStyle(call.getString("style"))
        )

        DispatchQueue.main.async {
            self.overlayVC?.setActionButton(config)
        }

        call.resolve()
    }

    // MARK: - Overlay

    private func ensureOverlay() {

        guard overlayVC == nil else {
            return
        }

        guard let hostVC = bridge?.viewController else {
            return
        }

        let overlay = NavigationBarOverlay()

        overlay.onBackButtonTap = { [weak self] id in
            self?.notifyListeners(
                "toolbarAction",
                data: [
                    "type": "back",
                    "id": id as Any,
                ]
            )
        }

        overlay.onActionButtonTap = { [weak self] id in
            self?.notifyListeners(
                "toolbarAction",
                data: [
                    "type": "action",
                    "id": id as Any,
                ]
            )
        }

        hostVC.addChild(overlay)

        hostVC.view.addSubview(overlay.view)

        overlay.view.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            overlay.view.leadingAnchor.constraint(
                equalTo: hostVC.view.leadingAnchor
            ),
            overlay.view.trailingAnchor.constraint(
                equalTo: hostVC.view.trailingAnchor
            ),
            overlay.view.topAnchor.constraint(
                equalTo: hostVC.view.safeAreaLayoutGuide.topAnchor
            ),
        ])

        overlay.didMove(toParent: hostVC)

        overlayVC = overlay
    }

    private func parseBarButtonStyle(_ value: String?) -> UIBarButtonItem.Style?
    {

        guard let value = value?.lowercased() else {
            return nil
        }

        switch value {

        case "plain":
            return .plain

        case "prominent":
            if #available(iOS 26.0, *) {
                return .prominent
            } else {
                return .done
            }

        default:
            return nil
        }
    }
}
