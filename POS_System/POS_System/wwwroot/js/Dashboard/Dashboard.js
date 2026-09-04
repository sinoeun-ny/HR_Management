document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            datasets: [{
                label: 'Expenses',
                data: [2000, 2200, 1500, 2500, 2300, 1900, 1500, 1200, 1400, 2500, 2700, 1800],
                backgroundColor: '#2E6FF2',
                borderRadius: 5,
                barThickness: 25
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 500
                    }
                }
            }
        }
    });
});
