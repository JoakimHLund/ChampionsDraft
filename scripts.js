const firebaseConfig = {
    apiKey: "AIzaSyC36DXqx9qnp1TjMGNX32Nm1p9uGXp62ZA",
    authDomain: "championsdraft-403d0.firebaseapp.com",
    projectId: "championsdraft-403d0",
    storageBucket: "championsdraft-403d0.appspot.com",
    messagingSenderId: "766027841647",
    appId: "1:766027841647:web:99ef32b25549054b218d9a"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();



const totalSteps = 3;
let currentStep = 1;
const maxTeamsPerStep = 5;
let selectedTeams = {
    1: [],
    2: [],
    3: []
};

// Pot multipliers
const potMultipliers = {
    1: 1,
    2: 1.5,
    3: 2,
    4: 2.5,
    5: 3,
    6: 3.5
};

function updateStepIndicator() {
    document.getElementById('step-indicator').textContent = `Step ${currentStep}/${totalSteps}`;
}

function updateTeamsIndicator() {
    document.getElementById('teams-indicator').textContent = `${selectedTeams[currentStep].length}/${maxTeamsPerStep} Teams Selected`;
}


function updateSelectedLogos() {
    for (let step = 1; step <= totalSteps; step++) {
        const stepContainer = document.getElementById(`selection-step-${step}`);
        stepContainer.innerHTML = ``; // Keep the step header

        if (selectedTeams[step].length > 0) {
            selectedTeams[step].forEach(team => {
                const smallLogo = document.createElement('img');
                smallLogo.src = `img/logos/${team.logo}`;
                smallLogo.className = 'small-logo';
                stepContainer.appendChild(smallLogo);
            });
        } else {
            // If no teams are selected, display a placeholder
            const emptyState = document.createElement('p');
            emptyState.textContent = 'No teams selected';
            emptyState.style.color = '#fff';
            stepContainer.appendChild(emptyState);
        }
    }

    toggleSubmitButton();
}


function toggleSubmitButton() {
    const playerName = document.getElementById('player-name').value.trim();
    const selectedTeamsInCurrentStep = selectedTeams[currentStep].length;
    const submitButton = document.getElementById('submit-button');

    if (playerName !== '' && selectedTeamsInCurrentStep === maxTeamsPerStep) {
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
    if (currentStep < totalSteps) {
        // Move to next step
        currentStep++;
        // Remove 'selected' class from all cards
        document.querySelectorAll('.card.selected').forEach(card => card.classList.remove('selected'));
        // Change button text if needed
        if (currentStep === totalSteps) {
            document.getElementById('submit-button').textContent = 'Submit';
        }
        // Load teams for the next step
        loadTeamsForCurrentStep();
        // Update teams indicator and selected logos
        updateStepIndicator();
        updateTeamsIndicator();
        updateSelectedLogos();
        toggleSubmitButton();
        updateTitleAndBackground();
    } else {
        // Final submission
        const playerName = document.getElementById('player-name').value.trim();
        const department = document.getElementById('department').value.trim();
        const playerData = {
            Name: playerName,
            Department: department,
            championspoints: 0,
            europapoints: 0,
            conferencepoints: 0,
            totalpoints: 0,
            selectedChampions: selectedTeams[1],
            selectedEuropa: selectedTeams[2],
            selectedConference: selectedTeams[3]
        };

        // Store player data in Firebase
        db.collection("players").add(playerData)
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
            window.location.href = 'confirmation.html';
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
    }
});

function createCard(team) {
    const { name, pot, country, logo } = team;
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.pot = pot;
    card.dataset.teamName = name;

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
            selectedTeams[currentStep] = selectedTeams[currentStep].filter(t => t.name !== team.name);
        } else if (selectedTeams[currentStep].length < maxTeamsPerStep) {
            card.classList.add('selected');
            selectedTeams[currentStep].push(team);
        }
        updateStepIndicator();
        updateTeamsIndicator();
        updateSelectedLogos();
        toggleSubmitButton();
    });

    return card;
}

function initializeTeamCards(teams) {
    const cardContainer = document.getElementById('team-cards');
    cardContainer.innerHTML = ''; // Clear existing cards

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
    updateStepIndicator();
    toggleSubmitButton();
}

function loadTeamsForCurrentStep() {
    let jsonFile;
    if (currentStep === 1) {
        jsonFile = 'teams.json';
    } else if (currentStep === 2) {
        jsonFile = 'europa.json';
    } else if (currentStep === 3) {
        jsonFile = 'conference.json';
    }

    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            initializeTeamCards(data);
        })
        .catch(error => console.error('Error fetching teams:', error));
}

function updateTitleAndBackground() {
    const titleElement = document.getElementById('main-title');
    if (currentStep === 1) {
        titleElement.textContent = 'Champions League Betting Game';
        document.body.style.backgroundColor = '#f0f8ff'; // Default background color
    } else if (currentStep === 2) {
        titleElement.textContent = 'Europa League Betting Game';
        document.body.style.backgroundColor = '#FFDAB9'; // Pale orange
    } else if (currentStep === 3) {
        titleElement.textContent = 'Conference League Betting Game';
        document.body.style.backgroundColor = '#98FB98'; // Pale green
    }
}


// Load initial teams
loadTeamsForCurrentStep();
