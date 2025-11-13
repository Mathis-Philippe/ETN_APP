// app/back/stats.tsx
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

const screenWidth = Dimensions.get("window").width - 40;

export default function StatsBack() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

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

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  // ------------------------ Group orders by period ------------------------
  const groupOrders = (orders: any[], type: "day" | "week" | "month") => {
    const result: Record<string, number> = {};
    orders.forEach((o) => {
      const date = new Date(o.created_at);
      let key = "";
      if (type === "day") key = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      else if (type === "week") {
        const week = Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7);
        key = `Semaine ${week} ${date.getFullYear()}`;
      } else if (type === "month") {
        key = `${date.toLocaleString("fr-FR", { month: "short" })} ${date.getFullYear()}`;
      }
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  };

  const ordersByPeriod = groupOrders(orders, period);
  const labels = Object.keys(ordersByPeriod).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const dataValues = labels.map((d) => ordersByPeriod[d]);

  // ------------------------ Top clients ------------------------
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

  // ------------------------ Handle touches outside ------------------------
  const hideTooltip = () => setTooltip(null);
  const commented = orders.filter((o) => o.comment && o.comment.trim() !== "").length;
  const uncommented = orders.length - commented;
  
  return (
    <TouchableWithoutFeedback onPress={hideTooltip}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>📊 Statistiques des commandes</Text>

        {/* Sélecteur de période */}
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

        {/* LineChart */}
        <View>
          <LineChart
            data={{ labels, datasets: [{ data: dataValues }] }}
            width={screenWidth}
            height={220}
            chartConfig={{ ...chartConfig, propsForDots: { r: "6" } }}
            style={styles.chart}
            fromZero
            yAxisInterval={1} // valeurs entières
            segments={Math.max(...dataValues)} // ajuster l'échelle
            onDataPointClick={(data) => {
              setTooltip({ x: data.x, y: data.y, value: Math.round(data.value), label: labels[data.index] });
            }}
            formatYLabel={(y) => Math.round(Number(y)).toString()}
          />
          {tooltip && (
            <View style={[styles.tooltip, { left: tooltip.x - 25, bottom: 220 - tooltip.y + 10 }]}>
              <Text style={styles.tooltipText}>
                {tooltip.value} commandes{"\n"}({tooltip.label})
              </Text>
            </View>
          )}
        </View>

        {/* BarChart */}
        <Text style={styles.subtitle}>Top 5 clients par nombre de commandes</Text>
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

             {/* Commandes commentées vs non commentées */}
      <Text style={styles.subtitle}>Commandes commentées vs non commentées</Text>
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
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },
  chart: { marginVertical: 8, borderRadius: 8 },
  tabs: { flexDirection: "row", marginBottom: 10 },
  tab: { flex: 1, padding: 10, borderRadius: 8, marginHorizontal: 4 },
  activeTab: { backgroundColor: "#1e90ff" },
  inactiveTab: { backgroundColor: "#ddd" },
  activeText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  inactiveText: { color: "#333", fontWeight: "600", textAlign: "center" },
  tooltip: {
    position: "absolute",
    backgroundColor: "#1e90ff",
    padding: 6,
    borderRadius: 6,
    zIndex: 1000,
  },
  tooltipText: { color: "#fff", fontWeight: "700", fontSize: 12, textAlign: "center" },
});
