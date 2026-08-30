//
//  ScrollEdgeInteractionHelper.swift
//  App
//
//  Created by Simon Mechler on 2026-05-11.
//

import UIKit
import WebKit

// MARK: - Protocol

/// Conforming view controllers can attach UIScrollEdgeElementContainerInteraction
/// to their views for scroll-edge effect support (iOS 26.0+).
protocol ScrollEdgeElementContainer: UIViewController {
    var scrollEdgeInteraction: Any? { get set }
    var scrollEdgeEdge: UIRectEdge { get }
}

extension ScrollEdgeElementContainer {
    /// Removes the interaction when the element no longer uses a scroll-edge effect. In
    /// particular, Reduce Transparency can turn the material attached to this full-screen
    /// container into an opaque accessibility fallback.
    func detachScrollEdgeInteraction() {
        if #available(iOS 26.0, *),
            let interaction = scrollEdgeInteraction
                as? UIScrollEdgeElementContainerInteraction
        {
            view.removeInteraction(interaction)
        }
        scrollEdgeInteraction = nil
    }

    /// Attach a UIScrollEdgeElementContainerInteraction to this view.
    /// Deduplicated – repeated `configure` calls (e.g. `tick()` reconfigure)
    /// must not stack interactions or re-animate `edgeEffect`.
    func attachScrollEdgeInteraction(to scrollView: UIScrollView?) {
        guard !UIAccessibility.isReduceTransparencyEnabled else {
            detachScrollEdgeInteraction()
            return
        }
        guard let scrollView = scrollView else { return }

        if #available(iOS 26.0, *) {
            // Already attached for this edge – just ensure effect stays visible
            if let existing = scrollEdgeInteraction as? UIScrollEdgeElementContainerInteraction,
               existing.edge == scrollEdgeEdge,
               existing.scrollView === scrollView
            {
                // Refresh effect without re-adding interaction
                let edgeEffect: UIScrollEdgeEffect
                switch scrollEdgeEdge {
                case .top: edgeEffect = scrollView.topEdgeEffect
                case .bottom: edgeEffect = scrollView.bottomEdgeEffect
                case .left: edgeEffect = scrollView.leftEdgeEffect
                case .right: edgeEffect = scrollView.rightEdgeEffect
                default: edgeEffect = scrollView.topEdgeEffect
                }
                edgeEffect.style = .soft
                edgeEffect.isHidden = false
                return
            }

            // Remove previous interaction if edge/scrollView changed
            if let old = scrollEdgeInteraction as? UIScrollEdgeElementContainerInteraction {
                view.removeInteraction(old)
            }

            let interaction = UIScrollEdgeElementContainerInteraction()
            interaction.scrollView = scrollView
            interaction.edge = scrollEdgeEdge

            let edgeEffect: UIScrollEdgeEffect

            switch scrollEdgeEdge {
            case .top:
                edgeEffect = scrollView.topEdgeEffect
            case .bottom:
                edgeEffect = scrollView.bottomEdgeEffect
            case .left:
                edgeEffect = scrollView.leftEdgeEffect
            case .right:
                edgeEffect = scrollView.rightEdgeEffect
            default:
                edgeEffect = scrollView.topEdgeEffect
            }

            edgeEffect.style = .soft
            edgeEffect.isHidden = false

            // Suppress implicit animation of the soft blur appearing
            CATransaction.begin()
            CATransaction.setDisableActions(true)
            UIView.performWithoutAnimation {
                view.addInteraction(interaction)
            }
            CATransaction.commit()

            scrollEdgeInteraction = interaction
        }
    }
}

// MARK: - Utilities

/// Finds a UIScrollView in a view hierarchy, checking for WKWebView first.
func findScrollView(in view: UIView) -> UIScrollView? {
    if let wk = view as? WKWebView { return wk.scrollView }
    if let sv = view as? UIScrollView { return sv }
    for sub in view.subviews {
        if let found = findScrollView(in: sub) { return found }
    }
    return nil
}
