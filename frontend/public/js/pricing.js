// Pricing toggle functionality
const monthlyBtn = document.getElementById('monthly-btn');
const yearlyBtn = document.getElementById('yearly-btn');
const individualPrice = document.getElementById('individual-price');
const individualPeriod = document.getElementById('individual-period');
const fullAccessPrice = document.getElementById('fullaccess-price');
const fullAccessPeriod = document.getElementById('fullaccess-period');

// Pricing data
const pricing = {
    monthly: {
        individual: 'From $49',
        fullAccess: '$497',
        period: '/month'
    },
    yearly: {
        individual: 'From $470',
        fullAccess: '$4,776',
        period: '/year'
    }
};

function switchToMonthly() {
    // Update button styles
    monthlyBtn.classList.add('text-white', 'bg-blue-600');
    monthlyBtn.classList.remove('text-gray-700');
    yearlyBtn.classList.remove('text-white', 'bg-blue-600');
    yearlyBtn.classList.add('text-gray-700');

    // Update prices
    individualPrice.textContent = pricing.monthly.individual;
    individualPeriod.textContent = pricing.monthly.period;
    fullAccessPrice.textContent = pricing.monthly.fullAccess;
    fullAccessPeriod.textContent = pricing.monthly.period;
}

function switchToYearly() {
    // Update button styles
    yearlyBtn.classList.add('text-white', 'bg-blue-600');
    yearlyBtn.classList.remove('text-gray-700');
    monthlyBtn.classList.remove('text-white', 'bg-blue-600');
    monthlyBtn.classList.add('text-gray-700');

    // Update prices
    individualPrice.textContent = pricing.yearly.individual;
    individualPeriod.textContent = pricing.yearly.period;
    fullAccessPrice.textContent = pricing.yearly.fullAccess;
    fullAccessPeriod.textContent = pricing.yearly.period;
}

// Event listeners
monthlyBtn.addEventListener('click', switchToMonthly);
yearlyBtn.addEventListener('click', switchToYearly);