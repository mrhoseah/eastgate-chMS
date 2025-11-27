"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Layout, BarChart3, Database, Download } from "lucide-react";
import { InteractiveFilters, FilterConfig } from "./interactive-filters";
import { CrossFilterProvider } from "./cross-filter";
import { SQLQueryBuilder } from "./sql-query-builder";
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  AreaChartComponent,
  RadarChartComponent,
  TreemapChartComponent,
  FunnelChartComponent,
  ComposedChartComponent,
  ScatterChartComponent,
} from "./chart-components";
import { DataTable } from "./data-table";
import { ReportSection } from "./report-section";
import { exportToPDF } from "@/lib/reports/export";
import { format } from "date-fns";

interface EnhancedReportsPageProps {
  initialData?: any;
}

export function EnhancedReportsPage({ initialData }: EnhancedReportsPageProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filters, setFilters] = useState<any>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/reports/dashboard");
        if (response.ok) {
          const data = await response.json();
          setChartData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      key: "dateRange",
      label: "Date Range",
      type: "date-range",
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "all", label: "All Categories" },
        { value: "donations", label: "Donations" },
        { value: "expenses", label: "Expenses" },
        { value: "events", label: "Events" },
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ],
    },
    {
      key: "search",
      label: "Search",
      type: "search",
      placeholder: "Search reports...",
    },
  ];

  const handleExportPDF = () => {
    try {
      exportToPDF("enhanced-reports-content", `enhanced-reports-${format(new Date(), "yyyy-MM-dd")}`);
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      alert(error.message || "Failed to export PDF. Please try again.");
    }
  };

  return (
    <CrossFilterProvider>
      <div className="space-y-6" id="enhanced-reports-content">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Enhanced Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Advanced analytics and visualization tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Interactive Filters */}
        <InteractiveFilters
          filters={filterConfigs}
          onFilterChange={setFilters}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <Layout className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="charts">
              <BarChart3 className="w-4 h-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="sql">
              <Database className="w-4 h-4 mr-2" />
              SQL Builder
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportSection title="Financial Overview">
                <BarChartComponent 
                  data={chartData.map(d => ({ name: d.name, Income: d.income, Expenses: d.expenses }))} 
                  height={300} 
                />
              </ReportSection>
              <ReportSection title="Attendance Trends">
                <LineChartComponent 
                  data={chartData.map(d => ({ name: d.name, Attendance: d.attendance }))} 
                  height={300} 
                />
              </ReportSection>
              <ReportSection title="Income Distribution">
                <PieChartComponent
                  data={chartData.map((d) => ({ name: d.name, value: d.income }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Member Growth">
                <AreaChartComponent 
                  data={chartData.map(d => ({ name: d.name, "New Members": d.newMembers }))} 
                  height={300} 
                />
              </ReportSection>
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportSection title="Radar Chart">
                <RadarChartComponent
                  data={chartData.map((d) => ({
                    name: d.name,
                    value: d.income,
                    amount: d.expenses,
                  }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Treemap Chart">
                <TreemapChartComponent
                  data={chartData.map((d) => ({ name: d.name, value: d.income }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Funnel Chart">
                <FunnelChartComponent
                  data={chartData.map((d) => ({ name: d.name, value: d.attendance }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Composed Chart">
                <ComposedChartComponent 
                  data={chartData.map(d => ({ 
                    name: d.name, 
                    value: d.income, 
                    amount: d.expenses 
                  }))} 
                  height={300} 
                />
              </ReportSection>
              <ReportSection title="Scatter Chart">
                <ScatterChartComponent
                  data={chartData.map((d, i) => ({
                    name: d.name,
                    x: d.attendance,
                    y: d.income,
                    z: i * 10,
                  }))}
                  height={300}
                />
              </ReportSection>
            </div>
          </TabsContent>

          {/* SQL Builder Tab */}
          <TabsContent value="sql" className="space-y-6">
            <SQLQueryBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </CrossFilterProvider>
  );
}

