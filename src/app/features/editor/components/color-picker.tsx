'use client';
import { ChromePicker, CirclePicker } from 'react-color';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';

import { colors } from '../types';
import { rgbaObjectToString } from '../utils';

interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setTimeout(() => {
			setIsMounted(true);
		}, 0);
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<ScrollArea className="w-full space-y-6 overflow-hidden">
			<div className="space-y-2">
				<label className="text-sm font-medium text-muted-foreground">Color Picker</label>
				
					<ChromePicker
						color={value}
		                onChange={(color) => { 
		                    const formattedValue = rgbaObjectToString(color.rgb)
		                    onChange(formattedValue)
		                }}
		                className='border-none'
					/>
				
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium text-muted-foreground">Quick Colors</label>
				<div className="overflow-x-auto">
					<CirclePicker
		                colors={colors}
		                color={value}
		                width="100%"
						onChangeComplete={(color) => { 
		                    const formattedValue = rgbaObjectToString(color.rgb)
		                    onChange(formattedValue)
		                }}
						className="w-max"
					/>
				</div>
			</div>
		</ScrollArea>
	);
};
