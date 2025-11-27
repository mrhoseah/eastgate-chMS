"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Trash2, Copy, ChevronRight, ChevronDown, Minimize2, Maximize2 } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1.5 px-1 -mx-1 rounded hover:bg-gray-800/30 transition-colors group"
      >
        <Label className="text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer group-hover:text-white transition-colors">
          {title}
        </Label>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-300 transition-colors" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-300 transition-colors" />
        )}
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );
}

interface InspectorProps {
  variant?: 'sidebar' | 'floating';
  onRequestDrag?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export function Inspector({ variant = "sidebar", onRequestDrag }: InspectorProps = {}) {
  const {
    selectedFrameId,
    selectedElementId,
    frames,
    updateFrame,
    updateElement,
    deleteFrame,
    deleteElement,
    selectFrame,
    selectElement,
  } = usePresentationEditorStore();

  const selectedFrame = selectedFrameId
    ? frames.find((f) => f.id === selectedFrameId)
    : null;

  const selectedElement = selectedFrame && selectedElementId
    ? selectedFrame.elements.find((e) => e.id === selectedElementId)
    : null;

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(false);
  }, [selectedFrameId, selectedElementId]);

  const containerBaseClass =
    "w-80 bg-gray-900/95 backdrop-blur-xl p-6 overflow-y-auto";
  const floatingClasses =
    "rounded-2xl border border-gray-800/60 shadow-2xl shadow-blue-900/30 max-h-[calc(100vh-12rem)]";
  const sidebarClasses = "border-l border-gray-800/50 h-full";

  const containerClass =
    variant === "floating"
      ? `${containerBaseClass} ${floatingClasses}`
      : `${containerBaseClass} ${sidebarClasses}`;

  const headerBaseClass = "flex items-center justify-between pb-3 border-b border-gray-800";
  const headerClass =
    variant === "floating"
      ? `${headerBaseClass} cursor-move select-none active:cursor-grabbing`
      : headerBaseClass;

  if (!selectedFrame && !selectedElement) {
    return (
      <div className={containerClass}>
        {variant === "floating" && (
          <div
            className="mb-4 text-xs uppercase tracking-wider text-gray-400 cursor-move select-none"
            onPointerDown={onRequestDrag}
          >
            Frame Properties
          </div>
        )}
        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-600 border-dashed rounded"></div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-300">No selection</p>
            <p className="text-xs text-gray-500">
              Select a frame or element to edit properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedElement) {
    return (
      <div className={`${containerClass} ${isCollapsed ? "" : "overflow-y-auto"}`}>
        <div className="space-y-5">
          <div
            className={headerClass}
            onPointerDown={variant === "floating" ? onRequestDrag : undefined}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">Element Properties</h3>
              {isCollapsed && (
                <span className="text-xs uppercase tracking-wide text-gray-500">Collapsed</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                aria-label={isCollapsed ? "Expand element properties" : "Collapse element properties"}
              >
                {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Copy element
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedFrameId && selectedElementId) {
                    deleteElement(selectedFrameId, selectedElementId);
                    selectElement(null, null);
                  }
                }}
                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isCollapsed ? null : (
            <>
          <Separator className="bg-gray-800" />

          {/* Position */}
          <CollapsibleSection title="Position">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">X</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.position.x)}
                  onChange={(e) => {
                    if (selectedFrameId) {
                      updateElement(selectedFrameId, selectedElementId!, {
                        position: {
                          x: parseFloat(e.target.value) || 0,
                          y: selectedElement.position.y,
                        },
                      });
                    }
                  }}
                  className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Y</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.position.y)}
                  onChange={(e) => {
                    if (selectedFrameId) {
                      updateElement(selectedFrameId, selectedElementId!, {
                        position: {
                          x: selectedElement.position.x,
                          y: parseFloat(e.target.value) || 0,
                        },
                      });
                    }
                  }}
                  className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Size */}
          <CollapsibleSection title="Size">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Width</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.size.width)}
                  onChange={(e) => {
                    if (selectedFrameId) {
                      updateElement(selectedFrameId, selectedElementId!, {
                        size: {
                          width: parseFloat(e.target.value) || 0,
                          height: selectedElement.size.height,
                        },
                      });
                    }
                  }}
                  className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Height</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.size.height)}
                  onChange={(e) => {
                    if (selectedFrameId) {
                      updateElement(selectedFrameId, selectedElementId!, {
                        size: {
                          width: selectedElement.size.width,
                          height: parseFloat(e.target.value) || 0,
                        },
                      });
                    }
                  }}
                  className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Rotation */}
          <CollapsibleSection title="Rotation">
            <Input
              type="number"
              value={Math.round(selectedElement.rotation)}
              onChange={(e) => {
                if (selectedFrameId) {
                  updateElement(selectedFrameId, selectedElementId!, {
                    rotation: parseFloat(e.target.value) || 0,
                  });
                }
              }}
              className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              step="1"
            />
          </CollapsibleSection>

          {/* Element-specific properties */}
          {selectedElement.type === "text" && (
            <>
              <Separator className="bg-gray-800" />
              <CollapsibleSection title="Text">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Content</Label>
                    <Input
                      value={selectedElement.content || ""}
                      onChange={(e) => {
                        if (selectedFrameId) {
                          updateElement(selectedFrameId, selectedElementId!, {
                            content: e.target.value,
                          });
                        }
                      }}
                      className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Font Size</Label>
                    <Input
                      type="number"
                      value={selectedElement.style.fontSize || 24}
                      onChange={(e) => {
                        if (selectedFrameId) {
                          updateElement(selectedFrameId, selectedElementId!, {
                            style: {
                              ...selectedElement.style,
                              fontSize: parseFloat(e.target.value) || 24,
                            },
                          });
                        }
                      }}
                      className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Text Color</Label>
                    <Input
                      type="color"
                      value={selectedElement.style.fill || "#000000"}
                      onChange={(e) => {
                        if (selectedFrameId) {
                          updateElement(selectedFrameId, selectedElementId!, {
                            style: {
                              ...selectedElement.style,
                              fill: e.target.value,
                            },
                          });
                        }
                      }}
                      className="h-10 w-full cursor-pointer bg-gray-800/50 border-gray-700"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </>
          )}

          {selectedElement.type === "shape" && (
            <>
              <Separator className="bg-gray-800" />
              <CollapsibleSection title="Appearance">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Fill Color</Label>
                    <Input
                      type="color"
                      value={selectedElement.style.fill || "#3b82f6"}
                      onChange={(e) => {
                        if (selectedFrameId) {
                          updateElement(selectedFrameId, selectedElementId!, {
                            style: {
                              ...selectedElement.style,
                              fill: e.target.value,
                            },
                          });
                        }
                      }}
                      className="h-10 w-full cursor-pointer bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Stroke Color</Label>
                    <Input
                      type="color"
                      value={selectedElement.style.stroke || "#1e40af"}
                      onChange={(e) => {
                        if (selectedFrameId) {
                          updateElement(selectedFrameId, selectedElementId!, {
                            style: {
                              ...selectedElement.style,
                              stroke: e.target.value,
                            },
                          });
                        }
                      }}
                      className="h-10 w-full cursor-pointer bg-gray-800/50 border-gray-700"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </>
          )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Frame properties
  if (!selectedFrame) return null;

  return (
    <div className={`${containerClass} ${isCollapsed ? "" : "overflow-y-auto"}`}>
      <div className="space-y-5">
        <div
          className={headerClass}
          onPointerDown={variant === "floating" ? onRequestDrag : undefined}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">Frame Properties</h3>
            {isCollapsed && (
              <span className="text-xs uppercase tracking-wide text-gray-500">Collapsed</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50"
              aria-label={isCollapsed ? "Expand frame properties" : "Collapse frame properties"}
            >
              {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedFrameId) {
                  deleteFrame(selectedFrameId);
                  selectFrame(null);
                }
              }}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {isCollapsed ? null : (
          <>

        {/* Title */}
        <CollapsibleSection title="Title" defaultOpen={true}>
          <Input
            value={selectedFrame.title || ""}
            onChange={(e) => {
              updateFrame(selectedFrameId!, {
                title: e.target.value,
              });
            }}
            placeholder="Enter slide title..."
            className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
          />
        </CollapsibleSection>

        {/* Position */}
        <CollapsibleSection title="Position">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">X</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.position.x)}
                onChange={(e) => {
                  updateFrame(selectedFrameId!, {
                    position: {
                      x: parseFloat(e.target.value) || 0,
                      y: selectedFrame.position.y,
                    },
                  });
                }}
                className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.position.y)}
                onChange={(e) => {
                  updateFrame(selectedFrameId!, {
                    position: {
                      x: selectedFrame.position.x,
                      y: parseFloat(e.target.value) || 0,
                    },
                  });
                }}
                className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Size */}
        <CollapsibleSection title="Size">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Width</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.width)}
                onChange={(e) => {
                  updateFrame(selectedFrameId!, {
                    width: parseFloat(e.target.value) || 0,
                  });
                }}
                className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Height</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.height)}
                onChange={(e) => {
                  updateFrame(selectedFrameId!, {
                    height: parseFloat(e.target.value) || 0,
                  });
                }}
                className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Rotation */}
        <CollapsibleSection title="Rotation">
          <Input
            type="number"
            value={Math.round(selectedFrame.rotation)}
            onChange={(e) => {
              updateFrame(selectedFrameId!, {
                rotation: parseFloat(e.target.value) || 0,
              });
            }}
            className="h-9 text-sm bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
            step="1"
          />
        </CollapsibleSection>

        {/* Colors */}
        <Separator className="bg-gray-800" />
        <CollapsibleSection title="Appearance">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Background Color</Label>
              <Input
                type="color"
                value={selectedFrame.backgroundColor || "#ffffff"}
                onChange={(e) => {
                  updateFrame(selectedFrameId!, {
                    backgroundColor: e.target.value,
                  });
                }}
                className="h-10 w-full cursor-pointer bg-gray-800/50 border-gray-700"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Border Color</Label>
              <Input
                type="color"
                value={selectedFrame.borderColor || "#e5e7eb"}
                onChange={(e) => {
                  updateFrame(selectedFrameId!, {
                    borderColor: e.target.value,
                  });
                }}
                className="h-10 w-full cursor-pointer bg-gray-800/50 border-gray-700"
              />
            </div>
          </div>
        </CollapsibleSection>
          </>
        )}
      </div>
    </div>
  );
}

