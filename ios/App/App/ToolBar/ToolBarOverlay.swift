//
//  ToolBarOverlay.swift
//  App
//
//  Created by Simon Mechler on 2026-04-30.
//

import UIKit

// MARK: - Button Config

struct ToolBarButtonConfig {
    let id: String?
    let title: String?
    let systemIcon: String?
    let style: UIBarButtonItem.Style?
}

// MARK: - Spacing

enum ToolBarSpacing {
    case connected
    case compact(CGFloat)
}

// MARK: - Toolbar Nodes

enum ToolBarNode {
    case group(
        buttons: [ToolBarButtonConfig],
        spacing: ToolBarSpacing
    )

    case flexibleSpace

    case fixedSpace(CGFloat)
}

// MARK: - Helpers

extension UIBarButtonItem {

    static func toolbarFixedSpace(
        _ width: CGFloat
    ) -> UIBarButtonItem {

        let item = UIBarButtonItem(
            barButtonSystemItem: .fixedSpace,
            target: nil,
            action: nil
        )

        item.width = width

        return item
    }

    static func toolbarFlexibleSpace()
        -> UIBarButtonItem
    {

        UIBarButtonItem(
            barButtonSystemItem: .flexibleSpace,
            target: nil,
            action: nil
        )
    }
}

// MARK: - Overlay

final class ToolBarOverlay: UIViewController {

    // MARK: - UI

    private let toolbar = UIToolbar()

    // MARK: - State

    private var nodes: [ToolBarNode] = []

    // MARK: - Events

    var onButtonTap: ((String?) -> Void)?

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .clear

        setupToolbar()
    }

    // MARK: - Setup

    private func setupToolbar() {

        toolbar.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(toolbar)

        NSLayoutConstraint.activate([
            toolbar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            toolbar.topAnchor.constraint(equalTo: view.topAnchor),
            toolbar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    // MARK: - Public API

    func update(
        nodes: [ToolBarNode],
        visible: Bool
    ) {

        self.nodes = nodes

        rebuild()

        view.isHidden = !visible
    }

    // MARK: - Build

    private func rebuild() {

        var items: [UIBarButtonItem] = []

        for node in nodes {

            switch node {

            case .group(let buttons, let spacing):

                let barButtons = buildButtons(buttons)

                for (index, button) in barButtons.enumerated() {

                    items.append(button)

                    let isLast = index == barButtons.count - 1

                    guard !isLast else { continue }

                    switch spacing {

                    case .connected:
                        break

                    case .compact(let gap):

                        items.append(
                            UIBarButtonItem.toolbarFixedSpace(gap)
                        )
                    }
                }

            case .flexibleSpace:

                items.append(
                    UIBarButtonItem.toolbarFlexibleSpace()
                )

            case .fixedSpace(let width):

                items.append(
                    UIBarButtonItem.toolbarFixedSpace(width)
                )
            }
        }

        toolbar.setItems(items, animated: false)
    }

    // MARK: - Buttons

    private func buildButtons(
        _ configs: [ToolBarButtonConfig]
    ) -> [UIBarButtonItem] {

        configs.map { config in

            let action = UIAction { [weak self] _ in
                self?.onButtonTap?(config.id)
            }

            let item: UIBarButtonItem

            if let systemIcon = config.systemIcon {

                item = UIBarButtonItem(
                    image: UIImage(systemName: systemIcon),
                    primaryAction: action
                )

            } else {

                item = UIBarButtonItem(
                    title: config.title,
                    primaryAction: action
                )
            }

            if let style = config.style {
                item.style = style
            }

            return item
        }
    }
}
