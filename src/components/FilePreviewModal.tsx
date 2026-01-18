import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: { url: string; name: string; type: string }[];
  initialIndex?: number;
}

const FilePreviewModal = ({ isOpen, onClose, files, initialIndex = 0 }: FilePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentFile = files[currentIndex];
  const isImage = currentFile?.type?.startsWith("image/");
  const isVideo = currentFile?.type?.startsWith("video/");

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleDownload = () => {
    if (!currentFile) return;
    const a = document.createElement("a");
    a.href = currentFile.url;
    a.download = currentFile.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  if (!currentFile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-background/95 backdrop-blur-xl border-border/50">
        <DialogTitle className="sr-only">File Preview</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-muted-foreground truncate max-w-[300px]">
              {currentFile.name}
            </span>
            {files.length > 1 && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {currentIndex + 1} / {files.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative">
          {files.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {isImage && (
            <img
              src={currentFile.url}
              alt={currentFile.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          )}

          {isVideo && (
            <video
              src={currentFile.url}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          )}

          {!isImage && !isVideo && (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">
                  {currentFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                </span>
              </div>
              <p className="text-foreground font-medium">{currentFile.name}</p>
              <p className="text-sm text-muted-foreground">{currentFile.type}</p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" /> Download File
              </Button>
            </div>
          )}

          {files.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Thumbnails */}
        {files.length > 1 && (
          <div className="flex items-center gap-2 p-4 border-t border-border/50 overflow-x-auto">
            {files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoom(1);
                }}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  idx === currentIndex ? "border-primary" : "border-transparent"
                }`}
              >
                {file.type.startsWith("image/") ? (
                  <img src={file.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-[10px] text-muted-foreground">
                    {file.name.split(".").pop()?.toUpperCase()}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
