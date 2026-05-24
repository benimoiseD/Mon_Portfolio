// Récupération des éléments du DOM
const formulaireTransaction = document.getElementById('formulaire-transaction');
const descriptionInput = document.getElementById('description');
const montantInput = document.getElementById('montant');
const typeInput = document.getElementById('type');
const listeTransactions = document.getElementById('liste-transactions');
const soldeAffichage = document.getElementById('solde');
const revenusAffichage = document.getElementById('revenus');
const depensesAffichage = document.getElementById('depenses');
const epargneAffichage = document.getElementById('epargne');
const periodeSelect = document.getElementById('periode-select');
const dateFiltreInput = document.getElementById('date-filtre');
const totauxDiv = document.getElementById('totaux-periode');

// Gestion multi-utilisateur (optionnel)
const courrielActuel = localStorage.getItem('currentUserEmail');

// Chargement des transactions depuis le localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Fonction utilitaire pour formater une date en yyyy-mm-dd
function formaterDate(date) {
  return date.toISOString().split('T')[0];
}

// Fonction pour sauvegarder dans le localStorage
function sauvegarderTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Fonction pour mettre à jour le tableau de bord (tous les comptes)
function mettreAJourTableauBord() {
  let revenus = 0, depenses = 0, epargne = 0;
  recupererTransactionsUtilisateur().forEach(t => {
    if (t.type === 'revenu') revenus += t.amount;
    else if (t.type === 'depense') depenses += t.amount;
    else if (t.type === 'epargne') epargne += t.amount;
  });
  const solde = revenus - depenses - epargne;
  soldeAffichage.textContent = `${solde.toFixed(2)} €`;
  revenusAffichage.textContent = `${revenus.toFixed(2)} €`;
  depensesAffichage.textContent = `${depenses.toFixed(2)} €`;
  epargneAffichage.textContent = `${epargne.toFixed(2)} €`;
}

// Fonction pour récupérer les transactions de l'utilisateur connecté (ou toutes si pas de gestion utilisateur)
function recupererTransactionsUtilisateur() {
  if (courrielActuel) {
    return transactions.filter(t => t.email === courrielActuel);
  }
  return transactions;
}

// Fonction pour afficher les transactions filtrées
function filtrerEtAfficherTransactions() {
  const periode = periodeSelect.value;
  const dateFiltre = dateFiltreInput.value;
  let transactionsUtilisateur = recupererTransactionsUtilisateur();

  let filtrees = [];
  if (periode === "jour" && dateFiltre) {
    filtrees = transactionsUtilisateur.filter(t => t.date === dateFiltre);
  } else if (periode === "semaine" && dateFiltre) {
    const d = new Date(dateFiltre);
    const debutSemaine = new Date(d);
    debutSemaine.setDate(d.getDate() - d.getDay());
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(finSemaine.getDate() + 6);
    filtrees = transactionsUtilisateur.filter(t => {
      const td = new Date(t.date);
      return td >= debutSemaine && td <= finSemaine;
    });
  } else if (periode === "mois" && dateFiltre) {
    const [annee, mois] = dateFiltre.split('-');
    filtrees = transactionsUtilisateur.filter(t => t.date.startsWith(`${annee}-${mois}`));
  } else if (periode === "annee" && dateFiltre) {
    const annee = dateFiltre.split('-')[0];
    filtrees = transactionsUtilisateur.filter(t => t.date.startsWith(annee));
  } else {
    filtrees = transactionsUtilisateur;
  }

  // Calcul des totaux
  let totalRevenu = 0, totalDepense = 0, totalEpargne = 0;
  filtrees.forEach(t => {
    if (t.type === "revenu") totalRevenu += t.amount;
    if (t.type === "depense") totalDepense += t.amount;
    if (t.type === "epargne") totalEpargne += t.amount;
  });

  totauxDiv.innerHTML = `
    Total revenus : <span style="color:green">${totalRevenu.toFixed(2)} €</span> &nbsp;|&nbsp;
    Total dépenses : <span style="color:red">${totalDepense.toFixed(2)} €</span> &nbsp;|&nbsp;
    Total épargne : <span style="color:blue">${totalEpargne.toFixed(2)} €</span>
  `;

  // Affiche la liste filtrée
  listeTransactions.innerHTML = "";
  if (filtrees.length === 0) {
    listeTransactions.innerHTML = "<li>Aucune transaction pour cette période.</li>";
  } else {
    filtrees.slice().reverse().forEach((t, idx) => {
      let icone = '💸', signe = '-';
      if (t.type === 'revenu') { icone = '💶'; signe = '+'; }
      else if (t.type === 'epargne') { icone = '🏦'; signe = '-'; }
      listeTransactions.innerHTML += `
        <li class="${t.type}">
          <span>${icone} <strong>${t.description}</strong> <small>(${t.date})</small></span>
          <span>${signe}${t.amount.toFixed(2)} €</span>
        </li>
      `;
    });
  }
}

// Gestion de la suppression
// (À adapter si vous ajoutez un bouton de suppression dans la liste)
listeTransactions.addEventListener('click', function(e) {
  if (e.target.classList.contains('bouton-supprimer')) {
    const index = parseInt(e.target.getAttribute('data-index'));
    transactions.splice(index, 1);
    sauvegarderTransactions();
    mettreAJourTableauBord();
    filtrerEtAfficherTransactions();
  }
});

// Gestion de l'ajout de transaction
formulaireTransaction.addEventListener('submit', function(e) {
  e.preventDefault();
  const description = descriptionInput.value.trim();
  const montant = parseFloat(montantInput.value);
  const type = typeInput.value;
  const date = formaterDate(new Date());
  const email = courrielActuel || null;

  if (!description || isNaN(montant) || montant <= 0) {
    alert('Merci de saisir une description et un montant positif.');
    return;
  }

  // Ajout de la transaction avec date et email (si gestion utilisateur)
  transactions.push({ description, amount: montant, type, date, email });
  sauvegarderTransactions();
  mettreAJourTableauBord();
  filtrerEtAfficherTransactions();
  formulaireTransaction.reset();
});

// Remise à zéro
document.getElementById('reinitialiser-btn').addEventListener('click', function() {
  if (confirm('Voulez-vous vraiment remettre à zéro toutes les transactions ?')) {
    localStorage.removeItem('transactions');
    transactions = [];
    mettreAJourTableauBord();
    filtrerEtAfficherTransactions();
  }
});

// Gestion des filtres
periodeSelect.addEventListener('change', filtrerEtAfficherTransactions);
dateFiltreInput.addEventListener('change', filtrerEtAfficherTransactions);

// Initialisation à l'ouverture de la page
document.addEventListener('DOMContentLoaded', function() {
  dateFiltreInput.value = formaterDate(new Date());
  mettreAJourTableauBord();
  filtrerEtAfficherTransactions();
});