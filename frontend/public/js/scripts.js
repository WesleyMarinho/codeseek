document.addEventListener('DOMContentLoaded', () => {
    console.log("CodeSeek frontend loaded.");

    const toggleButtons = document.querySelectorAll('.pricing-toggle .toggle-btn');
    const priceDisplay = document.querySelector('.all-access-highlight .price-display');

    if (toggleButtons.length > 0 && priceDisplay) {
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                toggleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const period = button.dataset.period;
                if (period === 'monthly') {
                    priceDisplay.textContent = '$497/month';
                } else {
                    priceDisplay.textContent = '$4970/year';
                }
            });
        });
    }
});
