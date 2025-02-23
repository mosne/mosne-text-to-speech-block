/**
 * WordPress dependencies
 */
import {
	Button,
	ColorIndicator,
	ColorPalette,
	Popover,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

const ButtonColorPopover = ( {
	currentColor,
	colors,
	handeSetAttribute,
} ) => {
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => {
		setIsVisible( ( state ) => ! state );
	};

	return (
		<>
			<Button onClick={ toggleVisible } style={ { padding: 0 } }>
				<ColorIndicator colorValue={ currentColor } />
			</Button>
			{ isVisible && (
				<Popover
					position="middle left"
					onFocusOutside={ () => {
						if ( isVisible ) {
							setIsVisible( false );
						}
					} }
				>
					<div style={ { padding: 8 } }>
						<ColorPalette
							colors={ colors }
							clearable={ true }
							value={ currentColor }
							onChange={ ( value ) => {
								handeSetAttribute( value );
							} }
						/>
					</div>
				</Popover>
			) }
		</>
	);
};
export { ButtonColorPopover };
