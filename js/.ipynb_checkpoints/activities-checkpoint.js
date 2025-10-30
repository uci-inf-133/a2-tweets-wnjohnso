
let tweet_array = [];

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const isWeekendIndex = i => (i === 0 || i === 6);
const mean = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

function parseTweets(runkeeper_tweets) {
  if (runkeeper_tweets === undefined) {
    alert('No tweets returned');
    return;
  }

  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  const completed = tweet_array.filter(t =>
    t.source === 'completed_event' &&
    t.activityType && t.activityType !== 'unknown' &&
    t.distance && t.distance > 0
  );

  // ---- Fill spans ----
  const types = [...new Set(completed.map(t => t.activityType))];
  document.getElementById('numberActivities').innerText = String(types.length);

  const freq = {};
  for (const t of completed) freq[t.activityType] = (freq[t.activityType] || 0) + 1;

  const top3 = Object.entries(freq)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(([name]) => name);

  const [firstMost, secondMost, thirdMost] = top3;
  if (document.getElementById('firstMost'))  document.getElementById('firstMost').innerText  = firstMost || '';
  if (document.getElementById('secondMost')) document.getElementById('secondMost').innerText = secondMost || '';
  if (document.getElementById('thirdMost'))  document.getElementById('thirdMost').innerText  = thirdMost || '';

  const rows = completed.map(t => ({
    activity: t.activityType,
    distance: Number(t.distance),
    dow: DOW[t.time.getDay()],
    dowIndex: t.time.getDay()
  }));

  // Longest/shortest activity type
  const byType = {};
  for (const r of rows) {
    if (!byType[r.activity]) byType[r.activity] = [];
    byType[r.activity].push(r.distance);
  }
  const typeMeans = Object.entries(byType).map(([k,v]) => [k, mean(v)]);
  typeMeans.sort((a,b)=>b[1]-a[1]);
  const longestActivityType = typeMeans[0]?.[0] || '';
  const shortestActivityType = typeMeans[typeMeans.length-1]?.[0] || '';

  if (document.getElementById('longestActivityType'))  document.getElementById('longestActivityType').innerText  = longestActivityType;
  if (document.getElementById('shortestActivityType')) document.getElementById('shortestActivityType').innerText = shortestActivityType;

  // Weekday vs weekend average
  const weekend = rows.filter(r => isWeekendIndex(r.dowIndex)).map(r => r.distance);
  const weekdays = rows.filter(r => !isWeekendIndex(r.dowIndex)).map(r => r.distance);
  const wkndLonger = mean(weekend) > mean(weekdays) ? 'weekends' : 'weekdays';
  if (document.getElementById('weekdayOrWeekendLonger')) {
    document.getElementById('weekdayOrWeekendLonger').innerText = wkndLonger;
  }

  // ---- Charts ----
  // Chart 1: counts by activity
  const specCounts = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: rows },
    mark: 'bar',
    encoding: {
      x: { field: 'activity', type: 'nominal', sort: '-y', title: 'Activity' },
      y: { aggregate: 'count', type: 'quantitative', title: 'Tweets' }
    }
  };
  vegaEmbed('#activityVis', specCounts, { actions: false });

  // Filter top 3 for distance-by-day charts
  const rowsTop3 = rows.filter(r => top3.includes(r.activity));

  // Chart 2: raw points
  const specPoints = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: rowsTop3 },
    mark: 'point',
    encoding: {
      x: { field: 'dow', type: 'ordinal', sort: DOW, title: 'Day of Week' },
      y: { field: 'distance', type: 'quantitative', title: 'Distance (mi)' },
      color: { field: 'activity', type: 'nominal', title: 'Activity' },
      tooltip: [
        { field: 'activity', title: 'Activity' },
        { field: 'dow', title: 'Day' },
        { field: 'distance', title: 'Miles', format: '.2f' }
      ]
    }
  };
  vegaEmbed('#distanceVis', specPoints, { actions: false });

  // Chart 3: mean-aggregated
  const specMeans = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: rowsTop3 },
    mark: 'bar',
    encoding: {
      x: { field: 'dow', type: 'ordinal', sort: DOW, title: 'Day of Week' },
      y: { aggregate: 'mean', field: 'distance', type: 'quantitative', title: 'Mean Distance (mi)' },
      color: { field: 'activity', type: 'nominal', title: 'Activity' },
      tooltip: [
        { field: 'activity', title: 'Activity' },
        { field: 'dow', title: 'Day' },
        { aggregate: 'mean', field: 'distance', title: 'Mean (mi)', format: '.2f' }
      ]
    }
  };
  vegaEmbed('#distanceVisAggregated', specMeans, { actions: false }).then(() => {
    const aggEl = document.getElementById('distanceVisAggregated');
    if (aggEl) aggEl.style.display = 'none';
  });

  // ---- after both vegaEmbed calls are done ----
  const raw = document.getElementById('distanceVis');
  const agg = document.getElementById('distanceVisAggregated');
  const btn = document.getElementById('aggregate');

  let showingMeans = false; // false = showing raw points, true = showing mean bars

  function renderToggle() {
    if (!raw || !agg || !btn) return;
    raw.style.display = showingMeans ? 'none'  : 'block';
    agg.style.display = showingMeans ? 'block' : 'none';
    btn.textContent   = showingMeans ? 'Show all activities' : 'Show means';
    btn.setAttribute('aria-pressed', String(showingMeans));
  }

  // Set initial label/state
  renderToggle();

  // Wire up click
  if (btn) {
    btn.addEventListener('click', () => {
      showingMeans = !showingMeans;
      renderToggle();
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadSavedRunkeeperTweets().then(parseTweets);
});
