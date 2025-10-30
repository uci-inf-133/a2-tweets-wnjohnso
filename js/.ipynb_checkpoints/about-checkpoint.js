let tweet_array = [];

/** Safe fixed-precision percent string like "95.12%" */
function fmtPct(n, d) {
  if (!d) return '0.00%';
  // Use math.js if present (assignment hints it is), else fallback
  const val = 100 * (n / d);
  if (window.math && math.format) {
    return math.format(val, { notation: 'fixed', precision: 2 }) + '%';
  }
  return val.toFixed(2) + '%';
}

/** "Monday, January 18, 2021" */
function fmtLongDate(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

/** Set all elements that share a class to the same text content */
function setTextByClass(cls, text) {
  const els = document.getElementsByClassName(cls);
  for (let i = 0; i < els.length; i++) els[i].innerText = text;
}

function parseTweets(runkeeper_tweets) {
  // Do not proceed if no tweets loaded
  if (runkeeper_tweets === undefined) {
    window.alert('No tweets returned');
    return;
  }

  // Build Tweet objects
  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // Total count
  document.getElementById('numberTweets').innerText = tweet_array.length;

  // Earliest / Latest dates
  const times = tweet_array.map(t => t.time.getTime());
  const firstDate = new Date(Math.min(...times));
  const lastDate  = new Date(Math.max(...times));
  document.getElementById('firstDate').innerText = fmtLongDate(firstDate);
  document.getElementById('lastDate').innerText  = fmtLongDate(lastDate);

  // Category counts
  const counts = {
    completed_event: 0,
    live_event: 0,
    achievement: 0,
    miscellaneous: 0
  };

  for (const t of tweet_array) {
    if (counts.hasOwnProperty(t.source)) counts[t.source]++;
    else counts.miscellaneous++; // safety fallback
  }

  // Update category count + % spans (classes are used multiple times)
  const total = tweet_array.length;

  setTextByClass('completedEvents', String(counts.completed_event));
  setTextByClass('completedEventsPct', fmtPct(counts.completed_event, total));

  setTextByClass('liveEvents', String(counts.live_event));
  setTextByClass('liveEventsPct', fmtPct(counts.live_event, total));

  setTextByClass('achievements', String(counts.achievement));
  setTextByClass('achievementsPct', fmtPct(counts.achievement, total));

  setTextByClass('miscellaneous', String(counts.miscellaneous));
  setTextByClass('miscellaneousPct', fmtPct(counts.miscellaneous, total));

  // Completed w/ user-written text (count + % of completed)
  const completed = tweet_array.filter(t => t.source === 'completed_event');
  const completedWritten = completed.filter(t => t.written);

  setTextByClass('written', String(completedWritten.length));
  setTextByClass('writtenPct', fmtPct(completedWritten.length, completed.length));
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
  // get_saved_tweets.js exposes loadSavedRunkeeperTweets()
  loadSavedRunkeeperTweets().then(parseTweets);
});