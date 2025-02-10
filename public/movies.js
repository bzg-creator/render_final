async function searchMovies() {
    const query = document.getElementById('movieInput').value;
    const container = document.getElementById('moviesContainer');
    
    if (!query) {
      container.innerHTML = '<p>Please enter a movie title</p>';
      return;
    }
  
    try {
      container.innerHTML = '<p>Loading...</p>';
      const response = await fetch(`/api/movies?title=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        container.innerHTML = '<p>No movies found</p>';
        return;
      }
  
      const moviesWithImages = data.results.filter(movie => 
        movie.titleText && movie.primaryImage?.url
      );
  
      if (moviesWithImages.length === 0) {
        container.innerHTML = '<p>No movies found with images</p>';
        return;
      }
  
      container.innerHTML = moviesWithImages
        .map(movie => `
          <div class="movie-card">
            <img src="${movie.primaryImage.url}" 
                 alt="${movie.titleText.text}">
            <div class="movie-info">
              <h3>${movie.titleText.text}</h3>
              <p>Year: ${movie.releaseYear?.year || 'N/A'}</p>
              <p>Type: ${movie.titleType?.text || 'Movie'}</p>
            </div>
          </div>
        `).join('');
    } catch (error) {
      console.error('Error:', error);
      container.innerHTML = '<p>Error loading movies. Please try again later.</p>';
    }
  }
  
  document.getElementById('moviesContainer').innerHTML = '<h1>Search for any movie!</h1>';
  
  document.getElementById('searchMovieBtn').addEventListener('click', searchMovies);
  document.getElementById('movieInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchMovies();
    }
  });