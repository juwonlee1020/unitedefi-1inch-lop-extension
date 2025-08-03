import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    status: "done",
    type: "TWAP → DUTCH_AUCTION → PRENEGOTIATED",
    makerToken: { symbol: "DAI", address: "0x..." },
    takerToken: { symbol: "WETH", address: "0x..." },
    makerAmount: "10000",
    totalFilled: "10000",
    averageFillPrice: "0.000235",
    startTime: new Date("2024-01-15T10:00:00"),
    endTime: new Date("2024-01-15T10:35:00"),
    fillData: [
      // TWAP phase (0-20 minutes) - random realistic prices around 0.00025
      { time: "2024-01-15T10:02:00", price: 0.000248, cumulative: 800, strategy: "TWAP" },
      { time: "2024-01-15T10:05:00", price: 0.000252, cumulative: 1600, strategy: "TWAP" },
      { time: "2024-01-15T10:08:00", price: 0.000249, cumulative: 2400, strategy: "TWAP" },
      { time: "2024-01-15T10:11:00", price: 0.000251, cumulative: 3200, strategy: "TWAP" },
      { time: "2024-01-15T10:14:00", price: 0.000247, cumulative: 4000, strategy: "TWAP" },
      { time: "2024-01-15T10:17:00", price: 0.000253, cumulative: 4800, strategy: "TWAP" },
      { time: "2024-01-15T10:20:00", price: 0.000250, cumulative: 5600, strategy: "TWAP" },
      
      // DUTCH_AUCTION phase (20-30 minutes) - linearly decreasing from 0.00025 to 0.00022
      { time: "2024-01-15T10:22:00", price: 0.000244, cumulative: 6200, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-15T10:24:00", price: 0.000238, cumulative: 6800, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-15T10:26:00", price: 0.000232, cumulative: 7400, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-15T10:28:00", price: 0.000226, cumulative: 8000, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-15T10:30:00", price: 0.000220, cumulative: 8600, strategy: "DUTCH_AUCTION" },
      
      // PRENEGOTIATED phase (30+ minutes) - fixed price at 0.00020
      { time: "2024-01-15T10:32:00", price: 0.000200, cumulative: 9300, strategy: "PRENEGOTIATED" },
      { time: "2024-01-15T10:35:00", price: 0.000200, cumulative: 10000, strategy: "PRENEGOTIATED" },
    ],
    parameters: {
      phase1: "TWAP (20min)",
      phase2: "Dutch Auction (10min)", 
      phase3: "Prenegotiated (5min)",
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
    startTime: new Date("2024-01-10T14:00:00"),
    endTime: new Date("2024-01-10T16:00:00"),
    fillData: [
      { time: "2024-01-10T14:00:00", price: 66000, cumulative: 10000, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-10T14:30:00", price: 65800, cumulative: 25000, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-10T15:00:00", price: 65600, cumulative: 35000, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-10T15:30:00", price: 65200, cumulative: 45000, strategy: "DUTCH_AUCTION" },
      { time: "2024-01-10T15:50:00", price: 65000, cumulative: 50000, strategy: "DUTCH_AUCTION" },
    ],
    parameters: {
      startPrice: "$66,000",
      endPrice: "$65,000",
      duration: "2 hours"
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
    startTime: new Date("2024-01-18T09:00:00"),
    endTime: new Date("2024-01-18T10:20:00"),
    fillData: [
      { time: "2024-01-18T09:00:00", price: 0.86, cumulative: 500, strategy: "TWAP" },
      { time: "2024-01-18T09:45:00", price: 0.84, cumulative: 1200, strategy: "TWAP" },
    ],
    parameters: {
      timeInterval: "45 minutes",
      orderCount: "2",
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
    case "PRENEGOTIATED": return "#10b981";
    default: return "#8b5cf6";
  }
};

const getPointColor = (strategy: string) => {
  switch (strategy) {
    case "TWAP": return "#e11d48";
    case "DUTCH_AUCTION": return "#3b82f6";
    case "PRENEGOTIATED": return "#10b981";
    default: return "#8b5cf6";
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm text-muted-foreground">
          {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-sm font-medium">
          Price: <span className="text-foreground">{data.price.toFixed(6)}</span>
        </p>
        <p className="text-sm font-medium">
          Cumulative: <span className="text-foreground">{data.cumulative}</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getPointColor(data.strategy) }}
          />
          <span className="text-sm font-medium text-foreground">{data.strategy}</span>
        </div>
      </div>
    );
  }
  return null;
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
                  <p className="font-semibold">{strategy.startTime.toLocaleString()}</p>
                </div>
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="font-semibold">{strategy.endTime.toLocaleString()}</p>
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
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="price" 
                      stroke={getStrategyColor(strategy.type)}
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill={getPointColor(payload.strategy)}
                            stroke={getPointColor(payload.strategy)}
                            strokeWidth={2}
                          />
                        );
                      }}
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