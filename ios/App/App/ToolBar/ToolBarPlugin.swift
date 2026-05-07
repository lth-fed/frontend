//
//  ToolBarPlugin.swift
//  App
//
//  Created by Simon Mechler on 2026-04-30.
//

import Capacitor
import UIKit

@objc(ToolBarPlugin)
public class ToolBarPlugin: CAPPlugin {

    // MARK: - Overlay

    private var overlayVC: ToolBarOverlay? {
        didSet {
            oldValue?.view.removeFromSuperview()
            oldValue?.removeFromParent()
        }
    }

    // MARK: - Configure

    @objc
    func configure(_ call: CAPPluginCall) {

        let visible = call.getBool("visible") ?? true

        let nodes = parseNodes(call.getArray("nodes"))

        DispatchQueue.main.async {

            self.ensureOverlay()

            self.overlayVC?.update(
                nodes: nodes,
                visible: visible
            )
        }

        call.resolve()
    }

    // MARK: - Show

    @objc
    func show(_ call: CAPPluginCall) {

        DispatchQueue.main.async {
            self.overlayVC?.view.isHidden = false
        }

        call.resolve()
    }

    // MARK: - Hide

    @objc
    func hide(_ call: CAPPluginCall) {

        DispatchQueue.main.async {
            self.overlayVC?.view.isHidden = true
        }

        call.resolve()
    }

    // MARK: - Overlay Setup

    private func ensureOverlay() {

        guard overlayVC == nil else { return }

        guard let hostVC = bridge?.viewController else { return }

        let overlay = ToolBarOverlay()

        overlay.onButtonTap = { [weak self] id in

            self?.notifyListeners(
                "buttonTap",
                data: [
                    "id": id as Any
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

            overlay.view.bottomAnchor.constraint(
                equalTo: hostVC.view.safeAreaLayoutGuide.bottomAnchor
            ),

            overlay.view.heightAnchor.constraint(
                equalToConstant: 50
            ),
        ])

        overlay.didMove(toParent: hostVC)

        overlayVC = overlay
    }

    // MARK: - Parse Nodes

    private func parseNodes(
        _ array: [Any]?
    ) -> [ToolBarNode] {

        guard let array else { return [] }

        return array.compactMap { item in

            guard let obj = item as? [String: Any] else {
                return nil
            }

            let type = obj["type"] as? String

            switch type {

            case "group":

                let spacingValue =
                    (obj["spacing"] as? String)?
                    .lowercased()

                let spacing: ToolBarSpacing

                switch spacingValue {

                case "connected":
                    spacing = .connected

                case "compact":

                    let gap = obj["gap"] as? CGFloat ?? 8

                    spacing = .compact(gap)

                default:
                    spacing = .compact(8)
                }

                let buttons = parseButtons(
                    obj["buttons"] as? [Any]
                )

                return .group(
                    buttons: buttons,
                    spacing: spacing
                )

            case "flexible-space":

                return .flexibleSpace

            case "fixed-space":

                let width = obj["width"] as? CGFloat ?? 8

                return .fixedSpace(width)

            default:
                return nil
            }
        }
    }

    // MARK: - Parse Buttons

    private func parseButtons(
        _ array: [Any]?
    ) -> [ToolBarButtonConfig] {

        guard let array else { return [] }

        return array.compactMap { item in

            guard let obj = item as? [String: Any] else {
                return nil
            }

            let style = parseStyle(
                obj["style"] as? String
            )

            return ToolBarButtonConfig(
                id: obj["id"] as? String,
                title: obj["title"] as? String,
                systemIcon: obj["systemIcon"] as? String,
                style: style
            )
        }
    }

    // MARK: - Parse Style

    private func parseStyle(
        _ value: String?
    ) -> UIBarButtonItem.Style? {

        switch value?.lowercased() {

        case "plain":
            return .plain

        case "prominent":
            if #available(iOS 26.0, *) {
                return .prominent
            }

            return .done

        default:
            return nil
        }
    }
}
