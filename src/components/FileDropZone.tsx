import { useState, useRef, useCallback, ReactNode } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  children: ReactNode;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

const FileDropZone = ({ 
  onFilesDropped, 
  children, 
  accept,
  disabled = false,
  className 
}: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCountRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCountRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCountRef.current = 0;
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Filter by accept if provided
      let filteredFiles = files;
      if (accept) {
        const acceptedTypes = accept.split(",").map(t => t.trim());
        filteredFiles = files.filter(file => {
          return acceptedTypes.some(type => {
            if (type.startsWith(".")) {
              return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            if (type.endsWith("/*")) {
              return file.type.startsWith(type.replace("/*", "/"));
            }
            return file.type === type;
          });
        });
      }
      if (filteredFiles.length > 0) {
        onFilesDropped(filteredFiles);
      }
    }
  }, [accept, disabled, onFilesDropped]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn("relative", className)}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-2xl">
          <div className="flex flex-col items-center gap-3 p-6 text-primary">
            <Upload className="w-12 h-12 animate-bounce" />
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-muted-foreground">Images, videos, documents, and more</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
