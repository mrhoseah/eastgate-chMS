"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FlaskConical, 
  BarChart3, 
  Play, 
  Pause,
  TrendingUp,
  Users,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMarketingStore } from "@/lib/store/marketing-store";

interface ABTest {
  id: string;
  name: string;
  type: 'email' | 'social' | 'landing';
  variantA: { name: string; performance: number };
  variantB: { name: string; performance: number };
  status: 'running' | 'completed' | 'paused';
  participants: number;
  winner?: 'A' | 'B';
  confidence: number;
}

interface ABTestingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ABTesting({ open, onOpenChange }: ABTestingProps) {
  const { toast } = useToast();
  const { abTests, addABTest, updateABTest, endABTest } = useMarketingStore();
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState<'email' | 'social' | 'landing'>('email');
  const [variantAName, setVariantAName] = useState("");
  const [variantBName, setVariantBName] = useState("");

  const handleCreateTest = () => {
    if (!testName || !variantAName || !variantBName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    addABTest({
      name: testName,
      type: testType,
      variantA: { name: variantAName, performance: 0, participants: 0 },
      variantB: { name: variantBName, performance: 0, participants: 0 },
      status: 'running',
    });

    toast({
      title: "A/B Test Created",
      description: `${testName} test has been started`,
    });

    // Reset form
    setTestName("");
    setVariantAName("");
    setVariantBName("");
  };

  const handleEndTest = (testId: string) => {
    endABTest(testId);
    toast({
      title: "Test Completed",
      description: "Winner has been determined",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            A/B Testing
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Test different versions of your content to optimize performance
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tests" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="tests">Active Tests</TabsTrigger>
            <TabsTrigger value="create">Create Test</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {abTests.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No A/B tests running</p>
                  <p className="text-xs mt-2">Create a test to compare content variations</p>
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  {abTests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white">{test.name}</h3>
                            <Badge
                              variant="outline"
                              className={
                                test.status === 'running'
                                  ? 'bg-green-600/20 text-green-400 border-green-500/30'
                                  : test.status === 'completed'
                                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                                  : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                              }
                            >
                              {test.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>{test.participants} participants</span>
                            {test.status === 'running' && (
                              <span>{test.confidence}% confidence</span>
                            )}
                          </div>
                        </div>
                        {test.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEndTest(test.id)}
                            className="border-gray-700 text-gray-300 text-xs"
                          >
                            End Test
                          </Button>
                        )}
                      </div>

                      {/* Variant Comparison */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg border-2 ${
                          test.winner === 'A' 
                            ? 'border-green-500 bg-green-600/10' 
                            : 'border-gray-700 bg-gray-800/50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-300">Variant A</span>
                            {test.winner === 'A' && (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{test.variantA.name}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Performance:</span>
                              <span className="text-white font-semibold">{test.variantA.performance}%</span>
                            </div>
                            <Progress value={test.variantA.performance} className="h-2" />
                          </div>
                        </div>

                        <div className={`p-3 rounded-lg border-2 ${
                          test.winner === 'B' 
                            ? 'border-green-500 bg-green-600/10' 
                            : 'border-gray-700 bg-gray-800/50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-300">Variant B</span>
                            {test.winner === 'B' && (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{test.variantB.name}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Performance:</span>
                              <span className="text-white font-semibold">{test.variantB.performance}%</span>
                            </div>
                            <Progress value={test.variantB.performance} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-2">
                <div>
                  <Label htmlFor="test-name" className="text-sm font-medium text-gray-300 mb-2 block">
                    Test Name
                  </Label>
                  <Input
                    id="test-name"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g., Email Subject Line Test"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">Test Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['email', 'social', 'landing'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setTestType(type as any)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          testType === type
                            ? 'border-blue-500 bg-blue-600/20'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-xs font-medium text-white capitalize">{type}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="variant-a" className="text-sm font-medium text-gray-300 mb-2 block">
                    Variant A
                  </Label>
                  <Input
                    id="variant-a"
                    value={variantAName}
                    onChange={(e) => setVariantAName(e.target.value)}
                    placeholder="Version A description"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="variant-b" className="text-sm font-medium text-gray-300 mb-2 block">
                    Variant B
                  </Label>
                  <Input
                    id="variant-b"
                    value={variantBName}
                    onChange={(e) => setVariantBName(e.target.value)}
                    placeholder="Version B description"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    <strong>How it works:</strong> Both variants will be sent to equal portions of your audience. 
                    The system will track performance metrics and determine a winner based on engagement rates.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTest}
                disabled={!testName || !variantAName || !variantBName}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Test
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

