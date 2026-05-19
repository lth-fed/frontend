//
//  NativeButtonOverlay.swift
//  App
//
//  Created by Simon Mechler on 2026-05-11.
//

import UIKit

/// Configuration used to render the native button overlay.
struct NativeButtonConfig {
    let id: String?
    let title: String?
    let systemIcon: String?
    let style: UIButton.Configuration
    let size: UIButton.Configuration.Size
    let visible: Bool
    let enabled: Bool
    let fullWidth: Bool
    let iconTextSpacing: CGFloat
    let fontWeight: UIFont.Weight?
    let scrollEdgeEffect: Bool
    let backgroundColor: UIColor?
    let foregroundColor: UIColor?
    let edge: UIRectEdge
    let alignment: String?
}

/// Container view that passes touches through unless they hit the button.
final class NativeButtonPassthroughView: UIView {
    weak var interactiveView: UIView?

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let interactiveView else {
            return nil
        }

        let pointInInteractiveView = interactiveView.convert(point, from: self)

        guard interactiveView.bounds.contains(pointInInteractiveView) else {
            return nil
        }

        return super.hitTest(point, with: event)
    }
}

/// View controller that hosts and positions the native button overlay.
final class NativeButtonOverlay: UIViewController, ScrollEdgeElementContainer {

    private let button = UIButton()
    private var leadingConstraint: NSLayoutConstraint?
    private var trailingConstraint: NSLayoutConstraint?
    private var topConstraint: NSLayoutConstraint?
    private var bottomConstraint: NSLayoutConstraint?
    private var centerXConstraint: NSLayoutConstraint?
    private var centerYConstraint: NSLayoutConstraint?

    var scrollEdgeInteraction: Any?
    var scrollEdgeEdge: UIRectEdge = .bottom

    /// Identifier from the latest configuration payload.
    private(set) var currentButtonId: String?

    /// Called when the user taps the native button.
    var onTap: ((String?) -> Void)?

    /// Uses a pass-through root view so only the button intercepts touches.
    override func loadView() {
        view = NativeButtonPassthroughView()
    }

    /// Builds the button once the view hierarchy is loaded.
    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .clear

        setupButton()
    }

    /// Creates the button and its placement constraints.
    private func setupButton() {
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addTarget(
            self,
            action: #selector(buttonTapped),
            for: .touchUpInside
        )

        view.addSubview(button)

        if let passthroughView = view as? NativeButtonPassthroughView {
            passthroughView.interactiveView = button
        }

        leadingConstraint = button.leadingAnchor.constraint(
            equalTo: view.safeAreaLayoutGuide.leadingAnchor,
            constant: 25
        )
        trailingConstraint = button.trailingAnchor.constraint(
            equalTo: view.safeAreaLayoutGuide.trailingAnchor,
            constant: -25
        )
        topConstraint = button.topAnchor.constraint(
            equalTo: view.safeAreaLayoutGuide.topAnchor,
            constant: 0
        )
        bottomConstraint = button.bottomAnchor.constraint(
            equalToSystemSpacingBelow: view.safeAreaLayoutGuide.bottomAnchor,
            multiplier: 1
        )
        centerXConstraint = button.centerXAnchor.constraint(
            equalTo: view.safeAreaLayoutGuide.centerXAnchor
        )
        centerYConstraint = button.centerYAnchor.constraint(
            equalTo: view.safeAreaLayoutGuide.centerYAnchor
        )

        // Default placement until first configure call arrives.
        NSLayoutConstraint.activate([
            centerXConstraint!,
            bottomConstraint!,
        ])
    }

    /// Applies a new configuration to the button.
    func update(config: NativeButtonConfig?) {
        currentButtonId = config?.id

        var buttonConfiguration = config?.style

        buttonConfiguration?.title = config?.title
        if let size = config?.size {
            buttonConfiguration?.buttonSize = size
        }
        if let systemIcon = config?.systemIcon {
            buttonConfiguration?.image = UIImage(systemName: systemIcon)
        } else {
            buttonConfiguration?.image = nil
        }
        if let iconTextSpacing = config?.iconTextSpacing {
            buttonConfiguration?.imagePadding = iconTextSpacing
        }
        if let fontWeight = config?.fontWeight {
            buttonConfiguration?.titleTextAttributesTransformer =
                UIConfigurationTextAttributesTransformer { incoming in
                    var outgoing = incoming
                    let fontSize =
                        outgoing.font?.pointSize ?? UIFont.buttonFontSize
                    outgoing.font = UIFont.systemFont(
                        ofSize: fontSize,
                        weight: fontWeight
                    )
                    return outgoing
                }
        } else {
            buttonConfiguration?.titleTextAttributesTransformer = nil
        }

        if let backgroundColor = config?.backgroundColor {
            buttonConfiguration?.baseBackgroundColor = backgroundColor
        }
        if let foregroundColor = config?.foregroundColor {
            buttonConfiguration?.baseForegroundColor = foregroundColor
        }

        if let edge = config?.edge {
            apply(
                edge: edge,
                fullWidth: config?.fullWidth ?? false,
                alignment: config?.alignment
            )
            // Keep the scroll-edge edge in sync with the configured placement
            self.scrollEdgeEdge = edge
        }

        if let enabled = config?.enabled {
            button.isEnabled = enabled
        }
        if let visible = config?.visible {
            view.isHidden = !visible
        }

        button.configuration = buttonConfiguration
    }

    /// Attaches the scroll-edge effect using the host app's view hierarchy.
    func updateScrollEdgeEffect(enabled: Bool, in hostView: UIView?) {
        guard enabled else { return }
        guard let hostView else { return }

        // Use configured edge for the scroll-edge effect
        if let cfgEdge = (self as NativeButtonOverlay).scrollEdgeEdge
            as UIRectEdge?
        {
            self.scrollEdgeEdge = cfgEdge
        }

        let targetScrollView = findScrollView(in: hostView)
        attachScrollEdgeInteraction(to: targetScrollView)
    }

    /// Updates the button placement for the requested edge and width mode.
    private func apply(edge: UIRectEdge, fullWidth: Bool, alignment: String?) {
        NSLayoutConstraint.deactivate(activePlacementConstraints())

        if fullWidth {
            switch edge {
            case .top:
                NSLayoutConstraint.activate([
                    leadingConstraint!,
                    trailingConstraint!,
                    topConstraint!,
                ])
            case .left, .right, .bottom:
                NSLayoutConstraint.activate([
                    leadingConstraint!,
                    trailingConstraint!,
                    bottomConstraint!,
                ])
            default:
                NSLayoutConstraint.activate([
                    leadingConstraint!,
                    trailingConstraint!,
                    bottomConstraint!,
                ])
            }

            return
        }

        // For top/bottom edges we support horizontal alignment: left, center, right
        let align = alignment?.lowercased()

        switch edge {
        case .top:
            switch align {
            case "left":
                NSLayoutConstraint.activate([
                    leadingConstraint!,
                    topConstraint!,
                ])
            case "right":
                NSLayoutConstraint.activate([
                    trailingConstraint!,
                    topConstraint!,
                ])
            default:
                NSLayoutConstraint.activate([
                    centerXConstraint!,
                    topConstraint!,
                ])
            }

        case .bottom:
            switch align {
            case "left":
                NSLayoutConstraint.activate([
                    leadingConstraint!,
                    bottomConstraint!,
                ])
            case "right":
                NSLayoutConstraint.activate([
                    trailingConstraint!,
                    bottomConstraint!,
                ])
            default:
                NSLayoutConstraint.activate([
                    centerXConstraint!,
                    bottomConstraint!,
                ])
            }

        default:
            NSLayoutConstraint.activate([
                centerXConstraint!,
                bottomConstraint!,
            ])
        }
    }

    /// Returns the currently active placement constraints.
    private func activePlacementConstraints() -> [NSLayoutConstraint] {
        [
            leadingConstraint,
            trailingConstraint,
            topConstraint,
            bottomConstraint,
            centerXConstraint,
            centerYConstraint,
        ].compactMap { $0 }.filter { $0.isActive }
    }

    /// Emits the current button id when tapped.
    @objc
    private func buttonTapped() {
        onTap?(currentButtonId)
    }
}
