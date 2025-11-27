"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (tableData: {
    rows: number;
    cols: number;
    width: number;
    height: number;
  }) => void;
}

export function TableDialog({ open, onOpenChange, onInsert }: TableDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const handleInsert = () => {
    onInsert({
      rows,
      cols,
      width: cols * 120,
      height: rows * 40,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
          <DialogDescription>Create a table with rows and columns</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rows</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Columns</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert}>Insert Table</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

