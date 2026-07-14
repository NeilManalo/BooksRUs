/* ================================================================
   BOOKS R' US — MAIN JAVASCRIPT
   Shared functions, Featured Books, Shop, Product Details, and Cart
   ================================================================ */

const CART_STORAGE_KEY = "booksRUsCart";

let booksRequest = null;
let allShopBooks = [];
let activeShopCategory = "";


/* ================================================================
   PAGE INITIALIZATION
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  updateCopyrightYear();
  updateCartCount();
  setUpMobileNavigation();
  setUpAddToCartButtons();

  initializeFeaturedBooks();
  initializeShopPage();
  initializeProductDetailsPage();
  initializeCartPage();
  initializeCheckoutPage();
});


/* ================================================================
   SHARED WEBSITE FUNCTIONS
   ================================================================ */

/**
 * Display the current year automatically in the footer.
 */
function updateCopyrightYear() {
  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/**
 * Read the cart and display its total quantity in the navigation badge.
 */
function updateCartCount() {
  const countElement = document.querySelector("#cart-count");
  const cartLink = document.querySelector(".cart-link");

  if (!countElement || !cartLink) {
    return;
  }

  const cart = getStoredCart();

  const itemCount = cart.reduce((total, cartItem) => {
    const quantity = Number(cartItem.quantity) || 0;
    return total + quantity;
  }, 0);

  countElement.textContent = itemCount;

  cartLink.setAttribute(
    "aria-label",
    `Shopping cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`
  );
}

/**
 * Close the Bootstrap mobile menu after a navigation link is selected.
 */
function setUpMobileNavigation() {
  const navbarElement = document.querySelector(
    "#main-navbar, #mainNavbar"
  );

  const navbarToggler = document.querySelector(".navbar-toggler");

  if (
    !navbarElement ||
    !navbarToggler ||
    typeof bootstrap === "undefined"
  ) {
    return;
  }

  const navigationLinks = navbarElement.querySelectorAll(".nav-link");

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const mobileMenuIsVisible =
        window.getComputedStyle(navbarToggler).display !== "none";

      if (
        mobileMenuIsVisible &&
        navbarElement.classList.contains("show")
      ) {
        const collapseMenu =
          bootstrap.Collapse.getInstance(navbarElement) ||
          new bootstrap.Collapse(navbarElement, {
            toggle: false
          });

        collapseMenu.hide();
      }
    });
  });
}

/**
 * Load books.json once and reuse the result on the current page.
 *
 * @returns {Promise<Array>} Complete book catalog.
 */
async function loadBooks() {
  if (!booksRequest) {
    booksRequest = fetch("data/books.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("The book catalog could not be loaded.");
        }

        return response.json();
      })
      .then((books) => {
        if (!Array.isArray(books)) {
          throw new Error("The book catalog has an invalid format.");
        }

        return books;
      })
      .catch((error) => {
        // Allow another request if the first request fails.
        booksRequest = null;
        throw error;
      });
  }

  return booksRequest;
}

/**
 * Format a number as Philippine Pesos.
 *
 * @param {number} price - Amount to format.
 * @returns {string} Formatted Philippine Peso amount.
 */
function formatPesoPrice(price) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(price) || 0);
}


/* ================================================================
   FEATURED BOOKS
   ================================================================ */

/**
 * Load and display books marked as featured.
 */
async function initializeFeaturedBooks() {
  const featuredBooksContainer = document.querySelector(
    "#featured-books-container"
  );

  if (!featuredBooksContainer) {
    return;
  }

  try {
    const books = await loadBooks();

    const featuredBooks = books.filter(
      (book) => book.featured === true
    );

    displayFeaturedBooks(featuredBooks, featuredBooksContainer);
  } catch (error) {
    displayBookGridError(
      featuredBooksContainer,
      "Featured books could not be loaded. Please try again later."
    );

    console.error("Featured Books error:", error);
  }
}

/**
 * Display all featured book cards.
 */
function displayFeaturedBooks(books, container) {
  container.textContent = "";

  if (books.length === 0) {
    displayEmptyBookMessage(
      container,
      "No featured books are available right now."
    );

    return;
  }

  books.forEach((book) => {
    const bookCard = createBookCard(
      book,
      "col-12 col-sm-6 col-lg-3",
      "h3"
    );

    container.appendChild(bookCard);
  });
}


/* ================================================================
   SHOP PAGE
   ================================================================ */

/**
 * Load all books and prepare Shop search and filtering.
 */
async function initializeShopPage() {
  const booksContainer = document.querySelector(
    "#shop-books-container"
  );

  const searchInput = document.querySelector("#search-books");
  const ageFilter = document.querySelector("#age-filter");

  if (!booksContainer || !searchInput || !ageFilter) {
    return;
  }

  try {
    allShopBooks = await loadBooks();
    activeShopCategory = getShopCategoryFromUrl();

    filterShopBooks(booksContainer, searchInput, ageFilter);

    searchInput.addEventListener("input", () => {
      filterShopBooks(booksContainer, searchInput, ageFilter);
    });

    ageFilter.addEventListener("change", () => {
      filterShopBooks(booksContainer, searchInput, ageFilter);
    });
  } catch (error) {
    displayBookGridError(
      booksContainer,
      "The book catalog could not be loaded. Please try again later."
    );

    console.error("Shop page error:", error);
  }
}

/**
 * Read the optional category from the Shop page URL.
 *
 * @returns {string} Selected category or an empty string.
 */
function getShopCategoryFromUrl() {
  const urlParameters = new URLSearchParams(window.location.search);

  return urlParameters.get("category")?.trim() || "";
}

/**
 * Apply category, title, and age filters at the same time.
 */
function filterShopBooks(container, searchInput, ageFilter) {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedAge = ageFilter.value;
  const selectedCategory = activeShopCategory.toLowerCase();

  const filteredBooks = allShopBooks.filter((book) => {
    const bookTitle = String(book.title).toLowerCase();
    const bookCategory = String(book.category).toLowerCase();

    const matchesTitle = bookTitle.includes(searchTerm);

    const matchesAge =
      selectedAge === "all" ||
      book.ageGroup === selectedAge;

    const matchesCategory =
      selectedCategory === "" ||
      bookCategory === selectedCategory;

    return matchesTitle && matchesAge && matchesCategory;
  });

  displayShopBooks(filteredBooks, container);
}

/**
 * Display Shop book cards.
 */
function displayShopBooks(books, container) {
  container.textContent = "";

  if (books.length === 0) {
    displayEmptyBookMessage(
      container,
      "No books match your search. Try another title or age group."
    );

    return;
  }

  books.forEach((book) => {
    const bookCard = createBookCard(
      book,
      "col-12 col-sm-6 col-lg-4 col-xl-3",
      "h2"
    );

    container.appendChild(bookCard);
  });
}


/* ================================================================
   SHARED BOOK CARD
   Used by the Featured Books and Shop sections.
   ================================================================ */

/**
 * Create one responsive Bootstrap book card.
 *
 * @param {Object} book - Book information.
 * @param {string} columnClasses - Bootstrap grid classes.
 * @param {string} headingTag - Heading element used for the title.
 * @returns {HTMLElement} Completed Bootstrap column.
 */
function createBookCard(book, columnClasses, headingTag) {
  const column = document.createElement("div");
  column.className = columnClasses;

  const card = document.createElement("article");
  card.className = "card book-card h-100";

  const image = document.createElement("img");
  image.className = "card-img-top book-image";
  image.src = book.image;
  image.alt = `Cover of ${book.title}`;
  image.loading = "lazy";

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const title = document.createElement(headingTag);
  title.className = "card-title book-title";
  title.textContent = book.title;

  const author = document.createElement("p");
  author.className = "book-author";
  author.textContent = `by ${book.author}`;

  const price = document.createElement("p");
  price.className = "book-price";
  price.textContent = formatPesoPrice(book.price);

  const actions = document.createElement("div");
  actions.className = "book-actions";

  const viewDetailsButton = document.createElement("a");
  viewDetailsButton.className = "btn view-details-button";
  viewDetailsButton.href =
    `product.html?id=${encodeURIComponent(book.id)}`;
  viewDetailsButton.textContent = "View Details";

  viewDetailsButton.setAttribute(
    "aria-label",
    `View details for ${book.title}`
  );

  const addToCartButton = document.createElement("button");
  addToCartButton.className = "btn add-to-cart-button";
  addToCartButton.type = "button";
  addToCartButton.dataset.bookId = book.id;
  addToCartButton.textContent = "Add to Cart";

  addToCartButton.setAttribute(
    "aria-label",
    `Add ${book.title} to the shopping cart`
  );

  actions.append(viewDetailsButton, addToCartButton);
  cardBody.append(title, author, price, actions);
  card.append(image, cardBody);
  column.appendChild(card);

  return column;
}

/**
 * Show a message when a book grid has no matching books.
 */
function displayEmptyBookMessage(container, message) {
  const emptyMessage = document.createElement("p");

  emptyMessage.className =
    "col-12 text-center text-muted mb-0";

  emptyMessage.textContent = message;

  container.appendChild(emptyMessage);
}

/**
 * Show a Bootstrap warning when a book grid cannot be loaded.
 */
function displayBookGridError(container, message) {
  container.textContent = "";

  const errorColumn = document.createElement("div");
  errorColumn.className = "col-12";

  const errorMessage = document.createElement("div");
  errorMessage.className =
    "alert alert-warning text-center mb-0";

  errorMessage.setAttribute("role", "alert");
  errorMessage.textContent = message;

  errorColumn.appendChild(errorMessage);
  container.appendChild(errorColumn);
}


/* ================================================================
   PRODUCT DETAILS PAGE
   ================================================================ */

/**
 * Load one book using the ID provided in the page URL.
 */
async function initializeProductDetailsPage() {
  const detailsContainer = document.querySelector(
    "#product-details-container"
  );

  if (!detailsContainer) {
    return;
  }

  const urlParameters = new URLSearchParams(window.location.search);
  const selectedBookId = urlParameters.get("id")?.trim();

  if (!selectedBookId) {
    displayProductDetailsError(
      detailsContainer,
      "No book was selected. Please return to the shop and choose a book."
    );

    return;
  }

  try {
    const books = await loadBooks();

    const selectedBook = books.find(
      (book) => book.id === selectedBookId
    );

    if (!selectedBook) {
      displayProductDetailsError(
        detailsContainer,
        "We could not find that book. It may no longer be available."
      );

      return;
    }

    displayProductDetails(selectedBook, detailsContainer);

    document.title = `${selectedBook.title} | Books R' Us`;
  } catch (error) {
    displayProductDetailsError(
      detailsContainer,
      "Book details could not be loaded. Please try again later."
    );

    console.error("Product Details error:", error);
  }
}

/**
 * Create and display the selected book's information.
 */
function displayProductDetails(book, container) {
  container.textContent = "";

  const productCard = document.createElement("article");
  productCard.className =
    "card overflow-hidden border-0 rounded-4 shadow-sm";

  const productRow = document.createElement("div");
  productRow.className = "row g-0";

  const imageColumn = document.createElement("div");
  imageColumn.className =
    "col-12 col-md-5 col-lg-4 d-flex align-items-center bg-light p-4";

  const bookImage = document.createElement("img");
  bookImage.className =
    "img-fluid w-100 rounded-4 shadow-sm object-fit-contain";
  bookImage.src = book.image;
  bookImage.alt = `Cover of ${book.title}`;

  const detailsColumn = document.createElement("div");
  detailsColumn.className = "col-12 col-md-7 col-lg-8";

  const detailsBody = document.createElement("div");
  detailsBody.className = "card-body p-4 p-lg-5";

  const badges = document.createElement("div");
  badges.className = "d-flex flex-wrap gap-2 mb-3";

  const categoryBadge = document.createElement("span");
  categoryBadge.className =
    "badge rounded-pill text-bg-primary";
  categoryBadge.textContent = book.category;

  const ageBadge = document.createElement("span");
  ageBadge.className =
    "badge rounded-pill text-bg-warning";
  ageBadge.textContent = `Ages ${book.ageGroup}`;

  const title = document.createElement("h2");
  title.className = "display-6 fw-bold mb-2";
  title.textContent = book.title;

  const author = document.createElement("p");
  author.className = "fs-5 text-secondary mb-4";
  author.textContent = `by ${book.author}`;

  const description = document.createElement("p");
  description.className = "fs-5 mb-4";
  description.textContent = book.shortDescription;

  const informationList = document.createElement("dl");
  informationList.className = "row mb-4";

  informationList.append(
    createProductInformationItem(
      "Category",
      book.category
    ),
    createProductInformationItem(
      "Age Group",
      `Ages ${book.ageGroup}`
    ),
    createProductInformationItem(
      "Stock",
      `${book.stock} copies available`
    )
  );

  const price = document.createElement("p");
  price.className =
    "display-6 fw-bold text-primary mb-4";
  price.textContent = formatPesoPrice(book.price);

  const addToCartButton = document.createElement("button");
  addToCartButton.className =
    "btn btn-primary btn-lg rounded-pill px-4 add-to-cart-button";

  addToCartButton.type = "button";
  addToCartButton.dataset.bookId = book.id;

  addToCartButton.setAttribute(
    "aria-label",
    `Add ${book.title} to the shopping cart`
  );

  const cartIcon = document.createElement("i");
  cartIcon.className = "bi bi-cart-plus-fill me-2";
  cartIcon.setAttribute("aria-hidden", "true");

  addToCartButton.append(cartIcon, "Add to Cart");

  badges.append(categoryBadge, ageBadge);

  detailsBody.append(
    badges,
    title,
    author,
    description,
    informationList,
    price,
    addToCartButton
  );

  detailsColumn.appendChild(detailsBody);
  imageColumn.appendChild(bookImage);
  productRow.append(imageColumn, detailsColumn);
  productCard.appendChild(productRow);
  container.appendChild(productCard);
}

/**
 * Create one label-and-value pair for product information.
 */
function createProductInformationItem(label, value) {
  const item = document.createElement("div");
  item.className =
    "col-12 col-lg-4 mb-3 mb-lg-0";

  const term = document.createElement("dt");
  term.className = "fw-bold";
  term.textContent = label;

  const description = document.createElement("dd");
  description.className = "mb-0 text-secondary";
  description.textContent = value;

  item.append(term, description);

  return item;
}

/**
 * Show a message for missing or unavailable product details.
 */
function displayProductDetailsError(container, message) {
  container.textContent = "";

  const alert = document.createElement("div");
  alert.className =
    "alert alert-warning text-center py-4";

  alert.setAttribute("role", "alert");

  const heading = document.createElement("h2");
  heading.className = "h4";
  heading.textContent = "Book Not Available";

  const description = document.createElement("p");
  description.className = "mb-3";
  description.textContent = message;

  const shopLink = document.createElement("a");
  shopLink.className =
    "btn btn-primary rounded-pill";

  shopLink.href = "shop.html";
  shopLink.textContent = "Browse Books";

  alert.append(heading, description, shopLink);
  container.appendChild(alert);
}


/* ================================================================
   CART STORAGE
   ================================================================ */

/**
 * Safely read the current cart from localStorage.
 *
 * @returns {Array} Saved cart items.
 */
function getStoredCart() {
  try {
    const savedCart = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY)
    );

    return Array.isArray(savedCart) ? savedCart : [];
  } catch (error) {
    console.error("Cart storage error:", error);
    return [];
  }
}

/**
 * Save the cart and immediately update the navigation badge.
 *
 * @param {Array} cart - Updated cart items.
 */
function saveStoredCart(cart) {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(cart)
  );

  updateCartCount();
}


/* ================================================================
   ADD TO CART
   ================================================================ */

/**
 * Listen for Add to Cart clicks, including dynamically created buttons.
 */
function setUpAddToCartButtons() {
  document.addEventListener("click", async (event) => {
    const addToCartButton = event.target.closest(
      ".add-to-cart-button"
    );

    if (!addToCartButton) {
      return;
    }

    const bookId = addToCartButton.dataset.bookId;

    if (!bookId) {
      return;
    }

    await handleAddToCart(bookId, addToCartButton);
  });
}

/**
 * Add a book to localStorage or increase its existing quantity.
 */
async function handleAddToCart(bookId, button) {
  const originalButtonContent = button.innerHTML;

  button.disabled = true;
  button.textContent = "Adding...";

  try {
    const books = await loadBooks();

    const selectedBook = books.find(
      (book) => book.id === bookId
    );

    if (!selectedBook) {
      throw new Error("The selected book could not be found.");
    }

    const cart = getStoredCart();

    const existingBookIndex = cart.findIndex(
      (cartItem) => cartItem.id === selectedBook.id
    );

    if (existingBookIndex >= 0) {
      const currentQuantity =
        Number(cart[existingBookIndex].quantity) || 0;

      cart[existingBookIndex] = {
        ...cart[existingBookIndex],
        ...selectedBook,
        quantity: currentQuantity + 1
      };
    } else {
      cart.push({
        ...selectedBook,
        quantity: 1
      });
    }

    // Save once. This function also updates the cart badge.
    saveStoredCart(cart);

    button.textContent = "Added!";
  } catch (error) {
    button.textContent = "Try Again";
    console.error("Add to Cart error:", error);
  }

  window.setTimeout(() => {
    button.innerHTML = originalButtonContent;
    button.disabled = false;
  }, 800);
}


/* ================================================================
   SHOPPING CART PAGE
   ================================================================ */

/**
 * Display the cart and prepare quantity and removal controls.
 */
function initializeCartPage() {
  const cartItemsContainer = document.querySelector(
    "#cart-items-container"
  );

  if (!cartItemsContainer) {
    return;
  }

  renderCartPage();

  cartItemsContainer.addEventListener("click", (event) => {
    const cartButton = event.target.closest(
      "[data-cart-action]"
    );

    if (!cartButton) {
      return;
    }

    const bookId = cartButton.dataset.bookId;
    const action = cartButton.dataset.cartAction;

    if (!bookId || !action) {
      return;
    }

    updateCartItem(bookId, action);
  });
}

/**
 * Display all cart items and update the order totals.
 */
function renderCartPage() {
  const cartItemsContainer = document.querySelector(
    "#cart-items-container"
  );

  const cartSummary = document.querySelector(
    "#cart-summary"
  );

  const totalItemsElement = document.querySelector(
    "#cart-total-items"
  );

  const totalPriceElement = document.querySelector(
    "#cart-total-price"
  );

  if (
    !cartItemsContainer ||
    !cartSummary ||
    !totalItemsElement ||
    !totalPriceElement
  ) {
    return;
  }

  const cart = getStoredCart();

  cartItemsContainer.textContent = "";

  if (cart.length === 0) {
    cartSummary.classList.add("d-none");
    cartItemsContainer.appendChild(
      createEmptyCartMessage()
    );

    return;
  }

  cartSummary.classList.remove("d-none");

  cart.forEach((cartItem) => {
    cartItemsContainer.appendChild(
      createCartItemCard(cartItem)
    );
  });

  const totalItems = cart.reduce(
    (total, cartItem) => {
      return total + (Number(cartItem.quantity) || 0);
    },
    0
  );

  const totalPrice = cart.reduce(
    (total, cartItem) => {
      const price = Number(cartItem.price) || 0;
      const quantity = Number(cartItem.quantity) || 0;

      return total + price * quantity;
    },
    0
  );

  totalItemsElement.textContent = totalItems;
  totalPriceElement.textContent =
    formatPesoPrice(totalPrice);
}

/**
 * Create one saved cart item card.
 */
function createCartItemCard(cartItem) {
  const quantity = Math.max(
    1,
    Number(cartItem.quantity) || 1
  );

  const price = Number(cartItem.price) || 0;
  const stock = Number(cartItem.stock) || 0;
  const subtotal = price * quantity;

  const card = document.createElement("article");
  card.className =
    "card border-0 rounded-4 shadow-sm mb-3 overflow-hidden";

  const row = document.createElement("div");
  row.className = "row g-0 align-items-center";

  const imageColumn = document.createElement("div");
  imageColumn.className = "col-4 col-sm-3 p-3";

  const image = document.createElement("img");
  image.className =
    "img-fluid rounded-3 w-100 object-fit-cover";

  image.src = cartItem.image;
  image.alt = `Cover of ${cartItem.title}`;

  const detailsColumn = document.createElement("div");
  detailsColumn.className = "col-8 col-sm-9";

  const cardBody = document.createElement("div");
  cardBody.className = "card-body p-3 p-md-4";

  const contentRow = document.createElement("div");
  contentRow.className =
    "row g-3 align-items-center";

  const bookInformation = document.createElement("div");
  bookInformation.className = "col-12 col-md-5";

  const title = document.createElement("h2");
  title.className = "h5 fw-bold mb-1";
  title.textContent = cartItem.title;

  const author = document.createElement("p");
  author.className = "text-secondary mb-1";
  author.textContent = `by ${cartItem.author}`;

  const priceElement = document.createElement("p");
  priceElement.className =
    "fw-bold text-primary mb-0";

  priceElement.textContent = formatPesoPrice(price);

  const quantityColumn = document.createElement("div");
  quantityColumn.className = "col-7 col-md-4";

  const quantityLabel = document.createElement("p");
  quantityLabel.className = "small fw-bold mb-2";
  quantityLabel.textContent = "Quantity";

  const quantityGroup = document.createElement("div");
  quantityGroup.className =
    "input-group input-group-sm";

  const decreaseButton = createCartControlButton(
    "decrease",
    cartItem,
    "Decrease quantity",
    "bi-dash-lg"
  );

  decreaseButton.disabled = quantity <= 1;

  const quantityDisplay = document.createElement("span");
  quantityDisplay.className =
    "form-control text-center bg-white fw-bold";

  quantityDisplay.textContent = quantity;

  quantityDisplay.setAttribute(
    "aria-label",
    `Quantity: ${quantity}`
  );

  const increaseButton = createCartControlButton(
    "increase",
    cartItem,
    "Increase quantity",
    "bi-plus-lg"
  );

  if (stock > 0 && quantity >= stock) {
    increaseButton.disabled = true;
    increaseButton.title =
      "Maximum available stock reached";
  }

  quantityGroup.append(
    decreaseButton,
    quantityDisplay,
    increaseButton
  );

  quantityColumn.append(
    quantityLabel,
    quantityGroup
  );

  const subtotalColumn = document.createElement("div");
  subtotalColumn.className =
    "col-5 col-md-3 text-end";

  const subtotalLabel = document.createElement("p");
  subtotalLabel.className = "small fw-bold mb-1";
  subtotalLabel.textContent = "Subtotal";

  const subtotalElement = document.createElement("p");
  subtotalElement.className = "fw-bold mb-2";
  subtotalElement.textContent =
    formatPesoPrice(subtotal);

  const removeButton = document.createElement("button");
  removeButton.className =
    "btn btn-sm btn-outline-danger rounded-pill";

  removeButton.type = "button";
  removeButton.dataset.cartAction = "remove";
  removeButton.dataset.bookId = cartItem.id;

  removeButton.setAttribute(
    "aria-label",
    `Remove ${cartItem.title} from cart`
  );

  const removeIcon = document.createElement("i");
  removeIcon.className = "bi bi-trash3 me-1";
  removeIcon.setAttribute("aria-hidden", "true");

  removeButton.append(removeIcon, "Remove");

  subtotalColumn.append(
    subtotalLabel,
    subtotalElement,
    removeButton
  );

  bookInformation.append(
    title,
    author,
    priceElement
  );

  contentRow.append(
    bookInformation,
    quantityColumn,
    subtotalColumn
  );

  cardBody.appendChild(contentRow);
  detailsColumn.appendChild(cardBody);
  imageColumn.appendChild(image);
  row.append(imageColumn, detailsColumn);
  card.appendChild(row);

  return card;
}

/**
 * Create an increase or decrease quantity button.
 */
function createCartControlButton(
  action,
  cartItem,
  label,
  iconClass
) {
  const button = document.createElement("button");
  button.className = "btn btn-outline-primary";
  button.type = "button";
  button.dataset.cartAction = action;
  button.dataset.bookId = cartItem.id;

  button.setAttribute(
    "aria-label",
    `${label} for ${cartItem.title}`
  );

  const icon = document.createElement("i");
  icon.className = `bi ${iconClass}`;
  icon.setAttribute("aria-hidden", "true");

  button.appendChild(icon);

  return button;
}

/**
 * Increase, decrease, or remove one cart item.
 */
function updateCartItem(bookId, action) {
  const cart = getStoredCart();

  const cartItemIndex = cart.findIndex(
    (cartItem) => cartItem.id === bookId
  );

  if (cartItemIndex < 0) {
    return;
  }

  const cartItem = cart[cartItemIndex];

  const currentQuantity = Math.max(
    1,
    Number(cartItem.quantity) || 1
  );

  const stock = Number(cartItem.stock) || 0;

  if (action === "increase") {
    if (stock > 0 && currentQuantity >= stock) {
      return;
    }

    cartItem.quantity = currentQuantity + 1;
  } else if (action === "decrease") {
    if (currentQuantity <= 1) {
      return;
    }

    cartItem.quantity = currentQuantity - 1;
  } else if (action === "remove") {
    cart.splice(cartItemIndex, 1);
  } else {
    return;
  }

  saveStoredCart(cart);
  renderCartPage();
}

/**
 * Create the empty-cart message.
 */
function createEmptyCartMessage() {
  const emptyCard = document.createElement("div");
  emptyCard.className =
    "card border-0 rounded-4 shadow-sm text-center";

  const emptyBody = document.createElement("div");
  emptyBody.className = "card-body p-5";

  const icon = document.createElement("i");
  icon.className =
    "bi bi-cart-x display-3 text-primary";

  icon.setAttribute("aria-hidden", "true");

  const heading = document.createElement("h2");
  heading.className = "h3 fw-bold mt-3";
  heading.textContent = "Your cart is empty";

  const message = document.createElement("p");
  message.className = "text-secondary";
  message.textContent =
    "Discover a wonderful book and add it to your cart to get started.";

  const shopLink = document.createElement("a");
  shopLink.className =
    "btn btn-primary rounded-pill px-4";

  shopLink.href = "shop.html";
  shopLink.textContent = "Browse Books";

  emptyBody.append(
    icon,
    heading,
    message,
    shopLink
  );

  emptyCard.appendChild(emptyBody);

  return emptyCard;
}

/* ================================================================
   CHECKOUT PAGE
   Displays the final order and handles simulated order submission.
   ================================================================ */

/*document.addEventListener("DOMContentLoaded", () => {
  initializeCheckoutPage();
});*/

/**
 * Set up the Checkout page only when its form is present.
 */
function initializeCheckoutPage() {
  const checkoutForm = document.querySelector("#checkout-form");

  if (!checkoutForm) {
    return;
  }

  renderCheckoutOrder();

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const cart = getStoredCart();

    if (cart.length === 0) {
      displayCheckoutMessage(
        "Your cart is empty. Please add a book before checking out.",
        "warning"
      );

      renderCheckoutOrder();
      return;
    }

    if (!checkoutForm.checkValidity()) {
      checkoutForm.classList.add("was-validated");
      return;
    }

    const customerName = document
      .querySelector("#checkout-full-name")
      .value.trim();

    // Clear the cart and update the navigation badge.
    saveStoredCart([]);

    checkoutForm.reset();
    checkoutForm.classList.remove("was-validated");

    renderCheckoutOrder();

    displayCheckoutMessage(
      `Thank you, ${customerName}! Your order has been placed successfully.`,
      "success"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/**
 * Display the saved cart items and Checkout totals.
 */
function renderCheckoutOrder() {
  const orderItemsContainer = document.querySelector(
    "#checkout-order-items"
  );

  const totalItemsElement = document.querySelector(
    "#checkout-total-items"
  );

  const totalPriceElement = document.querySelector(
    "#checkout-total-price"
  );

  const placeOrderButton = document.querySelector(
    "#place-order-button"
  );

  if (
    !orderItemsContainer ||
    !totalItemsElement ||
    !totalPriceElement ||
    !placeOrderButton
  ) {
    return;
  }

  const cart = getStoredCart();

  orderItemsContainer.textContent = "";

  if (cart.length === 0) {
    const emptyMessage = document.createElement("div");

    emptyMessage.className = "alert alert-info mb-0";
    emptyMessage.setAttribute("role", "status");
    emptyMessage.textContent =
      "Your cart is empty. Add books before placing an order.";

    orderItemsContainer.appendChild(emptyMessage);

    totalItemsElement.textContent = "0";
    totalPriceElement.textContent = formatPesoPrice(0);
    placeOrderButton.disabled = true;

    return;
  }

  const orderList = document.createElement("div");

  orderList.className =
    "list-group list-group-flush mb-3";

  cart.forEach((cartItem) => {
    const orderItem = createCheckoutOrderItem(cartItem);
    orderList.appendChild(orderItem);
  });

  orderItemsContainer.appendChild(orderList);

  const totalItems = cart.reduce((total, cartItem) => {
    const quantity = Number(cartItem.quantity) || 0;

    return total + quantity;
  }, 0);

  const totalPrice = cart.reduce((total, cartItem) => {
    const price = Number(cartItem.price) || 0;
    const quantity = Number(cartItem.quantity) || 0;

    return total + price * quantity;
  }, 0);

  totalItemsElement.textContent = totalItems;

  totalPriceElement.textContent =
    formatPesoPrice(totalPrice);

  placeOrderButton.disabled = false;
}

/**
 * Create one line in the Checkout order summary.
 *
 * @param {Object} cartItem - One saved cart item.
 * @returns {HTMLElement} Completed order-summary item.
 */
function createCheckoutOrderItem(cartItem) {
  const quantity = Math.max(
    1,
    Number(cartItem.quantity) || 1
  );

  const price = Number(cartItem.price) || 0;
  const subtotal = price * quantity;

  const item = document.createElement("div");

  item.className =
    "list-group-item px-0 py-3";

  const topRow = document.createElement("div");

  topRow.className =
    "d-flex justify-content-between gap-3";

  const title = document.createElement("h3");

  title.className = "h6 fw-bold mb-1";
  title.textContent = cartItem.title;

  const subtotalElement = document.createElement("strong");

  subtotalElement.textContent =
    formatPesoPrice(subtotal);

  const details = document.createElement("p");

  details.className =
    "small text-secondary mb-0";

  details.textContent =
    `${quantity} × ${formatPesoPrice(price)}`;

  topRow.append(title, subtotalElement);
  item.append(topRow, details);

  return item;
}

/**
 * Display a Checkout success or warning message.
 *
 * @param {string} message - Message displayed to the customer.
 * @param {string} type - Bootstrap alert type.
 */
function displayCheckoutMessage(message, type) {
  const messageContainer = document.querySelector(
    "#checkout-message"
  );

  if (!messageContainer) {
    return;
  }

  messageContainer.textContent = "";

  const alert = document.createElement("div");

  alert.className =
    `alert alert-${type} text-center rounded-3`;

  alert.setAttribute("role", "alert");
  alert.textContent = message;

  messageContainer.appendChild(alert);
}