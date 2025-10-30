
let allTweets = [];        // all Tweet objects
let writtenTweets = [];    // only tweets with user-written text

function parseTweets(runkeeper_tweets) {
  if (!runkeeper_tweets) {
    alert('No tweets returned');
    return;
  }
  allTweets = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));
  writtenTweets = allTweets.filter(t => t.written); // per spec, search only user-written
  wireSearch();
}

function wireSearch() {
  const input = document.getElementById('textFilter');
  const tbody = document.getElementById('tweetTable');
  const searchTextSpan = document.getElementById('searchText');
  const searchCountSpan = document.getElementById('searchCount');

  // clear table helper
  const clearTable = () => { tbody.innerHTML = ''; };

  // render matches
  const render = (matches) => {
    clearTable();
    matches.forEach((t, i) => {
      // Tweet.getHTMLTableRow returns a full <tr> with (#, activity, tweet w/ clickable links)
      tbody.insertAdjacentHTML('beforeend', t.getHTMLTableRow(i + 1));
    });
  };

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();

    if (!q) {
      searchTextSpan.textContent = '';
      searchCountSpan.textContent = '0';
      clearTable();
      return;
    }

    searchTextSpan.textContent = q;

    const matches = writtenTweets.filter(t =>
      (t.writtenText || '').toLowerCase().includes(q)
    );

    searchCountSpan.textContent = String(matches.length);
    render(matches);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // get_saved_tweets.js provides this
  loadSavedRunkeeperTweets().then(parseTweets);
});
