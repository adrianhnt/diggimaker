// Sets up the game.
document.addEventListener('DOMContentLoaded', function () {
    // Validierung vor dem Laden
    upgrades.forEach(function(upgrade) {
        if (!upgrade.key || !upgrade.type || typeof upgrade.price !== 'number') {
            console.error('Invalid upgrade (missing key, type, or price):', upgrade);
        }
        if (upgrade.type === 'perClickUpgrade' && (typeof upgrade.addsPerClick !== 'number' || isNaN(upgrade.addsPerClick))) {
            console.error('perClickUpgrade missing or invalid addsPerClick:', upgrade);
        }
        if (upgrade.type === 'perSecondUpgrade' && (typeof upgrade.addsPerSecond !== 'number' || isNaN(upgrade.addsPerSecond))) {
            console.error('perSecondUpgrade missing or invalid addsPerSecond:', upgrade);
        }
    });

    loadState();
    updateBalance();
    renderShop();
    renderInventory();
    updatePerClick();
    updatePerSecond();
});

// Global variables
var balance = 0;
var perClick = 1;
var perSecond = 0;
var priceMultiplier = 1.2;
const currencyName = 'Diggis';

const upgradeTypes = [
    'perClickUpgrade',
    'perSecondUpgrade'
];

const upgrades = [
    {
        key: 'bronzeClicker',
    type: upgradeTypes[0], // 'perClick'
    price: 10,
    addsPerClick: 0.10,
    title: 'Bronze Clicker',
    description: 'Each bronze clicker earns 0.10 ' + currencyName + ' per Click'
  },
  {
    key: 'silverClicker',
    type: upgradeTypes[0], // 'perClick'
    price: 50,
    addsPerClick: 0.50,
    title: 'Silver Clicker',
    description: 'Each silver clicker earns 0.50 ' + currencyName + ' per Click'
  },
  {
    key: 'goldenClicker',
    type: upgradeTypes[0], // 'perClick'
    price: 250,
    addsPerClick: 5.00,
    title: 'Golden Clicker',
    description: 'Each golden clicker earns 5.00 ' + currencyName + ' per Click'
  },
  {
    key: 'susanneDaubner',
    type: upgradeTypes[1], // 'perSecond'
    price: 1000,
    addsPerSecond: 1,
    title: 'Susanne Daubner',
    description: 'Each Susanne Daubner earns 1 ' + currencyName + ' per Second'
  },
  {
    key: 'teenager',
    type: upgradeTypes[1], // 'perSecond'
    price: 1000000,
    addsPerSecond: 10,
    title: 'Teenager',
    description: 'Each Teenager earns 10 ' + currencyName + ' per Second'
  }
];

// Creates an object with the upgrades bought so far.
var inventory = Object.fromEntries(upgrades.map(i => [i.key, 0]));

// Adds money to the balance in realtation to perClick value.
function moneyByClick() {
    balance += perClick;
    updateBalance();
    console.log('Click registered. Added ' + perClick.toFixed(2) + ' ' + currencyName + ' to your wallet.');
}

// Updates balance value in the UI.
function updateBalance() {
    var wallet = document.getElementById('wallet');
    if (wallet) {
        wallet.textContent = 'Your Wallet: ' + balance.toFixed(2) + ' ' + currencyName;
    }
    safeBalance();
}

// Updates perClick value in the UI.
function updatePerClick() {
    perClick = calculateValue('perClickUpgrade');
    if (isNaN(perClick)) {
        perClick = 1;
        console.log('perClick was NaN, reset to 1');
    }
    var perClickEl = document.getElementById('per-click');
    if (perClickEl) {
        perClickEl.textContent = currencyName + ' per Click: ' + perClick.toFixed(2);
    }
}

// Updates perSecond value in the UI.
function updatePerSecond() {
    perSecond = calculateValue('perSecondUpgrade');
    if (isNaN(perSecond)) {
        perSecond = 0;
        console.log('perSecond was NaN, reset to 0');
    }
    var perSecondEl = document.getElementById('per-second');
    if (perSecondEl) {
        perSecondEl.textContent = currencyName + ' per Second: ' + perSecond.toFixed(2);
    }
}

// Renders shop section in the UI. Adds one card for each upgrade.
function renderShop() {
    var container = document.querySelector('.shop-items');
    if (!container) return;

    container.innerHTML = '';

    upgrades.forEach(function (item) {
        var card = document.createElement('div');
        card.className = 'shop-item card';
        card.setAttribute('data-item-key', item.key);

        var h3 = document.createElement('h3');
        h3.textContent = item.title;

        var pDesc = document.createElement('p');
        pDesc.className = 'item-description';
        pDesc.textContent = item.description;

        var cardFooter = document.createElement('div');
        cardFooter.className = 'shop-item-footer';

        var button = document.createElement('button');
        button.textContent = 'Buy';
        button.onclick = function () {
            onBuyItem(item.key);
        }

        var pPrice = document.createElement('p');
        pPrice.className = 'item-price';
        pPrice.id = 'price-' + item.key; 
        var currentPrice = calculateUpgradePrice(item.key);
        pPrice.textContent = currentPrice + ' ' + currencyName;

        card.appendChild(h3);
        card.appendChild(pDesc);
        card.appendChild(cardFooter);
        cardFooter.appendChild(button)
        cardFooter.appendChild(pPrice);

        container.appendChild(card);
    });
}

// Handles the purchase of an item in case of successful authorization.
function onBuyItem(itemKey) {
  if (authorizePurchase(itemKey)) {
    inventory[itemKey] += 1;
    
    var boughtItem = upgrades.find(i => i.key === itemKey);
    if (boughtItem) {
      updateValue(boughtItem.type); // Generic for both types.
    }
    
    renderInventory();
    updateShopItemPrice(itemKey);
    safeInventory();
    console.log('Purchase authorized:', itemKey, 'Total:', inventory[itemKey], '. Inventory saved.');
  } else {
    console.log('Purchase not authorized: Not enough ' + currencyName);
  }
}

// Authorizes the purchase of an item. Checks if balance is enough to buy an certain item.
function authorizePurchase(itemKey) {
    var item = upgrades.find(function (i) {
        return i.key === itemKey;
    })
    if (!item) return false;

    var price = calculateUpgradePrice(itemKey);
    if (balance >= price) {
        balance -= price
        updateBalance();
        return true;
    }
    return false
}

// Renders the inventory in the UI.
function renderInventory() {
    var container = document.querySelector('.inventory-items');
    if (!container) return;

    container.innerHTML = '';

    var hasAny = false;

    upgrades.forEach(function (item) {
        var count = inventory[item.key] || 0;
        if (count > 0) {
            hasAny = true;
            var p = document.createElement('p');
            p.textContent = item.title + ': ' + count;
            container.appendChild(p);
        }
    });

    if (!hasAny) {
        var p = document.createElement('p');
        p.textContent = 'Currently there are no items in your inventory.';
        container.appendChild(p);
    }
}

// Saves the balance to the local storage.
function safeBalance() {
    localStorage.setItem('balance', balance)
}

// Saves the inventory to the local storage.
function safeInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

// Loads the balance and inventory from local storage.
function loadState() {
    var savedBalance = localStorage.getItem('balance');
    if (savedBalance !== null && !isNaN(parseFloat(savedBalance))) {
      balance = parseFloat(savedBalance);
      console.log('Loaded balance:', balance);
    } else {
      balance = 0;
      console.log('No valid balance found, reset to 0');
    }
    
    var savedInventory = localStorage.getItem('inventory');
    if (savedInventory !== null) {
      try {
        var parsedInventory = JSON.parse(savedInventory);
        if (parsedInventory && typeof parsedInventory === 'object') {
          inventory = parsedInventory;
          console.log('Loaded inventory:', inventory);
        } else {
          inventory = Object.fromEntries(upgrades.map(i => [i.key, 0]));
          console.log('Invalid inventory found, reset to empty');
        }
      } catch (e) {
        inventory = Object.fromEntries(upgrades.map(i => [i.key, 0]));
        console.log('Error parsing inventory, reset to empty');
      }
    } else {
      inventory = Object.fromEntries(upgrades.map(i => [i.key, 0]));
      console.log('No inventory found, reset to empty');
    }
  }

// Calculates the perClick value in relation to the inventorys items.
function calculateValue(type) {
    var total = type === 'perClickUpgrade' ? 1 : 0;
    upgrades.forEach(function (upgrade) {
        if (upgrade.type === type) {
            var count = inventory[upgrade.key] || 0;
            var value = type === 'perClickUpgrade' ? upgrade.addsPerClick : upgrade.addsPerSecond;
            if (typeof count === 'number' && !isNaN(count) && typeof value === 'number' && !isNaN(value)) {
                total += count * value;
            }
        }
    });
    return total;
}

// Calultes the perSecond value in relation to the inventorys items.
function calculatePerSecond() {
    var total = 0;
    upgrades.forEach(function (upgrade) {
        var count = inventory[upgrade.key] || 0;
        if (typeof count === 'number' && !isNaN(count)) {
            total += count * (upgrade.addsPerSecond || 0);
        }
    });
    return total;
}

// Calculates the price of an upgrade in relation to the number of bought upgrades so far.
function calculateUpgradePrice(itemKey) {
    var item = upgrades.find(function (i) { return i.key === itemKey; });
    if (!item) return 0;

    var basePrice = item.price;
    var boughtCount = inventory[item.key] || 0;

    var currentPrice = basePrice * Math.pow(priceMultiplier, boughtCount);
    return Math.round(currentPrice * 100) / 100;
}

// Validierung der Upgrade-Daten
upgrades.forEach(function(upgrade) {
    if (!upgrade.key || !upgrade.type || !upgrade.price) {
        console.error('Invalid upgrade:', upgrade);
    }
    if (upgrade.type === 'perClickUpgrade' && !upgrade.addsPerClick) {
        console.error('perClick upgrade missing addsPerClick:', upgrade);
    }
    if (upgrade.type === 'perSecondUpgrade' && !upgrade.addsPerSecond) {
        console.error('perSecond upgrade missing addsPerSecond:', upgrade);
    }
});

function updateShopItemPrice(itemKey) {
  var priceElement = document.getElementById('price-' + itemKey);
  if (priceElement) {
    var newPrice = calculateUpgradePrice(itemKey);
    priceElement.textContent = newPrice + ' ' + currencyName;
  }
}

function updateValue(type) {
  var value = calculateValue(type);
  var elementId = type === 'perClickUpgrade' ? 'per-click' : 'per-second';
  var defaultValue = type === 'perClickUpgrade' ? 1 : 0;
  
  if (isNaN(value)) {
    value = defaultValue;
    console.log(type + ' was NaN, reset to ' + defaultValue);
  }
  
  var element = document.getElementById(elementId);
  if (element) {
    element.textContent = currencyName + ' per ' + (type === 'perClickUpgrade' ? 'Click' : 'Second') + ': ' + value.toFixed(2);
  }
  
  // Setze globale Variable
  if (type === 'perClickUpgrade') perClick = value;
  else perSecond = value;
}// Test SFTP deployment - Sun Aug 10 18:32:53 CEST 2025
