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
    /// Attach a UIScrollEdgeElementContainerInteraction to this view.
    func attachScrollEdgeInteraction(to scrollView: UIScrollView?) {
        guard let scrollView = scrollView else { return }

        if #available(iOS 26.0, *) {
            let interaction = UIScrollEdgeElementContainerInteraction()
            interaction.scrollView = scrollView
            interaction.edge = scrollEdgeEdge
            view.addInteraction(interaction)
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
