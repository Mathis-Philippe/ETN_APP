import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import supabase from "../../lib/supabase";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { MaterialIcons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width - 40;

export default function StatsBack() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  
  const [chartPage, setChartPage] = useState(0); 

  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase.from("orders").select("*");
      const { data: clientsData, error: clientsError } = await supabase.from("clients").select("code_client, nom");
      if (ordersError) console.error(ordersError);
      if (clientsError) console.error(clientsError);
      setOrders(ordersData || []);
      setClients(clientsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setChartPage(0);
  }, [period]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const groupOrders = (orders: any[], type: "day" | "week" | "month") => {
    const result: Record<string, number> = {};
    orders.forEach((o) => {
      const date = new Date(o.created_at);
      let key = "";
      if (type === "day") key = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      else if (type === "week") {
        const onejan = new Date(date.getFullYear(), 0, 1);
        const millisecsInDay = 86400000;
        const week = Math.ceil((((date.getTime() - onejan.getTime()) / millisecsInDay) + onejan.getDay() + 1) / 7);
        key = `S${week} ${date.getFullYear()}`;
      } else if (type === "month") {
        key = `${date.toLocaleString("fr-FR", { month: "short" })} ${date.getFullYear()}`;
      }
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  };

  const ordersByPeriod = groupOrders(orders, period);
  const allLabels = Object.keys(ordersByPeriod).sort((a, b) => {
      if(period === 'week' && a.startsWith('S') && b.startsWith('S')) {
         const [wa, ya] = a.replace('S','').split(' ');
         const [wb, yb] = b.replace('S','').split(' ');
         return (parseInt(ya) - parseInt(yb)) || (parseInt(wa) - parseInt(wb));
      }
      return new Date(a).getTime() - new Date(b).getTime();
  });
  
  const allDataValues = allLabels.map((d) => ordersByPeriod[d]);

  const limit = period === "day" ? 8 : period === "week" ? 5 : 4;
  
  const endIndex = allLabels.length - (chartPage * limit);
  const startIndex = Math.max(0, endIndex - limit);
  
  const visibleLabels = allLabels.slice(startIndex, endIndex);
  const visibleData = allDataValues.slice(startIndex, endIndex);

  const canGoOlder = startIndex > 0;
  const canGoNewer = chartPage > 0;

  const ordersByClient: Record<string, number> = {};
  orders.forEach((o) => {
    ordersByClient[o.client_id] = (ordersByClient[o.client_id] || 0) + 1;
  });

  const topClients = Object.entries(ordersByClient)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([client_id, count]) => {
      const client = clients.find((c) => c.code_client === client_id);
      return { name: client?.nom ?? client_id, count };
    });

  const hideTooltip = () => setTooltip(null);
  const commented = orders.filter((o) => o.comment && o.comment.trim() !== "").length;
  const uncommented = orders.length - commented;
  
  const maxDataValue = visibleData.length > 0 ? Math.max(...visibleData) : 0;
  
  return (
    <TouchableWithoutFeedback onPress={hideTooltip}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>📊 Statistiques des commandes</Text>

        <View style={styles.tabs}>
          {(["day", "week", "month"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, period === p ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setPeriod(p)}
            >
              <Text style={period === p ? styles.activeText : styles.inactiveText}>
                {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartHeader}>
            <TouchableOpacity 
                disabled={!canGoOlder} 
                onPress={() => setChartPage(p => p + 1)}
                style={{ opacity: canGoOlder ? 1 : 0.3, padding: 5 }}
            >
                <MaterialIcons name="chevron-left" size={32} color="#4A90E2" />
            </TouchableOpacity>
            
            <Text style={styles.chartPageText}>
                {visibleLabels.length > 0 ? `${visibleLabels[0]} - ${visibleLabels[visibleLabels.length - 1]}` : "Aucune donnée"}
            </Text>

            <TouchableOpacity 
                disabled={!canGoNewer} 
                onPress={() => setChartPage(p => p - 1)}
                style={{ opacity: canGoNewer ? 1 : 0.3, padding: 5 }}
            >
                <MaterialIcons name="chevron-right" size={32} color="#4A90E2" />
            </TouchableOpacity>
        </View>

        <View>
          {visibleLabels.length > 0 ? (
            <LineChart
                data={{ labels: visibleLabels, datasets: [{ data: visibleData }] }}
                width={screenWidth}
                height={220}
                chartConfig={{ ...chartConfig, propsForDots: { r: "6" } }}
                style={styles.chart}
                fromZero
                yAxisInterval={1} 
                segments={maxDataValue > 0 ? maxDataValue : 1} 
                onDataPointClick={(data) => {
                    setTooltip({ x: data.x, y: data.y, value: Math.round(data.value), label: visibleLabels[data.index] });
                }}
                formatYLabel={(y) => Math.round(Number(y)).toString()}
            />
          ) : (
             <Text style={{textAlign: 'center', marginVertical: 20, color: '#666'}}>Pas assez de données</Text>
          )}

          {tooltip && (
            <View style={[styles.tooltip, { left: tooltip.x - 25, bottom: 220 - tooltip.y + 10 }]}>
              <Text style={styles.tooltipText}>
                {tooltip.value} commandes{"\n"}({tooltip.label})
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.subtitle}>Top 5 clients</Text>
        <BarChart
          data={{
            labels: topClients.map((c) => c.name),
            datasets: [{ data: topClients.map((c) => c.count) }],
          }}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          yAxisLabel=""
          yAxisSuffix=""
          showValuesOnTopOfBars
          verticalLabelRotation={0}
        />

        <Text style={styles.subtitle}>Commentaires</Text>
        <PieChart
            data={[
            { name: "Commentées", population: commented, color: "#4A90E2", legendFontColor: "#333", legendFontSize: 14 },
            { name: "Non commentées", population: uncommented, color: "#ccc", legendFontColor: "#333", legendFontSize: 14 },
            ]}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(30, 144, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  propsForLabels: { fontSize: 10 },
  decimalPlaces: 0,
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },

  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 20 
  },

  subtitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginVertical: 10 
  },

  chart: { 
    marginVertical: 8, 
    borderRadius: 8 
  },

  tabs: { 
    flexDirection: "row", 
    marginBottom: 10 
  },

  tab: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 8, 
    marginHorizontal: 4 
  },

  activeTab: { 
    backgroundColor: "#1e90ff" 
  },

  inactiveTab: { 
    backgroundColor: "#ddd" 
  },

  activeText: { 
    color: "#fff", 
    fontWeight: "700", 
    textAlign: "center" 
  },

  inactiveText: { 
    color: "#333", 
    fontWeight: "600", 
    textAlign: "center" 
  },
  
  tooltip: {
    position: "absolute",
    backgroundColor: "#1e90ff",
    padding: 6,
    borderRadius: 6,
    zIndex: 1000,
  },
  tooltipText: { color: "#fff", fontWeight: "700", fontSize: 12, textAlign: "center" },
  chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      marginBottom: 5,
  },
  chartPageText: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500'
  }
});