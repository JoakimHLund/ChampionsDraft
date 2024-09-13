let maxTeams = 5;
let selectedTeamsCount = 0;

// Pot multipliers
const potMultipliers = {
    1: 1,
    2: 1.5,
    3: 2,
    4: 2.5
};

function updateTeamsIndicator() {
    document.getElementById('teams-indicator').textContent = `${selectedTeamsCount}/${maxTeams} Teams Selected`;
}

function updateSelectedLogos() {
    const selectedLogosContainer = document.getElementById('selected-logos');
    selectedLogosContainer.innerHTML = ''; // Clear existing logos
    const selectedLogos = document.querySelectorAll('.card.selected img.logo');
    selectedLogos.forEach(logo => {
        const smallLogo = document.createElement('img');
        smallLogo.src = logo.src;
        smallLogo.className = 'small-logo';
        selectedLogosContainer.appendChild(smallLogo);
    });
    toggleSubmitButton();
}

function toggleSubmitButton() {
    const playerName = document.getElementById('player-name').value.trim();
    const selectedTeams = document.querySelectorAll('.card.selected').length;
    const submitButton = document.getElementById('submit-button');

    if (playerName !== '' && selectedTeams === maxTeams) {
        submitButton.disabled = false;
        submitButton.style.backgroundColor = '#ff6f00';
        submitButton.style.color = '#fff';
        submitButton.style.cursor = 'pointer';
    } else {
        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#ddd';
        submitButton.style.color = '#aaa';
        submitButton.style.cursor = 'not-allowed';
    }
}

document.getElementById('player-name').addEventListener('input', toggleSubmitButton);

document.getElementById('submit-button').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value.trim();
    const selectedTeams = Array.from(document.querySelectorAll('.card.selected')).map(card => card.querySelector('h2').textContent);
    const dateTime = new Date().toISOString();
    const playerData = {
        playerName: playerName,
        selectedTeams: selectedTeams,
        dateTime: dateTime
    };

    console.log("Player Data:", playerData);
    // Here you can handle the form submission, e.g., send data to a server or display a confirmation message.
    alert('Your selection has been submitted!');
});

function createCard(team) {
    const { name, pot, country, logo } = team;
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.pot = pot;

    card.innerHTML = `
        <img src="img/logos/${logo}" class="logo">
        <h2>${name}</h2>
        <p>Country: ${country}</p>
        <p>Pot ${pot}</p>
        <span class="multiplier-badge">x${potMultipliers[pot]} Multiplier</span>
    `;

    card.addEventListener('click', () => {
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            selectedTeamsCount--;
        } else if (selectedTeamsCount < maxTeams) {
            card.classList.add('selected');
            selectedTeamsCount++;
        }
        updateTeamsIndicator();
        updateSelectedLogos();
        toggleSubmitButton();
    });

    return card;
}

function initializeTeamCards(teams) {
    const cardContainer = document.getElementById('team-cards');

    // Group teams by pot
    const teamsByPot = teams.reduce((acc, team) => {
        acc[team.pot] = acc[team.pot] || [];
        acc[team.pot].push(team);
        return acc;
    }, {});

    // Sort pots
    const sortedPots = Object.keys(teamsByPot).sort((a, b) => a - b);

    sortedPots.forEach(pot => {
        // Create a header for each pot
        const potHeader = document.createElement('div');
        potHeader.className = 'pot-header';
        potHeader.textContent = `Pot ${pot}`;
        potHeader.dataset.multiplier = `x${potMultipliers[pot]} Multiplier`;
        cardContainer.appendChild(potHeader);

        // Create a container for the pot
        const potContainer = document.createElement('div');
        potContainer.className = 'pot-container';

        teamsByPot[pot].forEach(team => {
            const card = createCard(team);
            potContainer.appendChild(card);
        });

        cardContainer.appendChild(potContainer);
    });

    updateTeamsIndicator();
    toggleSubmitButton();
}

// Fetch teams from teams.json
fetch('teams.json')
    .then(response => response.json())
    .then(data => {
        initializeTeamCards(data);
    })
    .catch(error => console.error('Error fetching teams:', error));
