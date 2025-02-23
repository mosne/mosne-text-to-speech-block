import {
	Button,
	ColorIndicator,
	Popover,
	ColorPalette,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

const ButtonColorPopover = ( { currentColor, colors, onChange, label } ) => {
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => {
		setIsVisible( ( state ) => ! state );
	};

	return (
		<div className="components-base-control">
			<div className="components-base-control__field">
				<span className="components-base-control__label">
					<h3 className="components-truncate components-text components-heading">
						{ label }
					</h3>
					<Button
						onClick={ toggleVisible }
						style={ { padding: 0, marginLeft: '8px' } }
					>
						<ColorIndicator colorValue={ currentColor } />
					</Button>
				</span>
				{ isVisible && (
					<Popover
						position="bottom left"
						onFocusOutside={ () => {
							if ( isVisible ) {
								setIsVisible( false );
							}
						} }
					>
						<div style={ { padding: 8 } }>
							<ColorPalette
								colors={ colors }
								value={ currentColor }
								onChange={ ( value ) => {
									onChange( value );
									setIsVisible( false );
								} }
								clearable={ true }
							/>
						</div>
					</Popover>
				) }
			</div>
		</div>
	);
};

export default ButtonColorPopover;
