// Shared dark-mode chart styling
const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      labels: { color: "#cbd5e1", boxWidth: 12, font: { size: 11 } },
    },
  },
  scales: {
    x: {
      ticks: { color: "#94a3b8", maxTicksLimit: 10 },
      grid: { color: "rgba(148, 163, 184, 0.08)" },
      title: { display: true, text: "Sim Time (s)", color: "#64748b", font: { size: 11 } },
    },
    y: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148, 163, 184, 0.08)" },
    },
  },
};

// 1. Multi-Battery SoC Chart (Auto-scaled for high-precision SoC changes)
const socChart = new Chart(document.getElementById("socChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label: "Battery 1 (%)", data: [], borderColor: "#22d3ee", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
      { label: "Battery 2 (%)", data: [], borderColor: "#34d399", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
      { label: "Battery 3 (%)", data: [], borderColor: "#a78bfa", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
      { label: "Avg SoC (%)",   data: [], borderColor: "#f8fafc", borderWidth: 2, borderDash: [4, 4], pointRadius: 0, tension: 0.2 },
    ],
  },
  options: baseChartOptions,
});

// 2. Power & Current Chart
const powerChart = new Chart(document.getElementById("powerChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label: "Active Power (kW)",    data: [], borderColor: "#fbbf24", backgroundColor: "rgba(251,191,36,0.1)", fill: true, borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
      { label: "Battery Current (A)",  data: [], borderColor: "#f43f5e", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
    ],
  },
  options: baseChartOptions,
});

// 3. Voltage Chart
const voltageChart = new Chart(document.getElementById("voltageChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label: "DC Bus Voltage (V)",  data: [], borderColor: "#38bdf8", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
      { label: "Battery Voltage (V)", data: [], borderColor: "#818cf8", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
    ],
  },
  options: baseChartOptions,
});

// 4. Financial Economics Chart
const financeChart = new Chart(document.getElementById("financeChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label: "G2V Cost (₹)",    data: [], borderColor: "#fb7185", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
      { label: "V2G Revenue (₹)", data: [], borderColor: "#4ade80", borderWidth: 2, pointRadius: 1.5, tension: 0.2 },
      { label: "Net Balance (₹)", data: [], borderColor: "#facc15", borderWidth: 2.5, pointRadius: 1.5, tension: 0.2 },
    ],
  },
  options: baseChartOptions,
});

const allCharts = [socChart, powerChart, voltageChart, financeChart];

function resetAllCharts() {
  allCharts.forEach((chart) => {
    chart.data.labels = [];
    chart.data.datasets.forEach((ds) => (ds.data = []));
    chart.update();
  });
}

function appendPointToCharts(d) {
  const label = `${d.SimTime_s.toFixed(1)}s`;

  socChart.data.labels.push(label);
  socChart.data.datasets[0].data.push(d.SoC1_pct);
  socChart.data.datasets[1].data.push(d.SoC2_pct);
  socChart.data.datasets[2].data.push(d.SoC3_pct);
  socChart.data.datasets[3].data.push(d.Avg_SoC_pct);

  powerChart.data.labels.push(label);
  powerChart.data.datasets[0].data.push(d.Power_kW);
  powerChart.data.datasets[1].data.push(d.Battery_Current_A);

  voltageChart.data.labels.push(label);
  voltageChart.data.datasets[0].data.push(d.DC_Bus_Voltage_V);
  voltageChart.data.datasets[1].data.push(d.Battery_Voltage_V);

  financeChart.data.labels.push(label);
  financeChart.data.datasets[0].data.push(d.Cum_G2V_Cost_INR);
  financeChart.data.datasets[1].data.push(d.Cum_V2G_Revenue_INR);
  financeChart.data.datasets[2].data.push(d.Net_Balance_INR);
}

function updateKPIs(d) {
  document.getElementById("kpi-time").textContent = `${d.SimTime_s.toFixed(1)} s`;
  document.getElementById("kpi-timestamp").textContent = d.Timestamp;

  document.getElementById("kpi-soc").textContent = `${d.Avg_SoC_pct.toFixed(4)} %`;
  document.getElementById("kpi-soh").textContent = `SoH: ${d.SoH_pct.toFixed(4)} %`;

  document.getElementById("kpi-vdc").textContent = `${d.DC_Bus_Voltage_V.toFixed(2)} V`;
  document.getElementById("kpi-vbat").textContent = `Vbat: ${d.Battery_Voltage_V.toFixed(2)} V`;

  document.getElementById("kpi-power").textContent = `${d.Power_kW.toFixed(2)} kW`;
  document.getElementById("kpi-loss").textContent = `Loss: ${d.Power_Loss_W.toFixed(2)} W`;

  document.getElementById("kpi-tariff").textContent = `₹${d.Tariff_Rate_INR_kWh.toFixed(2)}/kWh`;
  document.getElementById("kpi-energy").textContent = `Energy: ${d.Cum_Energy_kWh.toFixed(4)} kWh`;

  const netEl = document.getElementById("kpi-net");
  netEl.textContent = `₹${d.Net_Balance_INR.toFixed(4)}`;
  netEl.className = `text-2xl font-bold mt-1 ${
    d.Net_Balance_INR >= 0 ? "text-emerald-400" : "text-rose-400"
  }`;
  document.getElementById("kpi-rev-cost").textContent =
    `G2V: ₹${d.Cum_G2V_Cost_INR.toFixed(3)} | V2G: ₹${d.Cum_V2G_Revenue_INR.toFixed(3)}`;

  // Battery Pack Cards
  const packs = [
    { id: "b1", soc: d.SoC1_pct, cost: d.Cost_Bat1_INR },
    { id: "b2", soc: d.SoC2_pct, cost: d.Cost_Bat2_INR },
    { id: "b3", soc: d.SoC3_pct, cost: d.Cost_Bat3_INR },
  ];
  packs.forEach((p) => {
    document.getElementById(`${p.id}-soc`).textContent = `${p.soc.toFixed(4)} %`;
    document.getElementById(`${p.id}-cost`).textContent = `Net Cost: ₹${p.cost.toFixed(4)}`;
    document.getElementById(`${p.id}-bar`).style.width = `${Math.max(0, Math.min(100, p.soc))}%`;
  });

  // Operating Mode Badge Styling
  const modeBadge = document.getElementById("mode-badge");
  modeBadge.textContent = `MODE: ${d.OperatingMode}`;
  if (d.ModeCode === 1) {
    modeBadge.className = "px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/40";
  } else if (d.ModeCode === -1) {
    modeBadge.className = "px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40";
  } else {
    modeBadge.className = "px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/40";
  }
}

function setConnectionStatus(connected) {
  const badge = document.getElementById("ws-badge");
  const dot = document.getElementById("ws-dot");
  const text = document.getElementById("ws-text");

  if (connected) {
    badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    dot.className = "h-2 w-2 rounded-full bg-emerald-400 animate-pulse";
    text.textContent = "Live Connected";
  } else {
    badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30";
    dot.className = "h-2 w-2 rounded-full bg-rose-400";
    text.textContent = "Reconnecting...";
  }
}

// WebSocket Client with Auto-Reconnect
function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.onopen = () => setConnectionStatus(true);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "reset") {
      resetAllCharts();
    } else if (msg.type === "history") {
      resetAllCharts();
      msg.data.forEach((pt) => appendPointToCharts(pt));
      if (msg.data.length > 0) {
        updateKPIs(msg.data[msg.data.length - 1]);
      }
      allCharts.forEach((c) => c.update());
    } else if (msg.type === "update") {
      appendPointToCharts(msg.data);
      updateKPIs(msg.data);
      allCharts.forEach((c) => c.update());
    }
  };

  ws.onclose = () => {
    setConnectionStatus(false);
    setTimeout(connectWebSocket, 2000);
  };

  ws.onerror = () => ws.close();
}

connectWebSocket();