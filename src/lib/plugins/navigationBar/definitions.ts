export interface NavigationBarButton {
	/** Identifier returned in toolbarAction events */
	id?: string;

	/** Text shown in the button */
	title?: string;

	/** SF Symbol name */
	systemIcon?: string;

	/** Button style */
	style?: 'plain' | 'prominent';
}

export interface NavigationBarConfigureOptions {
	/** Navigation title */
	title?: string;

	/** Left/back button */
	backButton?: NavigationBarButton | null;

	/** Right/action button */
	actionButton?: NavigationBarButton | null;

	/** Whether the navigation bar is visible */
	visible?: boolean;
}

export interface SetTitleOptions {
	title?: string;
}

export interface SetButtonOptions {
	id?: string;
	title?: string;
	systemIcon?: string;
}

export interface NavigationBarActionEvent {
	type: 'back' | 'action';
	id?: string;
}

export interface NavigationBarPlugin {
	configure(options: NavigationBarConfigureOptions): Promise<void>;

	show(): Promise<void>;

	hide(): Promise<void>;

	setTitle(options: SetTitleOptions): Promise<void>;

	setBackButton(options: SetButtonOptions): Promise<void>;

	setActionButton(options: SetButtonOptions): Promise<void>;

	/** Fires when user taps either button */
	addListener(
		eventName: 'navigationBarAction',
		listenerFunc: (event: NavigationBarActionEvent) => void
	): Promise<{ remove: () => void }>;
}
