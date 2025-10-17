import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Save, X } from 'lucide-react';

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onSave: (croppedBlob: Blob) => void;
}

const CROP_SIZE = 300; // Fixed crop size in pixels
const MIN_IMAGE_SIZE = 200; // Minimum image dimension required

export default function ImageCropDialog({ isOpen, onClose, imageFile, onSave }: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) return;

    const img = new Image();
    img.onload = () => {
      // Check if image is too small
      if (img.width < MIN_IMAGE_SIZE || img.height < MIN_IMAGE_SIZE) {
        setError(`Image is too small. Minimum size is ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels.`);
        setImage(null);
        return;
      }

      setError(null);
      setImage(img);
      
      // Calculate base scale for canvas display
      const maxSize = 500;
      const baseScale = Math.min(maxSize / img.width, maxSize / img.height);
      const canvasWidth = img.width * baseScale;
      const canvasHeight = img.height * baseScale;
      
      // Calculate min zoom (crop must stay within image bounds)
      const minZoomCalc = Math.max(
        CROP_SIZE / canvasWidth,
        CROP_SIZE / canvasHeight
      );
      
      // Max zoom for detail viewing
      const maxZoomCalc = 4;
      
      // Start slider in the MIDDLE of the range
      const initialZoom = (minZoomCalc + maxZoomCalc) / 2;
      
      setZoom(initialZoom);
      setPosition({ x: 0, y: 0 });
    };
    
    img.onerror = () => {
      setError('Failed to load image. Please try a different image.');
      setImage(null);
    };

    const url = URL.createObjectURL(imageFile);
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Draw the image with crop overlay
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas || !image) return;

    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    if (!ctx || !previewCtx) return;

    // Calculate canvas size (fit image in 500x500 max area)
    const maxSize = 500;
    const scale = Math.min(maxSize / image.width, maxSize / image.height);
    const canvasWidth = image.width * scale;
    const canvasHeight = image.height * scale;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate image dimensions with zoom
    const imgWidth = canvasWidth * zoom;
    const imgHeight = canvasHeight * zoom;

    // Crop is always centered on canvas
    const cropX = (canvasWidth - CROP_SIZE) / 2;
    const cropY = (canvasHeight - CROP_SIZE) / 2;
    const cropCenterX = cropX + CROP_SIZE / 2;
    const cropCenterY = cropY + CROP_SIZE / 2;
    
    // Constrain position using symmetric bounds relative to crop center
    const maxOffsetX = Math.max(0, (imgWidth - CROP_SIZE) / 2);
    const maxOffsetY = Math.max(0, (imgHeight - CROP_SIZE) / 2);
    
    const constrainedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, position.x));
    const constrainedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, position.y));

    // Draw image centered on crop, offset by position
    const imgX = cropCenterX - (imgWidth / 2) + constrainedX;
    const imgY = cropCenterY - (imgHeight / 2) + constrainedY;
    ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);

    // Draw dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Clear crop area (make it transparent) - CIRCULAR
    ctx.save();
    ctx.beginPath();
    const centerX = cropX + CROP_SIZE / 2;
    const centerY = cropY + CROP_SIZE / 2;
    const radius = CROP_SIZE / 2;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.clip();
    ctx.clearRect(cropX, cropY, CROP_SIZE, CROP_SIZE);
    
    // Redraw image in circular crop area only
    ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
    ctx.restore();

    // Draw circular crop border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw circular indicators (small dots around the circle)
    ctx.fillStyle = '#ffffff';
    const indicatorRadius = 3;
    const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2]; // Top, right, bottom, left
    
    angles.forEach(angle => {
      const dotX = centerX + Math.cos(angle) * (radius - 10);
      const dotY = centerY + Math.sin(angle) * (radius - 10);
      ctx.beginPath();
      ctx.arc(dotX, dotY, indicatorRadius, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw circular preview
    previewCanvas.width = 100;
    previewCanvas.height = 100;
    previewCtx.clearRect(0, 0, 100, 100);
    
    // Create circular clipping for preview
    previewCtx.save();
    previewCtx.beginPath();
    previewCtx.arc(50, 50, 50, 0, 2 * Math.PI);
    previewCtx.clip();
    
    // Draw cropped area to preview
    previewCtx.drawImage(
      canvas,
      cropX, cropY, CROP_SIZE, CROP_SIZE,
      0, 0, 100, 100
    );
    previewCtx.restore();
    
    // Add circular border to preview
    previewCtx.strokeStyle = '#ffffff';
    previewCtx.lineWidth = 2;
    previewCtx.beginPath();
    previewCtx.arc(50, 50, 49, 0, 2 * Math.PI);
    previewCtx.stroke();
  }, [image, zoom, position]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Calculate min and max zoom based on image size
  const minZoom = image 
    ? (() => {
        const maxSize = 500;
        const baseScale = Math.min(maxSize / image.width, maxSize / image.height);
        const canvasWidth = image.width * baseScale;
        const canvasHeight = image.height * baseScale;
        // Min zoom ensures crop stays within image bounds
        return Math.max(
          CROP_SIZE / canvasWidth,
          CROP_SIZE / canvasHeight
        );
      })()
    : 1;
  
  const maxZoom = 4;

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !image) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Calculate max offsets based on current zoom
    const maxSize = 500;
    const baseScale = Math.min(maxSize / image.width, maxSize / image.height);
    const canvasWidth = image.width * baseScale;
    const canvasHeight = image.height * baseScale;
    const imgWidth = canvasWidth * zoom;
    const imgHeight = canvasHeight * zoom;
    
    const maxOffsetX = Math.max(0, (imgWidth - CROP_SIZE) / 2);
    const maxOffsetY = Math.max(0, (imgHeight - CROP_SIZE) / 2);
    
    // Clamp position
    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));
    
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoomChange = (value: number[]) => {
    if (!image) return;
    
    const newZoom = value[0];
    
    // Recalculate position constraints with new zoom
    const maxSize = 500;
    const baseScale = Math.min(maxSize / image.width, maxSize / image.height);
    const canvasWidth = image.width * baseScale;
    const canvasHeight = image.height * baseScale;
    const imgWidth = canvasWidth * newZoom;
    const imgHeight = canvasHeight * newZoom;
    
    const maxOffsetX = Math.max(0, (imgWidth - CROP_SIZE) / 2);
    const maxOffsetY = Math.max(0, (imgHeight - CROP_SIZE) / 2);
    
    // Clamp current position to new bounds
    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, position.x));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, position.y));
    
    setZoom(newZoom);
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleZoomIn = () => {
    if (!image) return;
    const newZoom = Math.min(zoom + 0.2, maxZoom);
    handleZoomChange([newZoom]);
  };

  const handleZoomOut = () => {
    if (!image) return;
    const newZoom = Math.max(zoom - 0.2, minZoom);
    handleZoomChange([newZoom]);
  };

  // Generate cropped blob
  const handleSave = async () => {
    if (!image || !canvasRef.current) return;

    setIsLoading(true);
    
    try {
      // Create a temporary canvas for the final crop
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Set final crop size to high resolution (1200x1200 for better quality)
      // This crops at original resolution, not the scaled preview size
      const finalSize = 1200;
      tempCanvas.width = finalSize;
      tempCanvas.height = finalSize;

      // Calculate the actual crop area in original image coordinates
      const baseScale = Math.min(500 / image.width, 500 / image.height);
      const canvasWidth = image.width * baseScale;
      const canvasHeight = image.height * baseScale;
      
      // Zoomed image dimensions in canvas pixels
      const imgWidth = canvasWidth * zoom;
      const imgHeight = canvasHeight * zoom;
      
      // Crop is centered on canvas
      const cropCenterX = canvasWidth / 2;
      const cropCenterY = canvasHeight / 2;
      
      // Image center position on canvas (offset by pan position)
      const imgCenterX = cropCenterX + position.x;
      const imgCenterY = cropCenterY + position.y;
      
      // Top-left corner of image on canvas
      const imgX = imgCenterX - (imgWidth / 2);
      const imgY = imgCenterY - (imgHeight / 2);
      
      // Crop area on canvas
      const cropX = (canvasWidth - CROP_SIZE) / 2;
      const cropY = (canvasHeight - CROP_SIZE) / 2;
      
      // What part of the zoomed image is in the crop area
      const cropStartXInZoomedImage = cropX - imgX;
      const cropStartYInZoomedImage = cropY - imgY;
      
      // Convert to original image coordinates
      const sourceX = cropStartXInZoomedImage * (image.width / imgWidth);
      const sourceY = cropStartYInZoomedImage * (image.height / imgHeight);
      const sourceSize = CROP_SIZE * (image.width / imgWidth);

      // Create circular mask and draw the cropped portion
      tempCtx.save();
      tempCtx.beginPath();
      tempCtx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, 2 * Math.PI);
      tempCtx.clip();
      
      tempCtx.drawImage(
        image,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, finalSize, finalSize
      );
      
      tempCtx.restore();

      // Convert to blob as PNG to preserve transparency
      tempCanvas.toBlob((blob) => {
        if (blob) {
          onSave(blob);
          onClose();
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error creating crop:', error);
      setError('Failed to crop image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white" aria-describedby="crop-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-white">Crop Logo Image</DialogTitle>
          <DialogDescription id="crop-dialog-description" className="text-gray-300">
            Adjust the position and zoom of your logo to create a square crop. Use the controls below to position your image perfectly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={onClose} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                Try Different Image
              </Button>
            </div>
          ) : (
            <>
              {/* Canvas Container */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div 
                    className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center"
                    style={{ minHeight: '400px' }}
                  >
                    {image ? (
                      <canvas
                        ref={canvasRef}
                        className="cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{ maxWidth: '100%', maxHeight: '400px' }}
                      />
                    ) : (
                      <div className="text-gray-400">Loading image...</div>
                    )}
                  </div>
                </div>
                
                {/* Preview */}
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-400">Preview</p>
                  <div className="border border-gray-600 rounded-lg overflow-hidden">
                    <canvas ref={previewCanvasRef} className="block" />
                  </div>
                </div>
              </div>

              {/* Zoom Controls */}
              {image && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleZoomOut}
                      disabled={zoom <= minZoom}
                      variant="outline"
                      size="icon"
                      className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-white disabled:opacity-30 h-9 w-9"
                      data-testid="button-zoom-out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Slider
                      value={[zoom]}
                      onValueChange={handleZoomChange}
                      min={minZoom}
                      max={maxZoom}
                      step={0.1}
                      className="flex-1 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                      data-testid="slider-zoom"
                    />
                    <Button
                      onClick={handleZoomIn}
                      disabled={zoom >= maxZoom}
                      variant="outline"
                      size="icon"
                      className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-white disabled:opacity-30 h-9 w-9"
                      data-testid="button-zoom-in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Drag to reposition • Zoom out to fit more, zoom in for details • Circular area will be saved as logo
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-white"
                  data-testid="button-cancel-crop"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!image || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-save-logo"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Logo'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}