/** Native button presentation styles supported by the iOS bridge. */
export type NativeButtonStyle =
	| 'prominentGlass'
	| 'prominentClearGlass'
	| 'borderedProminent'
	| 'filled'
	| 'tinted'
	| 'plain'
	| 'gray'
	| 'bordered';

/** Native button size presets. */
export type NativeButtonSize = 'small' | 'medium' | 'large';

/** Edge used to anchor the native button overlay. Only top and bottom are supported. */
export type NativeButtonEdge = 'top' | 'bottom';

/** Horizontal alignment when the button is placed along the top or bottom edge. */
export type NativeButtonAlignment = 'left' | 'center' | 'right';

/** Font weight options applied to the native button title. */
export type NativeButtonFontWeight =
	| 'ultraLight'
	| 'thin'
	| 'light'
	| 'regular'
	| 'medium'
	| 'semibold'
	| 'bold'
	| 'heavy'
	| 'black';

/** Configuration for the native button overlay. */
export interface NativeButtonConfig {
	/** Stable identifier emitted with tap events. */
	id?: string;
	/** Button title text. */
	title?: string;
	/** SF Symbol name used as the button image. */
	systemIcon?: string;
	/** Native button configuration style. */
	style?: NativeButtonStyle;
	/** Native button size preset. */
	size?: NativeButtonSize;
	/** Whether the button is shown. */
	visible?: boolean;
	/** Whether the button can be tapped. */
	enabled?: boolean;
	/** Render the button across the full available width. */
	fullWidth?: boolean;
	/** Horizontal alignment along the chosen edge. Defaults to 'center'. */
	alignment?: NativeButtonAlignment;
	/** Background color in hex or rgba format. */
	backgroundColor?: string; // hex or rgba string
	/** Foreground/text color in hex or rgba format. */
	foregroundColor?: string; // hex or rgba string
	/** Spacing between the icon and title, in points. */
	iconTextSpacing?: number;
	/** Title font weight. */
	fontWeight?: NativeButtonFontWeight;
	/** Enable the iOS scroll-edge effect when supported. */
	scrollEdgeEffect?: boolean;
	/** Edge used to position the button. */
	edge: NativeButtonEdge;
}

/** Tap event emitted by the native button overlay. */
export interface NativeButtonTapEvent {
	/** Identifier provided in the last configure call. */
	id?: string;
}

/** NativeButton Capacitor plugin surface. */
export interface NativeButtonPlugin {
	/** Applies a new native button configuration. */
	configure(options: NativeButtonConfig): Promise<void>;

	/** Shows the native button overlay. */
	show(): Promise<void>;

	/** Hides the native button overlay. */
	hide(): Promise<void>;

	/** Listens for button tap events. */
	addListener(
		eventName: 'tap',
		listenerFunc: (event: NativeButtonTapEvent) => void
	): Promise<{ remove: () => void }>;
}
