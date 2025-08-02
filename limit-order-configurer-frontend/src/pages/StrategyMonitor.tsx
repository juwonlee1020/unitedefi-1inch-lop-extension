import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Clock, 
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle,
  PlayCircle,
  Zap
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar
} from "recharts";
import { useAppSelector } from '@/store';

// Mock data for strategies
const mockStrategies = [
  {
    id: "1",
    status: "active",
    type: "TWAP",
    makerToken: { symbol: "USDC", address: "0x..." },
    takerToken: { symbol: "ETH", address: "0x..." },
    makerAmount: "10000",
    totalFilled: "6500",
    averageFillPrice: "2850.45",
    startTime: new Date("2024-01-15"),
    endTime: new Date("2024-01-20"),
    fillData: [
      { time: "2024-01-15T10:00:00", price: 2800, cumulative: 1000 },
      { time: "2024-01-15T14:00:00", price: 2820, cumulative: 2200 },
      { time: "2024-01-16T09:00:00", price: 2840, cumulative: 3500 },
      { time: "2024-01-16T15:00:00", price: 2880, cumulative: 4800 },
      { time: "2024-01-17T11:00:00", price: 2850, cumulative: 6500 },
    ],
    parameters: {
      timeInterval: "4 hours",
      orderCount: "20",
      slippageTolerance: "0.5%"
    }
  },
  {
    id: "2",
    status: "done",
    type: "DUTCH_AUCTION",
    makerToken: { symbol: "DAI", address: "0x..." },
    takerToken: { symbol: "BTC", address: "0x..." },
    makerAmount: "50000",
    totalFilled: "50000",
    averageFillPrice: "65420.30",
    startTime: new Date("2024-01-10"),
    endTime: new Date("2024-01-12"),
    fillData: [
      { time: "2024-01-10T10:00:00", price: 66000, cumulative: 10000 },
      { time: "2024-01-10T16:00:00", price: 65800, cumulative: 25000 },
      { time: "2024-01-11T08:00:00", price: 65600, cumulative: 35000 },
      { time: "2024-01-11T20:00:00", price: 65200, cumulative: 45000 },
      { time: "2024-01-12T14:00:00", price: 65000, cumulative: 50000 },
    ],
    parameters: {
      startPrice: "$66,000",
      endPrice: "$65,000",
      duration: "48 hours"
    }
  },
  {
    id: "3",
    status: "cancelled",
    type: "TWAP",
    makerToken: { symbol: "USDT", address: "0x..." },
    takerToken: { symbol: "MATIC", address: "0x..." },
    makerAmount: "5000",
    totalFilled: "1200",
    averageFillPrice: "0.85",
    startTime: new Date("2024-01-18"),
    endTime: new Date("2024-01-25"),
    fillData: [
      { time: "2024-01-18T10:00:00", price: 0.86, cumulative: 500 },
      { time: "2024-01-18T18:00:00", price: 0.84, cumulative: 1200 },
    ],
    parameters: {
      timeInterval: "8 hours",
      orderCount: "15",
      slippageTolerance: "1%"
    }
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-primary text-primary-foreground";
    case "done": return "bg-green-600 text-white";
    case "cancelled": return "bg-red-600 text-white";
    default: return "bg-secondary";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active": return <PlayCircle className="w-3 h-3" />;
    case "done": return <CheckCircle className="w-3 h-3" />;
    case "cancelled": return <XCircle className="w-3 h-3" />;
    default: return null;
  }
};

const getStrategyColor = (type: string) => {
  switch (type) {
    case "TWAP": return "#e11d48";
    case "DUTCH_AUCTION": return "#3b82f6";
    default: return "#8b5cf6";
  }
};

const StrategyCard = ({ strategy, isExpanded, onToggle, onTestFill }: any) => {
  const fillPercentage = (parseFloat(strategy.totalFilled) / parseFloat(strategy.makerAmount)) * 100;
  
  return (
    <Card className="w-full bg-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
      <CardHeader 
        className="cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(strategy.status)}>
              {getStatusIcon(strategy.status)}
              <span className="ml-1 capitalize">{strategy.status}</span>
            </Badge>
            <Badge variant="outline" className="bg-accent">
              {strategy.type}
            </Badge>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        
        <CardTitle className="text-lg">
          {strategy.makerToken.symbol} → {strategy.takerToken.symbol}
        </CardTitle>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold">{strategy.makerAmount} {strategy.makerToken.symbol}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Filled</p>
              <p className="font-semibold">{strategy.totalFilled} ({fillPercentage.toFixed(1)}%)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Price</p>
              <p className="font-semibold">${strategy.averageFillPrice}</p>
            </div>
          </div>
        </div>
        
        <Progress value={fillPercentage} className="mt-4" />

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onTestFill(strategy);
            }}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Test Fill
          </Button>
        </div>

      </CardHeader>
      
      {isExpanded && (
        <CardContent className="border-t border-border">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-accent">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chart">Fill Chart</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="font-semibold">{strategy.startTime.toLocaleDateString()}</p>
                </div>
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="font-semibold">{strategy.endTime.toLocaleDateString()}</p>
                </div>
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Maker Token</p>
                  <p className="font-semibold">{strategy.makerToken.symbol}</p>
                </div>
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Taker Token</p>
                  <p className="font-semibold">{strategy.takerToken.symbol}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chart" className="mt-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={strategy.fillData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      yAxisId="price"
                      orientation="left"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="cumulative"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="price" 
                      stroke={getStrategyColor(strategy.type)}
                      strokeWidth={2}
                      dot={{ fill: getStrategyColor(strategy.type), strokeWidth: 2, r: 4 }}
                    />
                    <Bar 
                      yAxisId="cumulative"
                      dataKey="cumulative" 
                      fill={`${getStrategyColor(strategy.type)}30`}
                      opacity={0.6}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="parameters" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(strategy.parameters).map(([key, value]) => (
                  <div key={key} className="bg-surface-elevated p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="font-semibold">{String(value)}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};

const StrategyMonitor = () => {
  const navigate = useNavigate();

  const reduxStrategies = useAppSelector(state => state.strategies.strategies);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Take first 2 mock strategies as samples
  const sampleStrategies = mockStrategies.slice(0, 2);

  // Transform Redux strategies to match the UI format
  const transformedReduxStrategies = reduxStrategies.map(strategy => ({
    ...strategy,
    makerToken: { symbol: strategy.orderParams.makerToken },
    takerToken: { symbol: strategy.orderParams.takerToken },
    makerAmount: strategy.orderParams.makerAmount,
    startTime: new Date(strategy.createdAt),
    endTime: new Date(strategy.createdAt), // You might want to calculate this based on strategy params
    fillData: strategy.fillEvents.map(event => ({
      time: event.timestamp,
      price: event.fillPrice,
      cumulative: event.cumulativeAmount
    })),
    parameters: strategy.strategyParams || {}
  }));

  // Combine Redux strategies with sample strategies
  const allStrategies = [...transformedReduxStrategies, ...sampleStrategies];

  const filteredStrategies = allStrategies.filter(strategy => 
    statusFilter === "all" || strategy.status.toLowerCase() === statusFilter
  );

  const toggleStrategy = (id: string) => {
    setExpandedStrategy(expandedStrategy === id ? null : id);
  };
  const handleTestFill = (strategy: any) => {
    navigate(`/fill/${strategy.id}`, { state: { strategy } });
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-8 pb-16">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-inter tracking-tight">
              Strategy Monitor
            </h1>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto font-inter font-light leading-relaxed">
              Track and analyze your deployed trading strategies
            </p>
            <div className="w-24 h-1 bg-gradient-primary rounded-full mx-auto"></div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "done" ? "default" : "outline"}
              onClick={() => setStatusFilter("done")}
              size="sm"
            >
              Done
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              onClick={() => setStatusFilter("cancelled")}
              size="sm"
            >
              Cancelled
            </Button>
          </div>

          <div className="space-y-4">
            {filteredStrategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                isExpanded={expandedStrategy === strategy.id}
                onToggle={() => toggleStrategy(strategy.id)}
                onTestFill={handleTestFill}

              />
            ))}
          </div>

          {filteredStrategies.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No strategies found</h3>
              <p className="text-muted-foreground">
                {allStrategies.length === 0 
                  ? "Create your first strategy in the Configuration page to see it here."
                  : "No strategies match the current filter."
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StrategyMonitor;