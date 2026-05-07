export interface ToolBarButton {
	/** Identifier returned in buttonTap events */
	id?: string;

	/** Text shown in the button */
	title?: string;

	/** SF Symbol name */
	systemIcon?: string;

	/** Button style */
	style?: 'plain' | 'prominent';
}

export type ToolBarNode =
	| {
			/** Group of toolbar buttons rendered together */
			type: 'group';

			/** How buttons are drawn within the group */
			spacing: 'connected' | 'compact';

			/** Gap between buttons */
			gap?: number;

			/** Buttons included in this group */
			buttons: ToolBarButton[];
	  }
	| {
			/** Flexible spacer that consumes remaining space */
			type: 'flexible-space';
	  }
	| {
			/** Fixed spacer with an explicit width */
			type: 'fixed-space';

			/** Width of the spacer */
			width: number;
	  };

export interface ToolBarConfigureOptions {
	/** Ordered toolbar nodes to render */
	nodes: ToolBarNode[];

	/** Whether the toolbar should be visible */
	visible?: boolean;
}

export interface ToolBarPlugin {
	/** Applies a new toolbar configuration */
	configure(options: ToolBarConfigureOptions): Promise<void>;

	/** Shows the toolbar */
	show(): Promise<void>;

	/** Hides the toolbar */
	hide(): Promise<void>;

	/** Fires when the user taps a toolbar button */
	addListener(
		eventName: 'buttonTap',
		listener: (ev: { id?: string }) => void
	): Promise<{ remove: () => void }>;
}
