// Firebase config (unchanged)
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
let selectedTeams = { 1: [], 2: [], 3: [] };

// Pot multipliers
const potMultipliers = { 1: 1, 2: 1.5, 3: 2, 4: 2.5, 5: 3, 6: 3.5 };

function updateStepIndicator() {
  document.getElementById('step-indicator').textContent = `Step ${currentStep}/${totalSteps}`;
}
function updateTeamsIndicator() {
  document.getElementById('teams-indicator').textContent =
    `${selectedTeams[currentStep].length}/${maxTeamsPerStep} Teams Selected`;
}

function updateSelectedLogos() {
  for (let step = 1; step <= totalSteps; step++) {
    const stepContainer = document.getElementById(`selection-step-${step}`);
    stepContainer.innerHTML = ``;

    if (selectedTeams[step].length > 0) {
      selectedTeams[step].forEach(team => {
        const smallLogo = document.createElement('img');
        smallLogo.src = `img/logos/${team.logo}`;
        smallLogo.className = 'small-logo';
        stepContainer.appendChild(smallLogo);
      });
    } else {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'No teams selected';
      emptyState.style.color = '#fff';
      stepContainer.appendChild(emptyState);
    }
  }
  toggleSubmitButton();
}

function toggleSubmitButton() {
  const submitButton = document.getElementById('submit-button');
  const selectedTeamsInCurrentStep = selectedTeams[currentStep].length;
  if (selectedTeamsInCurrentStep === maxTeamsPerStep) {
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

document.getElementById('submit-button').addEventListener('click', () => {
  if (currentStep < totalSteps) {
    currentStep++;
    document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    if (currentStep === totalSteps) {
      document.getElementById('submit-button').textContent = 'Submit';
    }
    loadTeamsForCurrentStep();
    updateStepIndicator();
    updateTeamsIndicator();
    updateSelectedLogos();
    toggleSubmitButton();
    updateTitleAndBackground();
  } else {
    // Final submission: pull name/department from localStorage
    const playerName = localStorage.getItem('playerName') || '';
    const department = localStorage.getItem('department') || '';

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

    db.collection("players").add(playerData)
      .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
        window.location.href = 'confirmation.html';
      })
      .catch((error) => {
        console.error("Error adding document: ", error);
        alert('Could not save your picks. Please try again.');
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
  cardContainer.innerHTML = '';

  const teamsByPot = teams.reduce((acc, team) => {
    acc[team.pot] = acc[team.pot] || [];
    acc[team.pot].push(team);
    return acc;
  }, {});

  const sortedPots = Object.keys(teamsByPot).sort((a, b) => a - b);

  sortedPots.forEach(pot => {
    const potHeader = document.createElement('div');
    potHeader.className = 'pot-header';
    potHeader.textContent = `Pot ${pot}`;
    potHeader.dataset.multiplier = `x${potMultipliers[pot]} Multiplier`;
    cardContainer.appendChild(potHeader);

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
  let jsonFile = currentStep === 1 ? 'teams.json'
                : currentStep === 2 ? 'europa.json'
                : 'conference.json';

  fetch(jsonFile)
    .then(response => response.json())
    .then(data => initializeTeamCards(data))
    .catch(error => console.error('Error fetching teams:', error));
}

function updateTitleAndBackground() {
  const titleElement = document.getElementById('main-title');
  document.body.classList.remove('champions', 'europa', 'conference');

  if (currentStep === 1) {
    titleElement.textContent = 'Champions League Draft';
    document.body.classList.add('champions');
  } else if (currentStep === 2) {
    titleElement.textContent = 'Europa League Draft';
    document.body.classList.add('europa');
  } else if (currentStep === 3) {
    titleElement.textContent = 'Conference League Draft';
    document.body.classList.add('conference');
  }
}

// boot
loadTeamsForCurrentStep();
