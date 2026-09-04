const chartConfig = {
    series: [44, 55, 13, 43, 22],
    chart: {
        type: "pie",
        width: 280,
        height: 280,
        toolbar: {
            show: false,
        },
    },
    title: {
        show: "",
    },
    dataLabels: {
        enabled: false,
    },
    colors: ["#020617", "#ff8f00", "#00897b", "#1e88e5", "#d81b60"],
    legend: {
        show: false,
    },
};

const chart = new ApexCharts(document.querySelector("#pie-chart"), chartConfig);

chart.render();

