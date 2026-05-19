import Capacitor
import UIKit

@objc(NativeButtonPlugin)
/// Capacitor bridge for the native button overlay.
public class NativeButtonPlugin: CAPPlugin {

    private var overlayVC: NativeButtonOverlay? {
        didSet {
            oldValue?.view.removeFromSuperview()
            oldValue?.removeFromParent()
        }
    }

    /// Applies a new button configuration from JavaScript.
    @objc
    func configure(_ call: CAPPluginCall) {
        let button: NativeButtonConfig? = {
            return NativeButtonConfig(
                id: call.getString("id"),
                title: call.getString("title"),
                systemIcon: call.getString("systemIcon"),
                style: parseStyle(call.getString("style")),
                size: parseSize(call.getString("size")),
                visible: call.getBool("visible") ?? true,
                enabled: call.getBool("enabled") ?? true,
                fullWidth: call.getBool("fullWidth") ?? false,
                iconTextSpacing: CGFloat(call.getInt("iconTextSpacing") ?? 10),
                fontWeight: parseFontWeight(call.getString("fontWeight")),
                scrollEdgeEffect: call.getBool("scrollEdgeEffect") ?? false,
                backgroundColor: ColorUtils.parseColor(
                    call.getString("backgroundColor")
                ),
                foregroundColor: ColorUtils.parseColor(
                    call.getString("foregroundColor")
                ),
                edge: parseEdge(call.getString("edge")),
                alignment: call.getString("alignment")
            )
        }()

        DispatchQueue.main.async {
            self.ensureOverlay()
            self.overlayVC?.update(config: button)

            if let hostView = self.bridge?.viewController?.view {
                self.overlayVC?.updateScrollEdgeEffect(
                    enabled: button?.scrollEdgeEffect ?? false,
                    in: hostView
                )
            }
        }

        call.resolve()
    }

    /// Shows the native button overlay.
    @objc
    func show(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.overlayVC?.view.isHidden = false
        }

        call.resolve()
    }

    /// Hides the native button overlay.
    @objc
    func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.overlayVC?.view.isHidden = true
        }

        call.resolve()
    }

    private func parseStyle(_ value: String?) -> UIButton.Configuration {
        guard let value = value?.lowercased() else {
            return UIButton.Configuration.plain()
        }

        switch value {
        case "prominentglass":
            if #available(iOS 26.0, *) {
                return UIButton.Configuration.prominentGlass()
            }
            return UIButton.Configuration.borderedProminent()
        case "prominentclearglass":
            if #available(iOS 26.0, *) {
                return UIButton.Configuration.prominentClearGlass()
            }
            return UIButton.Configuration.borderedProminent()
        case "borderedprominent":
            return UIButton.Configuration.borderedProminent()
        case "filled":
            return UIButton.Configuration.filled()
        case "tinted":
            return UIButton.Configuration.tinted()
        case "gray":
            return UIButton.Configuration.gray()
        case "bordered":
            return UIButton.Configuration.bordered()
        default:
            return UIButton.Configuration.plain()
        }
    }

    private func parseSize(_ value: String?) -> UIButton.Configuration.Size {
        guard let value = value?.lowercased() else {
            return .large
        }

        switch value {
        case "small":
            return .small
        case "medium":
            return .medium
        default:
            return .large
        }
    }

    private func parseEdge(_ value: String?) -> UIRectEdge {
        guard let value = value?.lowercased() else {
            return .bottom
        }

        switch value {
        case "top":
            return .top
        default:
            return .bottom
        }
    }

    // alignment: 'left' | 'center' | 'right'
    private func parseAlignment(_ value: String?) -> String? {
        guard let value = value?.lowercased() else { return nil }

        switch value {
        case "left", "center", "right":
            return value
        default:
            return nil
        }
    }

    private func parseFontWeight(_ value: String?) -> UIFont.Weight? {
        guard let value = value?.lowercased() else {
            return nil
        }

        switch value {
        case "ultralight":
            return .ultraLight
        case "thin":
            return .thin
        case "light":
            return .light
        case "medium":
            return .medium
        case "semibold":
            return .semibold
        case "bold":
            return .bold
        case "heavy":
            return .heavy
        case "black":
            return .black
        default:
            return .regular
        }
    }

    private func ensureOverlay() {
        guard overlayVC == nil else {
            return
        }

        guard let hostVC = bridge?.viewController else {
            return
        }

        let overlay = NativeButtonOverlay()

        overlay.onTap = { [weak self] id in
            self?.notifyListeners(
                "tap",
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
            overlay.view.topAnchor.constraint(equalTo: hostVC.view.topAnchor),
            overlay.view.bottomAnchor.constraint(
                equalTo: hostVC.view.bottomAnchor
            ),
        ])

        overlay.didMove(toParent: hostVC)

        overlayVC = overlay
    }
}
