//
//  NavigationBarOverlay.swift
//  App
//
//  Created by Simon Mechler on 2026-05-07.
//

import UIKit

struct NavBarButtonConfig {
    let id: String?
    let title: String?
    let systemIcon: String?
    let style: UIBarButtonItem.Style?
}

final class NavigationBarOverlay: UIViewController {

    // MARK: - UI

    private let navigationBar = UINavigationBar()
    private let navigationItemRef = UINavigationItem()

    // MARK: - State

    private var backButtonId: String?
    private var actionButtonId: String?

    // MARK: - Events

    var onBackButtonTap: ((String?) -> Void)?
    var onActionButtonTap: ((String?) -> Void)?

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .clear

        setupNavigationBar()
    }

    // MARK: - Setup

    private func setupNavigationBar() {

        navigationBar.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(navigationBar)

        NSLayoutConstraint.activate([
            navigationBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            navigationBar.trailingAnchor.constraint(
                equalTo: view.trailingAnchor
            ),
            navigationBar.topAnchor.constraint(equalTo: view.topAnchor),
            navigationBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        navigationBar.setItems([navigationItemRef], animated: false)
    }

    // MARK: - Public API

    func update(
        title: String?,
        backButton: NavBarButtonConfig?,
        actionButton: NavBarButtonConfig?,
        visible: Bool
    ) {

        setTitle(title)
        setBackButton(backButton)
        setActionButton(actionButton)

        view.isHidden = !visible
    }

    func setTitle(_ title: String?) {
        navigationItemRef.title = title
    }

    func setBackButton(_ config: NavBarButtonConfig?) {

        backButtonId = config?.id

        guard let config else {
            navigationItemRef.leftBarButtonItem = nil
            return
        }

        let item: UIBarButtonItem
        
        let style = config.style ?? UIBarButtonItem.Style.plain

        if let systemIcon = config.systemIcon {

            item = UIBarButtonItem(
                image: UIImage(systemName: systemIcon),
                style: style,
                target: self,
                action: #selector(backButtonTapped)
            )

        } else {

            item = UIBarButtonItem(
                title: config.title ?? "Back",
                style: style,
                target: self,
                action: #selector(backButtonTapped)
            )
        }

        navigationItemRef.leftBarButtonItem = item
    }

    func setActionButton(_ config: NavBarButtonConfig?) {

        actionButtonId = config?.id

        guard let config else {
            navigationItemRef.rightBarButtonItem = nil
            return
        }

        let item: UIBarButtonItem
        
        let style = config.style ?? UIBarButtonItem.Style.plain

        if let systemIcon = config.systemIcon {

            item = UIBarButtonItem(
                image: UIImage(systemName: systemIcon),
                style: style,
                target: self,
                action: #selector(actionButtonTapped)
            )
            
            item.tintColor = .systemOrange

        } else {

            item = UIBarButtonItem(
                title: config.title ?? "Action",
                style: style,
                target: self,
                action: #selector(actionButtonTapped)
            )
        }

        navigationItemRef.rightBarButtonItem = item
    }

    // MARK: - Actions

    @objc
    private func backButtonTapped() {
        onBackButtonTap?(backButtonId)
    }

    @objc
    private func actionButtonTapped() {
        onActionButtonTap?(actionButtonId)
    }
}
