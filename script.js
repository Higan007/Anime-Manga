// Anime and Manga starter catalogue

const starterTitles = [
  ["Tokyo Ghoul", "Anime"],
  ["BLAME!", "Manga"],
  ["Jujutsu Kaisen", "Anime"],
  ["Chainsaw Man", "Anime"],
  ["Berserk", "Manga"],
  ["One Piece", "Anime"],
  ["Demon Slayer", "Anime"],
  ["Akira", "Manga"],
  ["Death Note", "Anime"],
  ["Vagabond", "Manga"],
  ["Dorohedoro", "Anime"],
  ["Neon Genesis Evangelion", "Anime"],
  ["Black Clover", "Anime"],
  ["Naruto", "Anime"],
  ["Bleach", "Anime"],
  ["Hunter x Hunter", "Anime"],
  ["Attack on Titan", "Anime"],
  ["Vinland Saga", "Anime"],
  ["Frieren: Beyond Journey's End", "Anime"],
  ["Solo Leveling", "Anime"],
  ["One-Punch Man", "Manga"],
  ["Kingdom", "Manga"],
  ["20th Century Boys", "Manga"],
  ["Goodnight Punpun", "Manga"],
  ["The Promised Neverland", "Manga"],
  ["Blue Lock", "Manga"],
  ["Monster", "Manga"],
  ["Slam Dunk", "Manga"]
];


// HTML elements

const cardsElement = document.getElementById("cards");
const statusElement = document.getElementById("status");
const searchInput = document.getElementById("search-input");


// Variables

let items = [];
let activeFilter = "All";
let searchResults = null;

let saved = JSON.parse(
  localStorage.getItem("animeverse-saved") || "[]"
);

let searchController = null;
let searchTimer = null;


// Current year

document.getElementById("year").textContent =
  new Date().getFullYear();


// Convert API data into our format

function normalise(item, type) {

  const a = item.attributes || {};

  return {
    id: item.id,

    title:
      a.titles?.en ||
      a.canonicalTitle ||
      a.slug ||
      "Unknown title",

    type: type,

    year: a.startDate
      ? a.startDate.slice(0, 4)
      : "—",

    genre: type,

    description:
      a.synopsis ||
      "No description is available for this title yet.",

    image:
      a.posterImage?.large ||
      a.posterImage?.original ||
      a.posterImage?.medium ||
      "",

    url: `https://kitsu.io/${type.toLowerCase()}/${item.id}`
  };
}


// Get anime or manga from Kitsu API

async function fetchTitles(title, type) {

  const endpoint = type.toLowerCase();

  const url =
    `https://kitsu.io/api/edge/${endpoint}?filter[text]=${encodeURIComponent(title)}&page[limit]=10`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Catalogue request failed");
  }

  const data = await response.json();

  return (data.data || []).map(item =>
    normalise(item, type)
  );
}


// Find the correct title

function findExact(results, title, type) {

  const wanted = title
    .toLowerCase()
    .replace(/[!:'’]/g, "")
    .trim();

  return results.find(item =>
    item.type === type &&
    item.title.toLowerCase()
      .replace(/[!:'’]/g, "")
      .trim() === wanted
  ) || results.find(item => item.type === type);
}


// Load featured anime and manga posters when site opens

async function loadFeatured() {

  statusElement.textContent =
    "Loading anime and manga posters...";

  const groups = await Promise.allSettled(
    starterTitles.map(([title, type]) =>
      fetchTitles(title, type)
    )
  );

  items = starterTitles.map(([title, type], index) => {

    const result = groups[index];

    if (result.status === "fulfilled") {

      const exact = findExact(
        result.value,
        title,
        type
      );

      if (exact) {
        return exact;
      }
    }

    return {
      title,
      type,
      year: "—",
      genre: type,
      description: "Explore this title and discover its story.",
      image: "",
      url: ""
    };

  });

  statusElement.textContent = "";

  render();
}


// Filter titles

function visibleItems() {

  const source = searchResults || items;

  return source.filter(item => {

    const filterMatch =
      activeFilter === "All" ||

      (activeFilter === "Saved" &&
        saved.includes(item.title)) ||

      item.type === activeFilter ||

      (item.genre || "")
        .toLowerCase()
        .includes(activeFilter.toLowerCase());

    return filterMatch;

  });
}


// Display cards

function render() {

  const list = visibleItems();

  cardsElement.innerHTML = "";

  document.getElementById("result-count").textContent =
    list.length;

  document.getElementById("saved-count").textContent =
    saved.length;

  document.getElementById("empty-state")
    .classList.toggle("hidden", list.length !== 0);


  list.forEach(item => {

    const card = document.createElement("article");

    card.className = "tile";
    card.tabIndex = 0;

    card.setAttribute("role", "button");

    card.setAttribute(
      "aria-label",
      `View ${item.title} details`
    );


    // Poster

    const poster = document.createElement("div");

    poster.className = "poster";


    if (item.image) {

      const img = document.createElement("img");

      img.src = item.image;

      img.alt = `${item.title} poster`;

      img.loading = "lazy";

      img.onerror = () => img.remove();

      poster.appendChild(img);
    }


    // Anime or manga label

    const label = document.createElement("span");

    label.className = "poster-label";

    label.textContent = item.type.toUpperCase();


    // Title

    const title = document.createElement("h3");

    title.className = "poster-title";

    title.textContent = item.title;

    poster.append(label, title);


    // Information

    const info = document.createElement("div");

    info.className = "tile-info";


    const meta = document.createElement("div");

    meta.className = "tile-meta";


    const genre = document.createElement("strong");

    genre.textContent = item.genre || item.type;


    const year = document.createElement("span");

    year.textContent = item.year || "—";

    meta.append(genre, year);


    // Description

    const description = document.createElement("p");

    description.className = "tile-description";

    description.textContent =
      item.description.length > 125
        ? item.description.slice(0, 122) + "..."
        : item.description;


    // Bottom section

    const bottom = document.createElement("div");

    bottom.className = "tile-bottom";


    const typeTag = document.createElement("span");

    typeTag.className = "type-tag";

    typeTag.textContent = item.type;


    // Save button

    const saveButton = document.createElement("button");

    saveButton.className =
      "save-button" +
      (saved.includes(item.title) ? " saved" : "");

    saveButton.type = "button";

    saveButton.setAttribute(
      "aria-label",
      "Save " + item.title
    );

    saveButton.textContent =
      saved.includes(item.title) ? "♥" : "♡";


    saveButton.addEventListener("click", event => {

      event.stopPropagation();

      toggleSaved(item.title);

    });


    bottom.append(typeTag, saveButton);

    info.append(meta, description, bottom);

    card.append(poster, info);


    // Open details when clicking card

    card.addEventListener("click", () => {
      openDetails(item);
    });


    // Keyboard support

    card.addEventListener("keydown", event => {

      if (event.key === "Enter" || event.key === " ") {

        event.preventDefault();

        openDetails(item);
      }

    });


    cardsElement.appendChild(card);

  });


  // Update active filter button

  document.querySelectorAll("[data-filter]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.filter === activeFilter
      );

    });

}


// Save or remove favourite

function toggleSaved(title) {

  saved = saved.includes(title)
    ? saved.filter(item => item !== title)
    : [...saved, title];

  localStorage.setItem(
    "animeverse-saved",
    JSON.stringify(saved)
  );

  render();
}


// Search anime and manga

async function searchTitles(query) {

  if (searchController) {
    searchController.abort();
  }

  searchController = new AbortController();

  const controller = searchController;

  statusElement.textContent =
    "Searching anime and manga...";


  try {

    const [anime, manga] = await Promise.all([

      fetchTitles(query, "Anime"),

      fetchTitles(query, "Manga")

    ]);


    if (controller !== searchController) {
      return;
    }

    searchResults = [...anime, ...manga];


    statusElement.textContent = searchResults.length
      ? `Found ${searchResults.length} results for "${query}".`
      : "No results found. Try another title.";

  }

  catch (error) {

    if (error.name !== "AbortError") {

      searchResults = [];

      statusElement.textContent =
        "Could not load results. Please try again.";

    }

  }

  render();
}


// Search button

document.getElementById("search-form")
  .addEventListener("submit", event => {

    event.preventDefault();

    const query = searchInput.value.trim();

    clearTimeout(searchTimer);


    if (!query) {

      searchResults = null;

      statusElement.textContent = "";

      render();

      return;
    }

    searchTitles(query);

  });


// Search while typing

searchInput.addEventListener("input", () => {

  clearTimeout(searchTimer);

  const query = searchInput.value.trim();


  if (!query) {

    searchResults = null;

    statusElement.textContent = "";

    render();

    return;
  }


  if (query.length >= 2) {

    searchTimer = setTimeout(() => {

      searchTitles(query);

    }, 500);

  }

});


// Anime / Manga / Saved filters

document.querySelectorAll("[data-filter]")
  .forEach(button => {

    button.addEventListener("click", () => {

      activeFilter = button.dataset.filter;

      render();

    });

  });


// Clear filters

document.getElementById("clear-filters")
  .addEventListener("click", () => {

    searchInput.value = "";

    searchResults = null;

    activeFilter = "All";

    statusElement.textContent = "";

    render();

  });


// Collections filters

document.querySelectorAll("[data-genre]")
  .forEach(button => {

    button.addEventListener("click", () => {

      searchInput.value = "";

      searchResults = items.filter(item =>

        (item.genre || "")
          .toLowerCase()
          .includes(button.dataset.genre.toLowerCase()) ||

        (button.dataset.genre === "Action" &&
          /action|adventure/i.test(item.description))

      );

      activeFilter = "All";

      document.getElementById("discover")
        .scrollIntoView({ behavior: "smooth" });

      render();

    });

  });


// Details modal

const modal = document.getElementById("detail-modal");


function openDetails(item) {

  document.getElementById("detail-type").textContent =
    item.type;

  document.getElementById("detail-title").textContent =
    item.title;

  document.getElementById("detail-meta").textContent =
    `${item.genre || item.type} · ${item.year || "—"}`;

  document.getElementById("detail-description").textContent =
    item.description;


  const image = document.getElementById("detail-image");

  image.src = item.image || "";

  image.alt = `${item.title} cover`;

  image.style.visibility =
    item.image ? "visible" : "hidden";


  const link = document.getElementById("detail-link");

  link.href = item.url ||
    `https://kitsu.io/search?query=${encodeURIComponent(item.title)}`;


  modal.classList.remove("hidden");

  document.body.style.overflow = "hidden";

}


// Close modal

function closeDetails() {

  modal.classList.add("hidden");

  document.body.style.overflow = "";

}


document.getElementById("close-modal")
  .addEventListener("click", closeDetails);


modal.addEventListener("click", event => {

  if (event.target.dataset.close === "true") {
    closeDetails();
  }

});


// Close with Escape key

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {
    closeDetails();
  }

});


// Start website

loadFeatured().catch(error => {

  console.error(error);

  statusElement.textContent =
    "Could not load featured posters. Check your internet connection.";

  items = starterTitles.map(([title, type]) => ({

    title,
    type,
    year: "—",
    genre: type,
    description: "Explore this title and discover its story.",
    image: "",
    url: ""

  }));

  render();

});