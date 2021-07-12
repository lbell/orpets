const storageHours = 48;
var processedNodes = [];
const listings = document.getElementsByClassName("listing");

clearLocalStorage();
window.onload = doOnScroll;
window.onscroll = doOnScroll;

/**
 * Fires on scroll
 */
async function doOnScroll() {
  for (var i = listings.length - 1; i >= 0; i--) {
    // for (var i = 1; i >= 0; i--) {
    var listing = listings[i];

    if (processedNodes.includes(listing) === false) {
      if (isScrolledIntoView(listing) === true) {
        processedNodes.push(listing);

        let listUrl = getLink(listing);

        let petText = await getPetText(listUrl);

        appendPetText(listing, petText);
      }
    }
  }
}

/**
 * Determines whether given element is visible in the viewscreen
 *
 * @param {element} el DOM Element
 * @returns bool
 */
function isScrolledIntoView(el) {
  let elTop = el.getBoundingClientRect().top;
  let elBottom = el.getBoundingClientRect().bottom;

  let isVisible = elTop >= 0 && elBottom <= window.innerHeight;

  return isVisible;
}

/**
 * Pauses code execution for desired amount.
 *
 * @param {int} milliseconds Time to wait
 * @returns promise
 */
function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Get the link from listing element
 *
 * @param {html} listing
 * @returns string
 */
function getLink(listing) {
  const listingLink = listing.getElementsByClassName("listing__link");
  const href = listingLink[0].href;
  const baseURL = href.substring(0, href.indexOf("?"));
  return baseURL;
}

/**
 * Get the Pet Text for a given url
 * Checks local storage first, and if not found, fetches the text from the given
 * URL and stores it for the future.
 *
 * @param {string} url
 * @returns string
 */
async function getPetText(url) {
  let petText = getWithExpiry(url);

  if (petText !== null) {
    return petText;
  } else {
    let expires = storageHours * 60 * 60 * 1000;

    petText = await scrapePetText(url);

    setWithExpiry(url, petText, expires);

    return petText;
  }
}

/**
 * Sets a localstorage item with expiration date
 *
 * @param {string} key Key name
 * @param {string} value Value content
 * @param {int} exp Expiration time (in milliseconds)
 */
function setWithExpiry(key, value, exp) {
  const now = new Date().getTime();

  const item = {
    origin: "orpets",
    value: value,
    expiry: now + exp,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Get the Pet Text from local storage and check whether it has expired. Deletes
 * the key/value if expired and returns null instead.
 *
 * @param {string} key Key to search for
 * @returns Value or Null
 */
function getWithExpiry(key) {
  const value = localStorage.getItem(key);

  if (!value) {
    return null;
  }

  const item = JSON.parse(value);
  const now = new Date().getTime();

  if (now > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

/**
 *
 * @param {string} url URL of hotel general info to scrape
 * @returns {string} Pet text in <li> form
 */
async function scrapePetText(url) {
  console.log("Scraping"); // DEBUG

  // Limit the rate of hits to be polite.
  await sleep(Math.random() * 3000 + 1000); // wait 1 to 3 seconds

  let response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  var parsedResponse = new window.DOMParser().parseFromString(await response.text(), "text/html");

  var petText = parsedResponse.querySelector("[itemprop=petsAllowed]").innerHTML;

  return petText;
}

/**
 *
 * @param {element} listing HTML Element
 * @param {string} petText <li> listings of pet text info
 */
function appendPetText(listing, petText) {
  const petContent = document.createElement("ul");
  petContent.innerHTML = petText;
  listing.appendChild(petContent);
}

/**
 * Houseclaning function to clear all Orpets data that is expired on each load
 */
function clearLocalStorage() {
  const now = new Date().getTime();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    let item;
    try {
      item = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      item = {};
    }

    if (item.origin === "orpets" && item.exipiry < now) {
      localStorage.removeItem(key);
    }

    // Nuclear Option
    // if (item.origin === "orpets") {
    //   localStorage.removeItem(key);
    // }
  }
}
