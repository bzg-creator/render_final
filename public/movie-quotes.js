async function getQuotes() {
    const container = document.getElementById('quotesContainer');
    
    try {
        container.innerHTML = '<p>Loading...</p>';
        const response = await fetch('/api/movie-quotes');
        const [quote] = await response.json();

        container.innerHTML = `
            <div class="quote-card">
                <blockquote>${quote.quote}</blockquote>
                <div class="quote-info">
                    <span class="author">- ${quote.author}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p>Error loading quote. Please try again.</p>';
    }
}

getQuotes();
document.getElementById('getQuoteBtn').addEventListener('click', getQuotes);