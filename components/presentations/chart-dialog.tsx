"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, LineChart, PieChart } from "lucide-react";

interface ChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (chartData: {
    type: "bar" | "line" | "pie";
    data: any[];
    width: number;
    height: number;
  }) => void;
}

export function ChartDialog({ open, onOpenChange, onInsert }: ChartDialogProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [dataRows, setDataRows] = useState([{ name: "", value: "" }]);

  const handleAddRow = () => {
    setDataRows([...dataRows, { name: "", value: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    setDataRows(dataRows.filter((_, i) => i !== index));
  };

  const handleInsert = () => {
    const chartData = dataRows
      .filter((row) => row.name && row.value)
      .map((row) => ({
        name: row.name,
        value: parseFloat(row.value) || 0,
      }));

    if (chartData.length > 0) {
      onInsert({
        type: chartType,
        data: chartData,
        width: 400,
        height: 300,
      });
      onOpenChange(false);
      setDataRows([{ name: "", value: "" }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert Chart</DialogTitle>
          <DialogDescription>Create a chart to visualize your data</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Chart Type</Label>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Bar Chart
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4" />
                    Line Chart
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Pie Chart
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Chart Data</Label>
            <div className="space-y-2 mt-2">
              {dataRows.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Label"
                    value={row.name}
                    onChange={(e) => {
                      const newRows = [...dataRows];
                      newRows[index].name = e.target.value;
                      setDataRows(newRows);
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => {
                      const newRows = [...dataRows];
                      newRows[index].value = e.target.value;
                      setDataRows(newRows);
                    }}
                    className="w-32"
                  />
                  {dataRows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRow(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddRow} className="w-full">
                + Add Row
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert}>Insert Chart</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

