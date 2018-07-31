let restaurant;
var newMap;
const sendReviewWorker = new Worker('js/review-worker.js');

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoicnVzcG9zZXZraW4iLCJhIjoiY2pqcDhzcGxvNzd1bDN3czI4dmIycDN6dSJ9.yIAYwbhQKhXJYlIGXBQNTw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });

    DBHelper.fetchRestaurantReviewsById(id, (error, reviews) => {
      self.restaurant.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
    })
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant image`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const favouriteButton = document.getElementById('favourite');
  favouriteButton.setAttribute("aria-pressed", restaurant.is_favorite);
  favouriteButton.innerText = restaurant.is_favorite === 'true' ? 'Remove from favourite' : 'Add to favourite';

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.tabIndex = '0';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('h4');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const dateString = new Date(review.createdAt).toLocaleString();
  date.innerHTML = dateString;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);
  li.tabIndex = '0';

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.innerHTML = restaurant.name;
  link.href = DBHelper.urlForRestaurant(restaurant);
  link.setAttribute('aria-current', 'page');
  li.appendChild(link);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

toggleFavourite = (event) => {
  let element = event.target;
  const isPressed = !(element.getAttribute('aria-pressed') === 'true');
  event.target.innerText = isPressed ? 'Remove from favourite' : 'Add to favourite';

  DBHelper.toggleRestaurantFavoriteState(self.restaurant.id, isPressed)
    .then((restaurant) => {
      element.setAttribute('aria-pressed', isPressed);
    });
};

sendReview = (form) => {
  const data = {
    'restaurant_id': self.restaurant.id,
    'name': form['review-author'].value,
    'rating': form['review-rating'].value,
    'comments': form['review-comments'].value
  };
  form.submitReview.disabled = true;

  const addReview = (review) => {
      const container = document.getElementById('reviews-container');
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(review));
      container.appendChild(ul);
  };

  const resetForm = () => {
    form.reset();
    form.submitReview.disabled = false;
  };
 

  DBHelper.sendRestaurantReview(data)
    .then(review => {
      addReviewAndResetForm(review);
    })
    .catch(error => {
      alert("Server isn't responding, comment will be sent later");
      sendReviewWorker.onmessage = (message) => {
        addReview(message.data);
        resetForm();
        alert('Your message sent successfully');
      };
      sendReviewWorker.postMessage(data);
    })
};
