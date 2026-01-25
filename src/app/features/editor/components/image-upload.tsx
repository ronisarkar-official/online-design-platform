'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ImageUploadProps {
	onUpload: (url: string) => void;
}

export const ImageUpload = ({ onUpload }: ImageUploadProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [showUrlDialog, setShowUrlDialog] = useState(false);
	const [imageUrl, setImageUrl] = useState('');
	const [isDragging, setIsDragging] = useState(false);

	const handleFileSelect = useCallback(
		(file: File) => {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert('Please select an image file');
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				alert('Image size should be less than 10MB');
				return;
			}

			// Create data URL from file
			const reader = new FileReader();
			reader.onload = (e) => {
				const dataUrl = e.target?.result as string;
				if (dataUrl) {
					onUpload(dataUrl);
				}
			};
			reader.readAsDataURL(file);
		},
		[onUpload],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0) {
				handleFileSelect(files[0]);
			}
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				handleFileSelect(files[0]);
			}
		},
		[handleFileSelect],
	);

	const handleUrlSubmit = useCallback(() => {
		if (imageUrl.trim()) {
			onUpload(imageUrl.trim());
			setImageUrl('');
			setShowUrlDialog(false);
		}
	}, [imageUrl, onUpload]);

	return (
		<div className="space-y-3">
			{/* Drag and Drop Area */}
			<div
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => fileInputRef.current?.click()}
				className={`
					border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
					transition-all duration-200
					${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
				`}>
				<Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
				<p className="text-sm font-medium text-muted-foreground mb-1">
					Drop an image here or click to browse
				</p>
				<p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileInputChange}
				className="hidden"
			/>

			{/* URL Upload Button */}
			<Button
				variant="outline"
				onClick={() => setShowUrlDialog(true)}
				className="w-full">
				<LinkIcon className="w-4 h-4 mr-2" />
				Add from URL
			</Button>

			{/* URL Dialog */}
			<Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Image from URL</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="image-url">Image URL</Label>
							<Input
								id="image-url"
								type="url"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
								placeholder="https://example.com/image.jpg"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleUrlSubmit();
									}
								}}
							/>
						</div>
						<Button onClick={handleUrlSubmit} className="w-full">
							Add Image
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
